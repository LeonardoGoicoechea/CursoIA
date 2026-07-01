const CACHE_NAME = "cursoia-v1.4.0";
const APP_SHELL = "./index.html";
const ASSETS = [
  APP_SHELL,
  "./styles.css",
  "./app.js",
  "./config.js",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          const cacheKey = event.request.mode === "navigate" ? APP_SHELL : event.request;
          caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy));
        }
        return response;
      })
      .catch(() => event.request.mode === "navigate"
        ? caches.match(APP_SHELL)
        : caches.match(event.request))
  );
});
