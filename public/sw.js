const CACHE_NAME = 'ultra-coach-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar chamadas de API do Next.js (ex: /api/...) e outras origens não-GET
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('/api/') ||
    event.request.url.includes('/_next/') ||
    event.request.url.includes('hot-update') ||
    event.request.url.includes('localhost')
  ) {
    return;
  }

  // 1. Estratégia Network-First para requisições de navegação (HTML principal/recarregamento)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Em caso de falha de rede (offline), tenta recuperar a página em cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se a URL específica com query parameters não estiver cacheada, retorna a rota principal '/' em cache
            return caches.match('/');
          });
        })
    );
    return;
  }

  // 2. Estratégia Cache-First para outros recursos estáticos (ícones, manifest, favicon, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch((err) => {
          console.warn('Falha ao buscar recurso de rede no Service Worker:', err);
          // Em caso de erro, tenta novamente buscar do cache para evitar retornar undefined
          return caches.match(event.request);
        });
    })
  );
});
