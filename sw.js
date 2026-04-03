const APP_VERSION = 'v0.1.11';
const APP_SHELL_CACHE = `astore-shell-${APP_VERSION}`;
const DATA_CACHE = `astore-data-${APP_VERSION}`;

const APP_SHELL_FILES = [
  './',
  './index.html',
  './stores.html',
  './favorites.html',
  './storepage.html',
  './achievements.html',
  './about.html',
  './css/base.css',
  './css/glass.css',
  './css/layout.css',
  './css/pwa-update.css',
  './css/pwa-install.css',
  './js/main.js',
  './js/data.js',
  './js/stores.js',
  './js/favorites.js',
  './js/storeDetail.js',
  './js/achievements.js',
  './js/pwa-update.js',
  './js/pwa-install.js',
  './assets/app_icon.png',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(cache => cache.addAll(APP_SHELL_FILES))
  );
  // 不自动 skipWaiting，等待用户确认更新
  // self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => ![APP_SHELL_CACHE, DATA_CACHE].includes(key))
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 监听来自前端的消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Stale-While-Revalidate for JSON data from Google Apps Script or published sheets
async function handleDataRequest(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(response => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Heuristic: treat sheets/apps script/json endpoints as data
  const isData =
    url.pathname.endsWith('.json') ||
    url.hostname.endsWith('googleusercontent.com') ||
    url.hostname.endsWith('googleapis.com') ||
    url.hostname.endsWith('google.com') && (url.pathname.includes('/macros/') || url.pathname.includes('/spreadsheets/'));

  if (isData) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  // Cache-first for app shell and images
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const clone = response.clone();
        // Only cache safe responses
        if (response.ok && (request.url.startsWith(self.location.origin) || request.destination === 'image' || request.destination === 'style' || request.destination === 'script')) {
          caches.open(APP_SHELL_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // If network fails and it's a navigation request, return index.html
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});



