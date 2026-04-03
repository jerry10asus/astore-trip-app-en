async function fetchStores() {
  const url = "https://script.google.com/macros/s/AKfycbzpkRcxtF8sIHeqyJm94El_wUwwjDzNVzUxnaXcZ2jk3gqE9vyL-i8DyKP0irBsNQVX-g/exec";
  const res = await fetch(url);
  const data = await res.json();
  
  // 處理營業時間的輔助函數
  function parseHours(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
      return { open: '11:00', close: '21:30' };
    }
    
    const trimmed = timeStr.trim();
    
    // 檢查是否為特殊值（休息、always open 等）
    const specialValues = ['休息', 'always open', 'always open', 'Always Open', 'ALWAYS OPEN'];
    if (specialValues.some(val => trimmed.toLowerCase() === val.toLowerCase() || trimmed === val)) {
      return { 
        open: '', 
        close: '', 
        text: trimmed // 保留原始文字
      };
    }
    
    // 支援全形和半形破折號、全形和半形空格
    // 匹配各種可能的時間格式：9:30 - 20:00、11:00 – 17:00、9:30-20:00 等
    const timePattern = /^(\d{1,2}:\d{2})\s*[－\-–—]\s*(\d{1,2}:\d{2})$/;
    const match = trimmed.match(timePattern);
    
    if (match) {
      return {
        open: match[1].trim(),
        close: match[2].trim()
      };
    }
    
    // 如果無法解析，嘗試用破折號分割
    const parts = trimmed.split(/[－\-–—]/);
    if (parts.length === 2) {
      const open = parts[0].trim();
      const close = parts[1].trim();
      // 檢查是否為有效的時間格式（HH:MM）
      const timeFormat = /^\d{1,2}:\d{2}$/;
      if (timeFormat.test(open) && timeFormat.test(close)) {
        return { open, close };
      }
    }
    
    // 如果無法解析為時間格式，視為特殊值，保留原始文字
    return { 
      open: '', 
      close: '', 
      text: trimmed 
    };
  }
  
  // 轉換資料格式以符合應用程式需求
  const stores = data.map(store => {
    const monHours = parseHours(store.opening_time_mon);
    const tueHours = parseHours(store.opening_time_tue);
    const wedHours = parseHours(store.opening_time_wed);
    const thuHours = parseHours(store.opening_time_thu);
    const friHours = parseHours(store.opening_time_fri);
    const satHours = parseHours(store.opening_time_sat);
    const sunHours = parseHours(store.opening_time_sun);
    
    return {
      id: String(store.store_id || store.id || ''),
      name: store.name || '',
      featured: store.featured === 'TRUE' || store.featured === true || store.featured === 'true',
      area: store.area || '',
      country: store.country || '',
      city: store.city || '',
      address: store.address || '',
      coords: {
        lat: parseFloat(store.latitude) || 0,
        lng: parseFloat(store.longitude) || 0
      },
      google_map_url: store.google_map_url || '',
      google_map_iframe: store.google_map_iframe || '',
      hero_image_url: store.hero_image_url || './assets/placeholders/store-1.jpg',
      gallery_images: [
        store['gallery_image-1_url'],
        store['gallery_image-2_url'],
        store['gallery_image-3_url'],
        store['gallery_image-4_url'],
        store['gallery_image-5_url']
      ].filter(Boolean),
      description: store.description || '',
      hours: [
        { weekday: 1, open: monHours.open, close: monHours.close, text: monHours.text },
        { weekday: 2, open: tueHours.open, close: tueHours.close, text: tueHours.text },
        { weekday: 3, open: wedHours.open, close: wedHours.close, text: wedHours.text },
        { weekday: 4, open: thuHours.open, close: thuHours.close, text: thuHours.text },
        { weekday: 5, open: friHours.open, close: friHours.close, text: friHours.text },
        { weekday: 6, open: satHours.open, close: satHours.close, text: satHours.text },
        { weekday: 0, open: sunHours.open, close: sunHours.close, text: sunHours.text }
      ],
      phone: store.phone_number || ''
    };
  });
  
  localStorage.setItem("astore.stores", JSON.stringify(stores));
  return stores;
}

function getStoredStores() {
  return JSON.parse(localStorage.getItem("astore.stores") || "[]");
}

// 获取产品数据
async function fetchProducts() {
  const url = "https://script.google.com/macros/s/AKfycbygBUfOy0E5SgwBZub_kcvCzSQ6bSigZgfRQyw_G7LHaBX-N4fvf5uy6-OGMaLNgtAZpg/exec";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    
    // 调试：查看原始数据
    console.log('获取到的产品原始数据:', data);
    
    const products = data.map(product => ({
      id: String(product.product_id || product.id || ''),
      name: product.product_name || '',
      year: product.product_year || '',
      image_url: product.product_image || './assets/placeholders/imac-1998.png'
    }));
    
    // 调试：查看处理后的产品数据
    console.log('处理后的产品数据:', products);
    
    localStorage.setItem("astore.products", JSON.stringify(products));
    return products;
  } catch (error) {
    console.error('获取产品数据失败:', error);
    return getStoredProducts();
  }
}

function getStoredProducts() {
  return JSON.parse(localStorage.getItem("astore.products") || "[]");
}

// 获取勋章数据
async function fetchMedals() {
  // 这个 URL 需要用户提供
  const url = "https://script.google.com/macros/s/AKfycby_mAaxBqgPNdnyuI-F-0PbpyBggFzY6wgRvgsfL5wwilvwrPsvO2OtaZ6W77Bt_kmi/exec";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    
    // 调试：查看原始数据
    console.log('获取到的勋章原始数据:', data);
    
    const medals = data.map((medal, index) => {
      let idVal = medal.medal_id;
      if (idVal === '' || idVal === undefined || idVal === null) {
        idVal = medal.id;
      }
      const medalName = String(medal.medal_name || '').trim();
      if (
        (idVal === '' || idVal === undefined || idVal === null) &&
        (medalName === 'First Check-in' || medalName === 'First check-in' || medalName === '首次打卡')
      ) {
        idVal = '0';
      }
      if (idVal === '' || idVal === undefined || idVal === null) {
        idVal = String(index);
      }
      return {
        id: String(idVal),
        name: medal.medal_name || '',
        image: medal.medal_image || '🍎'
      };
    });
    
    // 调试：查看处理后的勋章数据
    console.log('处理后的勋章数据:', medals);
    
    localStorage.setItem("astore.medals", JSON.stringify(medals));
    return medals;
  } catch (error) {
    console.error('获取勋章数据失败:', error);
    return getStoredMedals();
  }
}

function getStoredMedals() {
  return JSON.parse(localStorage.getItem("astore.medals") || "[]");
}

// 检查并解锁勋章
function checkAndUnlockBadges() {
  const checkins = JSON.parse(localStorage.getItem('astore.checkins') || '{}');
  const stores = getStoredStores();
  const medals = getStoredMedals();
  
  console.log('=== 开始检查勋章解锁 ===');
  console.log('门市数据:', stores.length, '笔');
  console.log('勋章数据:', medals.length, '笔');
  console.log('打卡记录:', Object.keys(checkins).length, '个门市');
  
  if (!stores || stores.length === 0) {
    console.warn('⚠ 没有门市数据，无法检查勋章');
    return;
  }
  
  if (!medals || medals.length === 0) {
    console.warn('⚠ 没有勋章数据，无法检查勋章');
    return;
  }
  
  // 获取已解锁的勋章列表
  let unlockedBadges = JSON.parse(localStorage.getItem('astore.unlockedBadges') || '[]');
  const unlockedSet = new Set(unlockedBadges.map(id => String(id)));
  
  // 获取所有已打卡的门市ID
  const visitedStoreIds = Object.keys(checkins).filter(id => {
    const visits = checkins[id];
    return Array.isArray(visits) && visits.length > 0;
  });
  
  // 获取已打卡的门市数据
  const visitedStores = stores.filter(s => visitedStoreIds.includes(String(s.id)));
  
  // 1. 检查"首次打卡"勋章（medal_id: 0）
  // 如果累计造访1间门市即可获得
  console.log('检查首次打卡勋章:', {
    visitedStoreIdsCount: visitedStoreIds.length,
    medalsCount: medals.length,
    unlockedBadges: Array.from(unlockedSet)
  });
  
  if (visitedStoreIds.length >= 1) {
    // 尝试多种方式查找首次打卡勋章
    const firstCheckinMedal = medals.find(m => 
      String(m.id) === '0' || 
      m.id === 0 || 
      m.name === '首次打卡' ||
      m.medal_name === '首次打卡' ||
      m.name === 'First check-in' ||
      m.name === 'First Check-in' ||
      m.medal_name === 'First check-in' ||
      m.medal_name === 'First Check-in'
    );
    
    console.log('找到的首次打卡勋章:', firstCheckinMedal);
    
    if (firstCheckinMedal) {
      const medalId = String(firstCheckinMedal.id);
      if (!unlockedSet.has(medalId)) {
        unlockedBadges.push(medalId);
        unlockedSet.add(medalId);
        console.log('✓ 解锁勋章: 首次打卡 (medal_id: ' + medalId + ')');
      } else {
        console.log('首次打卡勋章已经解锁');
      }
    } else {
      console.warn('⚠ 找不到首次打卡勋章，所有勋章:', medals.map(m => ({ id: m.id, name: m.name })));
    }
  } else {
    console.log('尚未打卡任何门市，无法解锁首次打卡勋章');
  }
  
  // 2. 检查国家勋章
  // 只检查在门市数据中实际存在的国家
  const allCountries = [...new Set(stores.map(s => s.country).filter(Boolean))];
  
  console.log('开始检查国家勋章，门市数据中的国家:', allCountries);
  console.log('已打卡的门市ID:', visitedStoreIds);
  
  allCountries.forEach(country => {
    // 获取该国家的所有门市
    const countryStores = stores.filter(s => s.country === country);
    
    // 关键修复：确保该国家有门市，且门市数量大于0
    // 如果 countryStores.length === 0，every() 会返回 true，导致错误解锁
    if (countryStores.length === 0) {
      console.log(`跳过国家 ${country}：该国家在门市数据中没有门市`);
      return; // 跳过没有门市的国家
    }
    
    // 检查是否所有该国家的门市都已打卡
    const allCountryStoresVisited = countryStores.every(store => 
      visitedStoreIds.includes(String(store.id))
    );
    
    console.log(`国家 ${country}: 门市总数=${countryStores.length}, 已打卡=${allCountryStoresVisited}`);
    
    // 只有当该国家有门市且所有门市都已打卡时，才解锁该国家的勋章
    if (countryStores.length > 0 && allCountryStoresVisited) {
      // 查找对应的国家勋章（通过勋章名称精确匹配）
      const countryMedal = medals.find(m => m.name === country);
      if (countryMedal) {
        // 确保该勋章还没有解锁
        if (!unlockedSet.has(String(countryMedal.id))) {
          unlockedBadges.push(String(countryMedal.id));
          unlockedSet.add(String(countryMedal.id));
          console.log(`✓ 解锁国家勋章: ${country} (medal_id: ${countryMedal.id}, 门市数: ${countryStores.length})`);
        } else {
          console.log(`国家勋章 ${country} 已经解锁`);
        }
      } else {
        console.warn(`⚠ 找不到对应的国家勋章: ${country}`);
      }
    }
  });
  
  // 3. 检查洲际勋章
  // 只检查在门市数据中实际存在的地区
  const allAreas = [...new Set(stores.map(s => s.area).filter(Boolean))];
  
  const areaMedalNames = {
    '亞洲': ['亞洲探險家', 'Asia Explorer'],
    Asia: ['亞洲探險家', 'Asia Explorer'],
    '歐洲': ['歐洲探險家', 'Europe Explorer'],
    Europe: ['歐洲探險家', 'Europe Explorer'],
    '美洲': ['美洲探險家', 'Americas Explorer'],
    Americas: ['美洲探險家', 'Americas Explorer'],
    '澳洲': ['澳洲探險家', 'Australia Explorer', 'Oceania Explorer'],
    Oceania: ['澳洲探險家', 'Australia Explorer', 'Oceania Explorer']
  };
  
  allAreas.forEach(area => {
    // 获取该地区的所有门市
    const areaStores = stores.filter(s => s.area === area);
    
    // 关键修复：确保该地区有门市，且门市数量大于0
    if (areaStores.length === 0) {
      console.log(`跳过地区 ${area}：该地区在门市数据中没有门市`);
      return; // 跳过没有门市的地区
    }
    
    // 检查是否所有该地区的门市都已打卡
    const allAreaStoresVisited = areaStores.every(store => 
      visitedStoreIds.includes(String(store.id))
    );
    
    // 只有当该地区有门市且所有门市都已打卡时，才解锁该地区的勋章
    if (areaStores.length > 0 && allAreaStoresVisited) {
      const nameCandidates = areaMedalNames[area] || [area];
      const areaMedal = medals.find(m => nameCandidates.includes(m.name));
      if (areaMedal) {
        if (!unlockedSet.has(String(areaMedal.id))) {
          unlockedBadges.push(String(areaMedal.id));
          unlockedSet.add(String(areaMedal.id));
          console.log(`✓ 解锁洲际勋章: ${areaMedal.name} (medal_id: ${areaMedal.id}, 门市数: ${areaStores.length})`);
        }
      } else {
        console.warn(`⚠ 找不到对应的洲际勋章: ${area} / ${nameCandidates.join(', ')}`);
      }
    }
  });
  
  // 去重并保存
  unlockedBadges = [...new Set(unlockedBadges)];
  localStorage.setItem('astore.unlockedBadges', JSON.stringify(unlockedBadges));
  
  return unlockedBadges;
}
