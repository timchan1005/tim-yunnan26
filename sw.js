// Minimal service worker — cache app shell for offline / Add to Home Screen
const CACHE = 'yunnan-map-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
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
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first for tiles (always fresh), cache-first for app shell
  if (req.url.includes('basemaps.cartocdn.com') || req.url.includes('tile')) {
    e.respondWith(
      fetch(req).then(r => {
        const clone = r.clone();
        caches.open(CACHE + '-tiles').then(c => c.put(req, clone));
        return r;
      }).catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
