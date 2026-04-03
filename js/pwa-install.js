/**
 * PWA install bottom sheet: in-app browsers (IG, Threads, etc.) → open in external browser first.
 * Social in-app always eligible (ignores 24h dismiss); normal browsers use 24h dismiss after close.
 */

(function() {
  'use strict';

  function shouldShowInstallPrompt() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      console.log('PWA standalone — skip install prompt');
      return false;
    }

    if (window.innerWidth >= 1024) {
      console.log('Desktop width — skip install prompt');
      return false;
    }

    // In-app social: show every visit; do not let a prior Safari/Chrome dismiss block this
    if (isSocialInAppBrowser()) {
      console.log('Social in-app browser — show external-browser guidance');
      return true;
    }

    const dismissedAt = localStorage.getItem('installPromptDismissedAt');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const hours24 = 24 * 60 * 60 * 1000;

      if (now - dismissedTime < hours24) {
        console.log('Dismissed within 24h — skip install prompt');
        return false;
      }
    }

    return true;
  }

  /**
   * 社群／通訊 App 內建瀏覽器（無法像系統 Safari/Chrome 一樣安裝 PWA）
   * IG/Threads 在 iOS 上常偽裝成一般 Safari UA，需搭配 referrer、WebView 特徵判斷。
   */
  function isSocialInAppBrowser() {
    const ua = navigator.userAgent || '';

    if (/Instagram/i.test(ua)) return true;
    if (/Threads/i.test(ua)) return true;
    if (/Barcelona/i.test(ua)) return true;
    if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua)) return true;
    if (/Line\//i.test(ua)) return true;
    if (/TikTok/i.test(ua) || /musical_ly/i.test(ua)) return true;
    if (/Snapchat/i.test(ua)) return true;
    if (/WhatsApp/i.test(ua)) return true;
    if (/\bTwitter\b/i.test(ua)) return true;

    // 從社群連結進入時，document.referrer 常可辨識（即使 UA 沒有 App 名稱）
    const ref = document.referrer || '';
    if (ref && /https?:\/\/([\w-]+\.)*(instagram\.com|instagr\.am|threads\.(net|com)|facebook\.com|fb\.me|l\.facebook\.com|lm\.facebook\.com|l\.instagram\.com|twitter\.com|x\.com|tiktok\.com|line\.me|snapchat\.com|whatsapp\.com|wa\.me)(\/|$)/i.test(ref)) {
      return true;
    }

    // Android System WebView（多數 App 內開連結）：UA 常含 "; wv)" 或單獨的 wv 片段
    if (/android/i.test(ua) && /\bwv\b|\bwv\)/i.test(ua)) return true;

    // iOS：系統 Safari UA 通常含 Version/x.x；許多 App 內 WKWebView 省略 Version 但仍有 Mobile/
    if (/(iPhone|iPad|iPod)/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua) && /AppleWebKit/i.test(ua)) {
      if (/Mobile\//i.test(ua) && !/Version\/[\d.]+/i.test(ua)) return true;
    }

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
      'in-app-social': {
        title: 'Please open this page in your external browser.',
        steps: [
          'Tap “⋯” or “⋮” in the top-right corner.',
          'Choose “Open in Browser”, “Open in Safari”, or a similar option.'
        ]
      },
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
      }
    };

    return contents[browserType] || contents['other'];
  }

  /**
   * @param {object} content
   * @param {string} [installType] e.g. 'in-app-social' — closing does not set 24h dismiss
   */
  function createInstallBottomSheet(content, installType) {
    if (document.getElementById('pwa-install-sheet')) {
      return;
    }

    const sheet = document.createElement('div');
    sheet.id = 'pwa-install-sheet';
    sheet.className = 'pwa-install-sheet';
    if (installType) {
      sheet.dataset.installType = installType;
    }
    
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
      const sheetEl = document.getElementById('pwa-install-sheet');
      if (sheetEl && sheetEl.dataset.installType === 'in-app-social') {
        return;
      }
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

    const browserType = isSocialInAppBrowser() ? 'in-app-social' : detectBrowser();
    console.log('PWA install prompt type:', browserType);

    const content = getInstallContent(browserType);
    createInstallBottomSheet(content, browserType);
    
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
    init: initInstallPrompt
  };
})();

