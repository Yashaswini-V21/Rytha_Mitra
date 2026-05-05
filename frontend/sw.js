const CACHE_NAME = 'rythagelathi-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/core.html',
  '/climate.html',
  '/styles.css',
  '/core.css',
  '/climate.css',
  '/app.js',
  '/core.js',
  '/climate.js',
  '/manifest.json',
  '/public/11.webp',
  '/public/12.webp',
  '/public/13.webp',
  '/public/15.webp',
  '/public/9ryta.webp'
];

// Install — cache all static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate — purge old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static, network-first for API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(JSON.stringify({ok: false, error: 'Offline'}), {
          headers: {'Content-Type': 'application/json'}
        }))
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
