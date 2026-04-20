// Hverdagsverktøy — Service Worker v1.0
const CACHE_NAME = 'hverdagsverktoy-v86';

// Files to cache for offline use
// Fonts are served from fonts.bunny.net (see index.html <link rel="preload">);
// local ./fonts/*.woff2 paths don't exist and would 404 here.
const PRECACHE_URLS = [
  './',
  './manifest.json',
  './shared/core.js',
  './shared/style.css',
  './shared/search.js',
  './shared/search-intents.js',
  './shared/lang/no.js',
  './shared/lang/en.js',
  './shared/lang/zh.js',
  './shared/lang/fr.js',
  './shared/lang/pl.js',
  './shared/lang/uk.js',
  './shared/lang/ar.js',
  './shared/lang/lt.js',
  './shared/lang/so.js',
  './shared/lang/ti.js'
];

// Flag images (external CDN) — precached so language dropdown renders instantly
const FLAG_URLS = [
  'https://flagcdn.com/w80/no.png',
  'https://flagcdn.com/w80/gb.png',
  'https://flagcdn.com/w80/pl.png',
  'https://flagcdn.com/w80/ua.png',
  'https://flagcdn.com/w80/sa.png',
  'https://flagcdn.com/w80/lt.png',
  'https://flagcdn.com/w80/so.png',
  'https://flagcdn.com/w80/er.png',
  'https://flagcdn.com/w80/cn.png',
  'https://flagcdn.com/w80/fr.png'
];

// Install: precache essentials per-URL (so a single 404 doesn't abort all caching).
// Flags are fetched no-cors (opaque responses) and stored via cache.put — cache.add
// rejects opaque responses in Chrome, put accepts them.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled([
        ...PRECACHE_URLS.map(u => cache.add(u).catch(() => {})),
        ...FLAG_URLS.map(u =>
          fetch(u, {mode:'no-cors'})
            .then(r => cache.put(u, r))
            .catch(() => {})
        )
      ])
    ).then(() => self.skipWaiting())
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
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone).catch(() => {}));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for local files.
  // ignoreSearch: true lets precached URLs (./shared/core.js) match versioned
  // requests (/shared/core.js?v=v20) so precache still works after cache-bust bumps.
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cached => {
        if (cached) {
          // Return cache but update in background (stale-while-revalidate).
          // Store under the actual requested URL (with query) so next lookup is a fast hit.
          fetch(event.request).then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response).catch(() => {}));
            }
          }).catch(() => {});
          return cached;
        }
        // Not in cache — fetch and cache
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone).catch(() => {}));
          }
          return response;
        });
      })
  );
});
