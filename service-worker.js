const CACHE_NAME = "cpq-cache-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles/style.css",
  "/app.js",
  "/manifest.json",
  "/assets/favicon.svg",
];

// Install Service Worker and cache all files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

// Activate Service Worker and remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => key !== CACHE_NAME && caches.delete(key)),
        ),
      ),
  );
});

// Fetch: try cache first, then network, fallback to index.html for navigation
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log(`Service Worker: Loaded from cache → ${event.request.url}`);
        return cachedResponse;
      }
      return fetch(event.request)
        .then(networkResponse => {
          console.log(`Service Worker: Loaded from network → ${event.request.url}`);
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});