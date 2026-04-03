// 加载首页数据的函数
async function loadHomePageData() {
  // 每次进入页面都重新加载门市数据
  console.log('加载门市数据...');
  let stores = await fetchStores();
  if (!stores || stores.length === 0) {
    // 如果获取失败，使用缓存数据
    stores = getStoredStores();
  }

  // 加载勋章数据（如果还没有）
  const medals = getStoredMedals();
  if (!medals || medals.length === 0) {
    try {
      await fetchMedals();
    } catch (error) {
      console.error('获取勋章数据失败:', error);
    }
  }
  
  // 检查并解锁勋章
  if (typeof checkAndUnlockBadges === 'function') {
    checkAndUnlockBadges();
  }

  renderFeatured(stores);
  updateAchievements();
  updateNearestStore(stores);
  await loadProduct();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadHomePageData();
  
  // 定期刷新门市数据（每分钟）
  setInterval(async () => {
    console.log('自动刷新门市数据...');
    try {
      await fetchStores();
      const updatedStores = getStoredStores();
      renderFeatured(updatedStores);
      updateNearestStore(updatedStores);
    } catch (error) {
      console.error('刷新门市数据失败:', error);
    }
  }, 60 * 1000); // 1分钟 = 60000毫秒
  
  // 监听页面可见性变化（当从其他 tab 切换回来时重新加载数据）
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      // 页面变为可见时，重新加载数据
      console.log('页面变为可见，重新加载数据...');
      await loadHomePageData();
    }
  });
});

// 加载并显示产品
async function loadProduct() {
  // 每次进入首页都重新从 Google Sheet 获取最新产品数据
  try {
    console.log('正在获取最新产品数据...');
    const products = await fetchProducts();
    
    // 如果获取成功且有数据，随机选择一笔产品
    if (products && products.length > 0) {
      const randomIndex = Math.floor(Math.random() * products.length);
      const selectedProduct = products[randomIndex];
      console.log('随机选择的产品:', selectedProduct);
      renderProduct(selectedProduct);
    } else {
      // 如果获取失败或为空，尝试使用缓存数据
      const cachedProducts = getStoredProducts();
      if (cachedProducts && cachedProducts.length > 0) {
        const randomIndex = Math.floor(Math.random() * cachedProducts.length);
        const selectedProduct = cachedProducts[randomIndex];
        console.log('使用缓存产品数据:', selectedProduct);
        renderProduct(selectedProduct);
      } else {
        // 如果缓存也没有，使用默认产品
        renderProduct({ name: 'iMac', year: '1998', image_url: './assets/placeholders/imac-1998.png' });
      }
    }
  } catch (error) {
    console.error('获取产品数据失败:', error);
    // 如果获取失败，尝试使用缓存数据
    const cachedProducts = getStoredProducts();
    if (cachedProducts && cachedProducts.length > 0) {
      const randomIndex = Math.floor(Math.random() * cachedProducts.length);
      const selectedProduct = cachedProducts[randomIndex];
      console.log('使用缓存产品数据（获取失败）:', selectedProduct);
      renderProduct(selectedProduct);
    } else {
      // 如果缓存也没有，使用默认产品
      renderProduct({ name: 'iMac', year: '1998', image_url: './assets/placeholders/imac-1998.png' });
    }
  }
}

// 渲染产品信息
function renderProduct(product) {
  const productImage = document.getElementById('productImage');
  const productYear = document.getElementById('productYear');
  const productName = document.getElementById('productName');
  
  if (productImage) {
    productImage.src = product.image_url || './assets/placeholders/imac-1998.png';
    productImage.alt = product.name || 'Product';
    productImage.onerror = function() {
      this.src = './assets/placeholders/imac-1998.png';
    };
  }
  
  if (productYear) {
    productYear.textContent = product.year || '1998';
  }
  
  if (productName) {
    productName.textContent = product.name || 'iMac';
  }
}

function renderFeatured(stores) {
  const list = document.getElementById("featuredList");
  if (!list) return;
  
  // 篩選所有精選門市，如果沒有則取前三個
  const featuredStores = stores.filter(s => s.featured);
  const displayStores = featuredStores.length > 0 ? featuredStores : stores.slice(0, 3);
  
  // 检查是否已打卡的辅助函数
  function hasCheckin(storeId) {
    const checkins = JSON.parse(localStorage.getItem('astore.checkins') || '{}');
    const visits = checkins[storeId];
    return Array.isArray(visits) && visits.length > 0;
  }

  list.innerHTML = displayStores.map(
    s => {
      const imageUrl = s.hero_image_url || './assets/placeholders/store-1.jpg';
      const isCheckedIn = hasCheckin(String(s.id));
      const checkinBadge = isCheckedIn ? `
        <div class="checkin-badge">
          <span class="checkin-badge-icon">✓</span>
        </div>
      ` : '';
      return `
        <div class="featured-store-card" onclick="location.href='./storepage.html?id=${s.id}'">
          ${checkinBadge}
          <img src="${imageUrl}" alt="${s.name || ''}" onerror="this.src='./assets/placeholders/store-1.jpg'" />
          <div class="featured-store-info">
            <h4>${s.name || ''}</h4>
            <p><span class="pin-icon">📍</span> ${s.country || ''}</p>
          </div>
        </div>`;
    }
  ).join("");
}

function updateAchievements() {
  // 获取打卡数据 - 是一个对象，key 是门市 ID，value 是打卡日期数组
  const visitedMap = JSON.parse(localStorage.getItem("astore.checkins") || "{}");
  // 计算已打卡的门市数（有多少个不同的门市 ID）
  const visitedStoreIds = Object.keys(visitedMap).filter(id => {
    const visits = visitedMap[id];
    return Array.isArray(visits) && visits.length > 0;
  });
  const visitedCount = visitedStoreIds.length;
  
  // 获取勋章数据
  const badges = JSON.parse(localStorage.getItem("astore.unlockedBadges") || "[]");
  const badgeCount = Array.isArray(badges) ? badges.length : 0;
  
  const visitedCountEl = document.getElementById("visitedCount");
  const badgeCountEl = document.getElementById("badgeCount");
  if (visitedCountEl) visitedCountEl.textContent = visitedCount;
  if (badgeCountEl) badgeCountEl.textContent = badgeCount;
}

// 计算两点之间的距离（使用 Haversine 公式）
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 找到最近的门市
function findNearestStore(stores, userLat, userLng) {
  if (!stores || stores.length === 0) return null;
  
  let nearestStore = null;
  let minDistance = Infinity;
  
  stores.forEach(store => {
    if (!store.coords || !store.coords.lat || !store.coords.lng) return;
    
    const distance = calculateDistance(
      userLat,
      userLng,
      store.coords.lat,
      store.coords.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestStore = store;
    }
  });
  
  return nearestStore;
}

// 获取缓存的位置信息
function getCachedLocation() {
  try {
    const cached = localStorage.getItem('astore.userLocation');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const now = Date.now();
    // 缓存有效期：30分钟
    const cacheExpiry = 30 * 60 * 1000;
    
    if (now - data.timestamp < cacheExpiry) {
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// 保存位置信息到缓存
function saveLocationToCache(lat, lng, nearestStoreId) {
  try {
    const data = {
      lat,
      lng,
      nearestStoreId,
      timestamp: Date.now()
    };
    localStorage.setItem('astore.userLocation', JSON.stringify(data));
  } catch (e) {
    console.error('保存位置缓存失败:', e);
  }
}

// 检查是否已拒绝位置权限
function isLocationPermissionDenied() {
  try {
    return localStorage.getItem('astore.locationDenied') === 'true';
  } catch (e) {
    return false;
  }
}

// 标记位置权限被拒绝
function markLocationDenied() {
  try {
    localStorage.setItem('astore.locationDenied', 'true');
  } catch (e) {
    console.error('保存拒绝状态失败:', e);
  }
}

// 更新最近的Apple Store显示
async function updateNearestStore(stores) {
  const nearestStoreTitle = document.querySelector('.nearest-store-title');
  const nearestStoreSubtitle = document.querySelector('.nearest-store-subtitle');
  const goBtn = document.querySelector('.go-btn');
  const mapStoreName = document.querySelector('#mapStoreName');
  const mapAddress = document.querySelector('.map-address');
  
  if (!nearestStoreTitle || !nearestStoreSubtitle || !goBtn) return;
  
  // 辅助函数：更新UI显示
  function updateUI(store) {
    if (!store) return;
    
    nearestStoreTitle.textContent = 'Nearest Apple Store';
    nearestStoreSubtitle.textContent = store.name || 'Xinyi A13';
    
    if (mapStoreName) {
      mapStoreName.textContent = `Apple ${store.name || ''}`;
    }
    if (mapAddress) {
      mapAddress.textContent = store.address || '13 Songshou Rd, Xinyi District, Taipei City';
    }
    
    if (store.google_map_url) {
      goBtn.onclick = () => {
        window.open(store.google_map_url, '_blank');
      };
    }
    
    // 渲染 Google Map iframe
    const mapContainer = document.getElementById('nearestStoreMapContainer');
    if (mapContainer && store.google_map_iframe) {
      mapContainer.innerHTML = store.google_map_iframe;
    }
  }
  
  // 检查缓存
  const cached = getCachedLocation();
  if (cached && cached.nearestStoreId) {
    const cachedStore = stores.find(s => String(s.id) === String(cached.nearestStoreId));
    if (cachedStore) {
      updateUI(cachedStore);
      return; // 使用缓存，不请求位置
    }
  }
  
  // 如果之前拒绝过权限，直接使用默认值
  if (isLocationPermissionDenied()) {
    if (stores && stores.length > 0) {
      updateUI(stores[0]);
    }
    return;
  }
  
  // 获取用户位置
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const nearestStore = findNearestStore(stores, userLat, userLng);
        
        if (nearestStore) {
          // 保存到缓存
          saveLocationToCache(userLat, userLng, nearestStore.id);
          updateUI(nearestStore);
        } else {
          // 如果找不到最近的门市，使用默认值
          if (stores && stores.length > 0) {
            updateUI(stores[0]);
          }
        }
      },
      (error) => {
        console.error('获取位置失败:', error);
        
        // 如果用户拒绝权限，标记并缓存
        if (error.code === error.PERMISSION_DENIED) {
          markLocationDenied();
        }
        
        // 使用默认值或第一个门市
        if (stores && stores.length > 0) {
          updateUI(stores[0]);
        }
      },
      {
        timeout: 10000, // 10秒超时
        maximumAge: 300000, // 5分钟内使用缓存的位置
        enableHighAccuracy: false // 不需要高精度，节省电量
      }
    );
  } else {
    // 浏览器不支持地理位置API，使用默认值
    console.warn('浏览器不支持地理位置API');
    if (stores && stores.length > 0) {
      updateUI(stores[0]);
    }
  }
}
