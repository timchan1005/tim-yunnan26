// Kill-switch service worker: unregister itself & nuke all caches.
// We had a buggy cache-first SW that pinned old CSS/JS in user browsers.
// This SW (when it replaces the old one) deletes everything and removes itself.
// After it unregisters, the page falls back to plain network requests forever.

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Delete every cache
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // Unregister self
    await self.registration.unregister();
    // Force every controlled tab to reload fresh from network
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.navigate(c.url));
  })());
});

// Pass through every fetch directly to the network — no cache touched
self.addEventListener('fetch', e => {
  // Default browser behavior
});
