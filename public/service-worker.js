// public/service-worker.js
const CACHE_NAME = "cpq-cache-v3";

const PRECACHE_URLS = [
  "/",              // SPA shell
  "/index.html",
  "/favicon-32x32.png",   // your favicon in /public
  "/items/products.json", // your data file in /public/items
];

// Install: pre-cache stable assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// Activate: clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Helper: same-origin?
const isSameOrigin = (url) => {
  try {
    const u = new URL(url);
    return u.origin === self.location.origin;
  } catch { return false; }
};

// Fetch: network-first for same-origin GET, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== "GET") return;

  // Only handle same-origin (skip CDNs like unpkg/cdn.tailwindcss)
  if (!isSameOrigin(request.url)) return;

  event.respondWith(
    (async () => {
      // Try network
      try {
        const networkResponse = await fetch(request);
        // Runtime-update cache (cache only OK responses)
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        // Network failed → try cache
        const cached = await caches.match(request);
        if (cached) return cached;

        // If this was a navigation, fallback to index.html (SPA)
        if (request.mode === "navigate") {
          return caches.match("/index.html");
        }
        // As a last resort, let it error
        return Response.error();
      }
    })()
  );
});
