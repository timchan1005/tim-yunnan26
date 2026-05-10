// Service worker — network-first for app shell so updates always reach the user
const VERSION = 'v4';
const CACHE = `yunnan-map-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './style.css?v=4',
  './app.js?v=4',
  './data.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== CACHE + '-tiles').map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Tiles: network-first, fall back to cache, cache successful results
  if (url.host.includes('basemaps.cartocdn.com') || url.pathname.includes('tile')) {
    e.respondWith(
      fetch(req).then(r => {
        const clone = r.clone();
        caches.open(CACHE + '-tiles').then(c => c.put(req, clone));
        return r;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // App shell (same-origin): network-first so users always see new code,
  // fall back to cache when offline.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(r => {
        if (r && r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return r;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Other (third-party CDNs e.g. unpkg leaflet): cache-first to keep offline
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
