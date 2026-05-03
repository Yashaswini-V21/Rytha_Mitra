const CACHE_NAME = 'rythagelathi-v1';
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
  '/public/15.webp',
  '/public/9ryta.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
