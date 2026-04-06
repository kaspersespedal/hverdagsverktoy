// Hverdagsverktøy — Service Worker v1.0
const CACHE_NAME = 'hverdagsverktoy-v2';

// Files to cache for offline use
const PRECACHE_URLS = [
  './',
  './manifest.json',
  './shared/core.js',
  './shared/style.css',
  './shared/lang/no.js',
  './shared/lang/en.js',
  './fonts/PlayfairDisplay-Bold.woff2',
  './fonts/PlayfairDisplay-BoldItalic.woff2',
  './fonts/Inter-Regular.woff2',
  './fonts/Inter-Medium.woff2',
  './fonts/Inter-SemiBold.woff2',
  './fonts/Inter-Bold.woff2'
];

// Install: precache all essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local files, network-first for external (fonts, APIs)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for currency API calls
  if (url.hostname !== location.hostname) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful external responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for local files
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          // Return cache but update in background (stale-while-revalidate)
          const fetchPromise = fetch(event.request).then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
            }
            return response.clone();
          }).catch(() => {});
          return cached;
        }
        // Not in cache — fetch and cache
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
  );
});
