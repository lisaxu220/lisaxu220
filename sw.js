const CACHE = 'no-big-deal-offline-v5';
const ASSETS = [
  './', './index.html', './style.css?v=entry-2',
  './app.js?v=entry-2', './pwa.js?v=entry-2', './store.js?v=entry-2',
  './sync-config.js?v=entry-2', './sync.js?v=entry-2',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // A failed download must not replace a complete working offline version.
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('no-big-deal-offline-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  // Only app entry routes receive the HTML fallback; missing files remain 404s.
  const entry = url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`;
  if (request.mode === 'navigate' && entry) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;
      } catch {}
      const cache = await caches.open(CACHE);
      return (await cache.match('./index.html')) || Response.error();
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(request)) || fetch(request);
  })());
});
