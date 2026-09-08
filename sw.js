const CACHE_NAME = 'rent-calculator-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './print.css'
];

// インストール時にアセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key.startsWith('rent-calculator-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// オンライン時は最新版、オフライン時は保存したアプリを返す。
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const key = event.request.mode === 'navigate' ? new URL('./index.html', self.location.href).href : event.request;
    try {
      const response = await fetch(event.request, { cache: 'no-cache' });
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch {
      return await cache.match(key) || Response.error();
    }
  })());
});
