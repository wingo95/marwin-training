// Hors ligne : cache d'abord (démarrage instantané à la salle), mise à jour en arrière-plan.
const cacheName = 'marwin-v6';
const assets = ["./", "./index.html", "./core.js", "./audio.js", "./muscles.js", "./timer.js", "./sync.js", "./templates.js", "./seance.js", "./repas.js", "./suivi.js", "./manifest.webmanifest", "./icon.png", "./voix.json"];
self.addEventListener('install', e => e.waitUntil((async () => { const c = await caches.open(cacheName); await c.addAll(assets); await self.skipWaiting(); })()));
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== cacheName) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  let asset = assets.find(p => new URL(p, self.registration.scope).pathname === url.pathname);
  if (!asset && e.request.mode === 'navigate') asset = './';
  if (!asset) return;
  e.respondWith((async () => {
    const c = await caches.open(cacheName), hit = await c.match(asset);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(asset, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  })());
});
