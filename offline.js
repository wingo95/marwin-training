// Cache d'abord (démarrage instantané même sans réseau à la salle), mise à jour en arrière-plan.
const cacheName = 'marwin-offline-v4';
const assets = ['./','./index.html','./app.js','./training.js','./moves.js','./focus.js','./intervals.js','./sync.js','./muscles.js','./coach.js','./manifest.webmanifest','./icon.png'];
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(cacheName);
  await cache.addAll(assets);
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key !== cacheName) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  let asset = assets.find(path => new URL(path,self.registration.scope).pathname === url.pathname);
  if (!asset && event.request.mode === 'navigate') asset = './';
  if (!asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(asset);
    const network = fetch(event.request).then(res => {
      if (res.ok) cache.put(asset, res.clone());
      return res;
    });
    if (cached) { event.waitUntil(network.catch(()=>{})); return cached; }
    return network;
  })());
});
