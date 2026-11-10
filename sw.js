/* Econ Cram service worker. Caches only successful same-origin static files.
   Updating this file / CACHE_NAME refreshes the app shell and does not touch localStorage scores. */
const CACHE_NAME = "econ-cram-static-v1";
const PRECACHE = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const net = await fetch(req);
      if (net && net.ok && net.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, net.clone());
      }
      // Never cache 404/5xx or other failures.
      return net;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === "navigate") {
        const idx = await caches.match("./index.html");
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
