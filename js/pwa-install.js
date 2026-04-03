/**
 * PWA 安装引导 Bottom Sheet 系统
 * 优先侦测 Instagram / Threads 等社群 App 内置浏览器，引导用外部浏览器开启；
 * 否则依浏览器类型显示对应安装指引。
 */

(function() {
  'use strict';

  // 检查是否应该显示安装提示
  function shouldShowInstallPrompt() {
    // 1. 检查是否为 PWA 模式
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        document.referrer.includes('android-app://');
    
    if (isStandalone) {
      console.log('PWA 模式，不显示安装提示');
      return false;
    }

    // 2. 检查是否在 24 小时内关闭过
    const dismissedAt = localStorage.getItem('installPromptDismissedAt');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const hours24 = 24 * 60 * 60 * 1000;
      
      if (now - dismissedTime < hours24) {
        console.log('24 小时内已关闭过，不显示安装提示');
        return false;
      }
    }

    // 3. 检查是否为桌面设备（宽度 >= 1024px）
    if (window.innerWidth >= 1024) {
      console.log('桌面设备，不显示安装提示');
      return false;
    }

    return true;
  }

  /**
   * 社群 App 内置浏览器（IG、Threads、Facebook 等 WebView）：无法像系统 Safari/Chrome 一样安装 PWA
   */
  function detectSocialInAppBrowser() {
    const ua = navigator.userAgent || '';
    if (!ua) return false;
    if (/Instagram/i.test(ua)) return true;
    if (/Threads/i.test(ua)) return true;
    // Meta Threads 部分版本 UA 会带内部代号
    if (/Barcelona/i.test(ua)) return true;
    if (/FB_IAB|FBAN|FBAV|FB4A|FBIOS/i.test(ua)) return true;
    return false;
  }

  /**
   * 检测浏览器类型
   */
  function detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    
    // 检查是否为 iOS 设备
    const isIOS = /iphone|ipad|ipod/.test(ua);
    
    if (isIOS) {
      // 检查是否为 iOS Safari
      const isSafari = !/crios|fxios/.test(ua) && /safari/.test(ua);
      
      if (isSafari) {
        // 检查 iOS 版本
        const iosVersionMatch = ua.match(/os (\d+)_/);
        const iosVersion = iosVersionMatch ? parseInt(iosVersionMatch[1], 10) : 0;
        
        if (iosVersion <= 18) {
          return 'ios-safari-old';
        } else {
          return 'ios-safari-new';
        }
      }
      
      // 检查是否为 iOS Chrome
      if (/crios/.test(ua)) {
        return 'ios-chrome';
      }
      
      // iOS Edge
      if (/edgios/.test(ua)) {
        return 'ios-chrome'; // 使用相同的文案
      }
      
      // 其他 iOS 浏览器使用 fallback
      return 'other';
    }
    
    // 检查是否为 Android Chrome
    if (/android/.test(ua) && /chrome/.test(ua) && !/edg/.test(ua)) {
      return 'android-chrome';
    }
    
    // 其他浏览器
    return 'other';
  }

  /**
   * 获取对应浏览器的文案
   */
  function getInstallContent(browserType) {
    const contents = {
      'ios-safari-new': {
        title: 'Add AStore Trip to your Home Screen for the best experience.',
        steps: [
          'Tap “⋯” at the bottom, then tap 「Share」',
          'Choose “Add to Home Screen”',
          'Tap “Add” in the corner'
        ]
      },
      'ios-safari-old': {
        title: 'Add AStore Trip to your Home Screen for the best experience.',
        steps: [
          'Tap 「Share」 at the bottom',
          'Choose “Add to Home Screen”',
          'Tap “Add” in the corner'
        ]
      },
      'ios-chrome': {
        title: 'Add AStore Trip to your Home Screen for a smoother experience.',
        steps: [
          'Tap 「Share」 in the toolbar',
          'Choose “Add to Home Screen”',
          'Tap “Add” in the corner'
        ]
      },
      'android-chrome': {
        title: 'Install the AStore Trip app for quicker access.',
        steps: [
          'Tap “⋮” in the top right',
          'Choose “Install app” or “Add to Home screen”',
          'Follow the prompts to finish'
        ]
      },
      'other': {
        title: 'Add AStore Trip to your Home Screen for the best experience.',
        steps: [
          'Use your browser’s menu and look for “Add to Home screen” to install.'
        ]
      },
      'in-app-social': {
        title: 'Please open this page in your external browser.',
        steps: [
          'Tap “⋯” or “⋮” in the top-right corner.',
          'Choose “Open in Browser”, “Open in Safari”, or a similar option.'
        ]
      }
    };

    return contents[browserType] || contents['other'];
  }

  /**
   * 创建 Bottom Sheet HTML
   */
  function createInstallBottomSheet(content) {
    // 检查是否已存在
    if (document.getElementById('pwa-install-sheet')) {
      return;
    }

    const sheet = document.createElement('div');
    sheet.id = 'pwa-install-sheet';
    sheet.className = 'pwa-install-sheet';
    
    const stepsHTML = content.steps.map((step, index) => {
      // 处理包含图标的步骤文本
      // 替换「分享」和「分享按鈕」为图标
      const stepWithIcon = step
        .replace(/「分享按鈕」/g, '「<img src="./assets/icon/ios_share.svg" class="share-icon" alt="Share" />」')
        .replace(/「分享」/g, '「<img src="./assets/icon/ios_share.svg" class="share-icon" alt="Share" />」')
        .replace(/「Share」/g, '「<img src="./assets/icon/ios_share.svg" class="share-icon" alt="Share" />」');
      return `<div class="install-step">
        <span class="step-number">${index + 1}</span>
        <span class="step-text">${stepWithIcon}</span>
      </div>`;
    }).join('');

    sheet.innerHTML = `
      <div class="install-backdrop" id="installBackdrop"></div>
      <div class="install-content">
        <button class="install-close-btn" id="installCloseBtn" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="install-icon">
          <img src="./assets/app_icon.png" alt="AStore Trip" />
        </div>
        <h3 class="install-title">${content.title}</h3>
        <div class="install-steps">
          ${stepsHTML}
        </div>
      </div>
    `;

    document.body.appendChild(sheet);

    // 绑定关闭事件
    const closeBtn = document.getElementById('installCloseBtn');
    const backdrop = document.getElementById('installBackdrop');

    const closeSheet = () => {
      hideInstallSheet();
      // 记录关闭时间
      localStorage.setItem('installPromptDismissedAt', Date.now().toString());
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', closeSheet);
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeSheet);
    }
  }

  /**
   * 显示 Bottom Sheet
   */
  function showInstallSheet() {
    const sheet = document.getElementById('pwa-install-sheet');
    if (sheet) {
      sheet.classList.add('show');
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
  }

  /**
   * 隐藏 Bottom Sheet
   */
  function hideInstallSheet() {
    const sheet = document.getElementById('pwa-install-sheet');
    if (sheet) {
      sheet.classList.remove('show');
      document.body.style.overflow = ''; // 恢复滚动
    }
  }

  /**
   * 初始化安装提示
   */
  function initInstallPrompt() {
    // 检查是否应该显示
    if (!shouldShowInstallPrompt()) {
      return;
    }

    // 社群内置浏览器优先 → 引导外部浏览器；否则按系统浏览器显示 PWA 安装说明
    const browserType = detectSocialInAppBrowser() ? 'in-app-social' : detectBrowser();
    console.log('检测到浏览器类型:', browserType, detectSocialInAppBrowser() ? '(social in-app)' : '');

    // 获取对应文案
    const content = getInstallContent(browserType);

    // 创建并显示 Bottom Sheet
    createInstallBottomSheet(content);
    
    // 延迟显示，确保 DOM 已渲染
    setTimeout(() => {
      showInstallSheet();
    }, 500);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstallPrompt);
  } else {
    initInstallPrompt();
  }

  // 监听窗口大小变化（如果从桌面缩小到移动端，可能需要显示）
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const sheet = document.getElementById('pwa-install-sheet');
      if (!sheet && shouldShowInstallPrompt()) {
        initInstallPrompt();
      } else if (sheet && !shouldShowInstallPrompt()) {
        hideInstallSheet();
      }
    }, 300);
  });

  // 导出函数供外部调用（如果需要）
  window.PWAInstall = {
    show: showInstallSheet,
    hide: hideInstallSheet,
    init: initInstallPrompt,
    detectSocialInApp: detectSocialInAppBrowser
  };
})();

