(function () {
  function init() {
    const gridEl = document.getElementById('favoritesGrid');
    if (!gridEl) return;

    const favorites = getFavorites();
    if (favorites.length === 0) {
      gridEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">No favorite stores yet.</div>';
      return;
    }

    const allStores = getStoredStores();
    const favoriteStores = allStores.filter(s => favorites.includes(String(s.id)));

    if (favoriteStores.length === 0) {
      gridEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">No favorite stores yet.</div>';
      return;
    }

    renderFavorites(favoriteStores, gridEl);
    gridEl.addEventListener('click', onGridClick);
  }

  // 检查是否已打卡的辅助函数
  function hasCheckin(storeId) {
    const checkins = JSON.parse(localStorage.getItem('astore.checkins') || '{}');
    const visits = checkins[storeId];
    return Array.isArray(visits) && visits.length > 0;
  }

  function renderFavorites(stores, container) {
    container.innerHTML = stores.map(s => {
      const imageUrl = s.hero_image_url || './assets/placeholders/store-1.jpg';
      const location = [s.country || '', s.city || ''].filter(Boolean).join(' · ');
      const isCheckedIn = hasCheckin(String(s.id));
      const checkinBadge = isCheckedIn ? `
        <div class="checkin-badge">
          <span class="checkin-badge-icon">✓</span>
        </div>
      ` : '';
      return `
        <div class="featured-store-card" data-id="${s.id}">
          ${checkinBadge}
          <img src="${imageUrl}" alt="${s.name || ''}" onerror="this.src='./assets/placeholders/store-1.jpg'" />
          <div class="featured-store-info">
            <h4>${s.name || ''}</h4>
            <p><span class="pin-icon">📍</span> ${location || 'Location unknown'}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  function onGridClick(e) {
    // 点击卡片跳转到门市详情页
    const card = e.target.closest('[data-id]');
    if (card) {
      const id = card.getAttribute('data-id');
      window.location.href = `./storepage.html?id=${encodeURIComponent(id)}`;
    }
  }

  function getFavorites() {
    return JSON.parse(localStorage.getItem('astore.favorites') || '[]');
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });

  window.FavoritesPage = { init };
})();

