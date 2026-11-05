importScripts('./evidence.js?v=3');
const CACHE='pocket-places-v3';
const FILES=['./','./index.html','./style.css?v=3','./app.mjs?v=3','./parser.mjs?v=3','./screenshots.mjs?v=3','./evidence.js?v=3','./ocr.mjs?v=3','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./vendor/ocr/tesseract.min.js','./vendor/ocr/worker.min.js','./vendor/ocr/tesseract-core-lstm.wasm.js','./vendor/ocr/lang/chi_sim.traineddata.gz'];
self.addEventListener('install',e=>e.waitUntil((async()=>{await(await caches.open(CACHE)).addAll(FILES);await self.skipWaiting();})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('pocket-places-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
 const scope=new URL(self.registration.scope),url=new URL(e.request.url);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const entry=url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html';
 if(e.request.method==='POST'&&entry){
  e.respondWith((async()=>{
   const redirect=new URL('./',scope);
   try{
    const form=await e.request.formData(),files=form.getAll('screenshots').filter(item=>item instanceof Blob&&item.size>0);
    if(files.length){const images=await PocketEvidence.add(files);redirect.searchParams.set('images',images.map(i=>i.id).join(','));}
    for(const key of ['title','text','url']){const value=form.get(key);if(typeof value==='string'&&value)redirect.searchParams.set(key,value.slice(0,20000));}
   }catch(error){redirect.searchParams.set('share-error',error.message||'Screenshots could not be received. Choose them from the screenshot picker instead.');}
   return Response.redirect(redirect.href,303);
  })());return;
 }
 if(e.request.method!=='GET')return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(e.request.mode==='navigate'&&entry){
   if(['text','url','title','images','share-error'].some(key=>url.searchParams.has(key)))return await cache.match('./index.html');
   try{const r=await fetch(e.request);if(r.ok)return r;}catch{}
   return await cache.match('./index.html');
  }
  return await cache.match(e.request)||fetch(e.request);
 })());
});
