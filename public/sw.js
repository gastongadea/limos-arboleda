// Service Worker liviano y seguro para CRA en GitHub Pages.
// Evita cachear rutas inexistentes (p.ej. /static/js/bundle.js) y reduce “código viejo”.
const CACHE_NAME = 'limos-v1.0.1';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    // No precacheamos bundles porque CRA usa nombres hasheados.
    caches.open(CACHE_NAME).then(() => undefined)
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No interferir con requests cross-origin (p.ej. script.google.com para JSONP)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navegación: network-first (evita servir HTML viejo)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate
  const isStaticAsset = /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|json|txt|woff2?)$/i.test(url.pathname);
  if (!isStaticAsset || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// Limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
          return undefined;
        })
      );
      await self.clients.claim();
    })()
  );
});
