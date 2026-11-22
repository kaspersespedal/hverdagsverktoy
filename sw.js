// Hverdagsverktøy — Service Worker v1.0
const CACHE_NAME = 'hverdagsverktoy-v415';

// Files to cache on SW install for offline use.
// Lang files are NOT precached — they'd add ~2.5 MB to install cost and most users
// only need 1 of 10. The fetch handler caches them on-demand (stale-while-revalidate).
// style.css is NOT precached either — only translated subtrees (en/, pl/, ar/, ...)
// and /om/ load it; norske hovedside-tre har inline CSS. Fetched on-demand for users who navigate there.
// Versioned files (core.js?v=, search.js?v=, search-intents.js?v=) are NOT precached
// either: the page loads them under the ?v= URL, so precaching the bare URL meant a
// second full download (~150 KB gzip on a first visit). The fetch handler caches them
// on the next request instead.
const PRECACHE_URLS = [
  './',
  './manifest.json',
  './skatt/skattemelding/',
  './shared/satser.js?v=v2',  // skattemeldingen virker ikke uten den; samme ?v= som på sidene
  './avansert/finans/',
  './avansert/finans/dcf/',
  './avansert/finans/prognose/',
  './avansert/finans/prognose/treaarsprognose-eksempel.xlsx',
  './offline.html'  // vises når en side ikke er lagret og nettet er borte
];

// Flag images (external CDN) — precached so language dropdown renders instantly.
// Only the languages the menu shows; lt/so/ti/zh are hidden in top-chrome.js.
const FLAG_URLS = [
  'https://flagcdn.com/w80/no.png',
  'https://flagcdn.com/w80/gb.png',
  'https://flagcdn.com/w80/pl.png',
  'https://flagcdn.com/w80/ua.png',
  'https://flagcdn.com/w80/sa.png',
  'https://flagcdn.com/w80/fr.png'
];

// Install: precache essentials per-URL (so a single 404 doesn't abort all caching).
// cache:'reload' går forbi nettleserens HTTP-lager (GitHub Pages: max-age=600), så en
// ny versjon aldri lagres med en inntil 10 minutter gammel kopi.
// Flagg: flagcdn sender CORS-hode, så de hentes som vanlige svar. «Opaque» no-cors-svar
// telles som flere MB hver i lagringskvoten.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled([
        ...PRECACHE_URLS.map(u => cache.add(new Request(u, {cache:'reload'})).catch(() => {})),
        ...FLAG_URLS.map(u => cache.add(u).catch(() => {}))
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

  // Flaggene endres aldri: lageret først.
  if (url.hostname === 'flagcdn.com') {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
    return;
  }

  // Eksterne kall (API-er, fonter): rett til nettet, ingen lagring. Et lagret API-svar
  // ville ellers blitt tatt for ferskt av siden og vist som nye tall.
  if (url.hostname !== location.hostname) return;

  // Sider (HTML): nettet først, så ny HTML alltid kommer sammen med de nye ?v=-filene.
  // Lageret brukes bare uten nett, og offline.html når siden ikke er lagret.
  // cache:'no-cache' = spør serveren (304 hvis uendret) i stedet for HTTP-lageret.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          if (response.ok) {
            // Lagres under adressen uten «?…»: det som står etter «?» kan være noe brukeren har skrevet,
            // og skal ikke bli liggende i lageret. Siden er den samme filen uansett.
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(url.origin + url.pathname, clone).catch(() => {}));
          }
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true })
          .then(cached => cached || caches.match('./offline.html')))
    );
    return;
  }

  // Cache-first for local files.
  // Eksakt adresse (ingen ignoreSearch): en ny ?v= er en ny fil og hentes på nytt.
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          // Return cache but update in background (stale-while-revalidate).
          // Store under the actual requested URL (with query) so next lookup is a fast hit.
          // Versjonerte assets (?v=) hoppes over: de oppdateres via CACHE_NAME-bump
          // ved deploy uansett, og bakgrunns-refetch av core.js/no.js/CSS på hvert
          // gjenbesøk konkurrerte med fonter og markedsdata-API-ene i lastevinduet.
          if (event.request.url.indexOf('?v=') === -1) {
            fetch(event.request, { cache: 'no-cache' }).then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, response).catch(() => {}));
              }
            }).catch(() => {});
          }
          return cached;
        }
        // Not in cache — fetch and cache (no-cache: aldri en gammel kopi fra HTTP-lageret)
        return fetch(event.request, { cache: 'no-cache' }).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone).catch(() => {}));
          }
          return response;
        });
      })
  );
});
