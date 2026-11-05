const CACHE='pocket-places-v1';
const FILES=['./','./index.html','./style.css?v=1','./app.mjs?v=1','./parser.mjs?v=1','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{await(await caches.open(CACHE)).addAll(FILES);await self.skipWaiting();})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('pocket-places-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
 const scope=new URL(self.registration.scope),url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE),entry=url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html';
  // A shared text payload is processed from the cached shell, not fetched from social media.
  if(e.request.mode==='navigate'&&entry){
   if(url.searchParams.has('text')||url.searchParams.has('url')||url.searchParams.has('title'))return await cache.match('./index.html');
   try{const r=await fetch(e.request);if(r.ok)return r;}catch{}
   return await cache.match('./index.html');
  }
  return await cache.match(e.request)||fetch(e.request);
 })());
});
