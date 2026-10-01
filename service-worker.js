const CACHE_NAME = "busan-parking-v5-1";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );

  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});


self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 실시간 주차정보 API는 캐시하지 않는다.
  // 항상 네트워크에서 최신 정보를 가져오도록 한다.
  if (url.pathname.startsWith("/api/parking")) {
    return;
  }

  // 정적 파일은 캐시 우선, 없으면 네트워크 사용
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request);
    })
  );
});
