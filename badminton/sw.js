const C='smashku-v2';
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./icon-192.png'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('smashku-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith('/badminton/'))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const y=r.clone();caches.open(C).then(c=>c.put(e.request,y))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))));});
