const CACHE = 'rytha-mitra-v2';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/climate.html',
  '/core.html',
  '/styles.css',
  '/core.css',
  '/climate.css',
  '/app.js',
  '/core.js',
  '/climate.js',
  '/premium.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // For API calls — network only, no cache
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({
        error: 'offline',
        message: 'Using offline engine — API unreachable'
      }), {headers:{'Content-Type':'application/json'}})
    ));
    return;
  }
  // For everything else — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/climate.html'));
    })
  );
});
