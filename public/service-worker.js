const CACHE_NAME = 'weld-cut-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For API calls, use network first, fall back to cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone))
              .catch(err => console.warn('cache put failed', err));
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(event.request);
        })
    );
  } else {
    // For non-API requests, use cache first, fall back to network
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          // Cache successful responses
          if (!response || response.status !== 200) {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
            .catch(err => console.warn('cache put failed', err));
          return response;
        });
      })
    );
  }
});
