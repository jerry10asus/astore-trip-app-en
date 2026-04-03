(function () {
  async function init() {
    renderSummary();
    // 先加载勋章数据，然后检查解锁
    await renderMedals();
    // 检查并解锁勋章（确保状态是最新的）
    if (typeof checkAndUnlockBadges === 'function') {
      checkAndUnlockBadges();
      // 重新渲染以显示最新解锁状态
      await renderMedals();
      // 更新统计
      renderSummary();
    }
  }

  function renderSummary() {
    const visitedCountEl = document.getElementById('achVisitedCount');
    const badgeCountEl = document.getElementById('achBadgeCount');
    const visitedMap = JSON.parse(localStorage.getItem('astore.checkins') || '{}');
    const visitedCount = Object.values(visitedMap).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    const badges = JSON.parse(localStorage.getItem('astore.unlockedBadges') || '[]');
    if (visitedCountEl) visitedCountEl.textContent = String(visitedCount);
    if (badgeCountEl) badgeCountEl.textContent = String(badges.length);
  }

  // 渲染勋章（从 Google Sheet 获取）
  async function renderMedals() {
    const container = document.getElementById('countryFlagsGrid');
    const loadingEl = document.getElementById('medalsLoading');
    if (!container) return;

    // 显示 loading 状态
    if (loadingEl) {
      loadingEl.style.display = 'flex';
    }

    // 获取已解锁的勋章列表
    const unlockedBadges = JSON.parse(localStorage.getItem('astore.unlockedBadges') || '[]');
    const unlockedSet = new Set(unlockedBadges.map(id => String(id)));

    // 每次打开成就页都重新获取勋章数据
    let medals = [];
    try {
      medals = await fetchMedals();
    } catch (error) {
      console.error('获取勋章数据失败:', error);
      // 如果获取失败，尝试使用缓存
      medals = getStoredMedals();
      if (!medals || medals.length === 0) {
        medals = [];
      }
    }

    // 隐藏 loading 状态
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }

    // 如果没有勋章数据，显示空状态
    if (!medals || medals.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No badge data yet.</div>';
      return;
    }

    // 渲染所有勋章
    container.innerHTML = medals.map(medal => {
      const isUnlocked = unlockedSet.has(String(medal.id));
      return `
        <div class="country-flag-item ${isUnlocked ? 'visited' : ''}">
          <div class="flag-circle">
            <span class="flag-emoji">${medal.image || '🍎'}</span>
          </div>
          <div class="country-name">${medal.name || ''}</div>
        </div>
      `;
    }).join('');
  }

  function getStoredStores() {
    return JSON.parse(localStorage.getItem('astore.stores') || '[]');
  }

  window.AchievementsPage = { init };
})();
