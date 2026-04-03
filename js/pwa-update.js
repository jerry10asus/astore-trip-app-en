/**
 * PWA 更新检测与提示系统
 * 负责检测 Service Worker 更新并显示更新提示 UI
 */

(function() {
  'use strict';

  // 检查是否支持 Service Worker
  if (!('serviceWorker' in navigator)) {
    return;
  }

  let registration = null;
  let waitingWorker = null;

  /**
   * 初始化更新检测
   */
  function initUpdateCheck() {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      
      registration = reg;
      
      // 检查是否已有 waiting worker
      if (reg.waiting) {
        waitingWorker = reg.waiting;
        showUpdatePrompt();
        return;
      }
      
      // 监听新的 service worker 安装
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        
        if (!newWorker) return;
        
        const handleStateChange = () => {
          if (newWorker.state === 'installed') {
            // 检查是否有活跃的 controller（表示不是首次安装）
            if (navigator.serviceWorker.controller) {
              // 新版本已安装，进入 waiting 状态
              waitingWorker = newWorker;
              showUpdatePrompt();
            }
          }
        };
        
        newWorker.addEventListener('statechange', handleStateChange);
        
        // 如果已经在 installed 状态，立即检查
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = newWorker;
          showUpdatePrompt();
        }
      });
      
      // 如果已经有 installing worker，也监听它
      if (reg.installing) {
        const installingWorker = reg.installing;
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = installingWorker;
            showUpdatePrompt();
          }
        });
      }
    }).catch(err => {
      console.error('Service Worker registration error:', err);
    });
  }

  /**
   * 显示更新提示
   */
  function showUpdatePrompt() {
    const updatePrompt = document.getElementById('pwa-update-prompt');
    if (updatePrompt) {
      updatePrompt.classList.add('show');
    }
  }

  /**
   * 隐藏更新提示
   */
  function hideUpdatePrompt() {
    const updatePrompt = document.getElementById('pwa-update-prompt');
    if (updatePrompt) {
      updatePrompt.classList.remove('show');
    }
  }

  /**
   * 执行更新
   */
  function performUpdate() {
    if (!waitingWorker) {
      console.warn('No waiting worker found');
      return;
    }

    // 隐藏更新提示
    hideUpdatePrompt();

    // 监听 controllerchange 事件，当新 worker 接管后重新加载
    const handleControllerChange = () => {
      // 重新加载页面以使用新版本
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true });

    // 发送 skipWaiting 消息给 service worker
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // 如果 controllerchange 没有在 2 秒内触发，强制重载
    setTimeout(() => {
      if (navigator.serviceWorker.controller) {
        window.location.reload();
      }
    }, 2000);
  }

  /**
   * 创建更新提示 UI
   */
  function createUpdatePrompt() {
    // 检查是否已存在
    if (document.getElementById('pwa-update-prompt')) {
      return;
    }

    const prompt = document.createElement('div');
    prompt.id = 'pwa-update-prompt';
    prompt.className = 'pwa-update-prompt';
    prompt.innerHTML = `
      <div class="pwa-update-content">
        <p class="pwa-update-message">A new version is available. Update now?</p>
        <div class="pwa-update-actions">
          <button class="pwa-update-btn" id="pwa-update-confirm">Update</button>
          <button class="pwa-update-dismiss" id="pwa-update-dismiss">Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(prompt);

    // 绑定事件
    const confirmBtn = document.getElementById('pwa-update-confirm');
    const dismissBtn = document.getElementById('pwa-update-dismiss');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        performUpdate();
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        hideUpdatePrompt();
      });
    }
  }

  /**
   * 定期检查更新
   */
  function checkForUpdates() {
    if (registration) {
      registration.update().catch(err => {
        console.error('Update check failed:', err);
      });
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createUpdatePrompt();
      initUpdateCheck();
    });
  } else {
    createUpdatePrompt();
    initUpdateCheck();
  }

  // 定期检查更新（每小时检查一次）
  setInterval(checkForUpdates, 60 * 60 * 1000);

  // 当页面获得焦点时检查更新
  window.addEventListener('focus', checkForUpdates);

  // 导出函数供外部调用（如果需要）
  window.PWAUpdate = {
    check: checkForUpdates,
    show: showUpdatePrompt,
    hide: hideUpdatePrompt
  };
})();

