// PWA Service Worker for offline functionality and caching
const CACHE_NAME = 'coinvault-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => {
      console.error('Cache installation failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (security)
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API calls separately
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets and documents
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cache successful responses
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, cloned);
          });

          return response;
        });
      })
      .catch(() => {
        // Return offline page for documents
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for pending transactions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_TRANSACTIONS',
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'New notification from COINVAULT',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'coinvault-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('COINVAULT', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-market-data') {
    event.waitUntil(
      fetch('/api/market-data')
        .then(response => response.json())
        .then(data => {
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'MARKET_DATA_UPDATE',
                data: data
              });
            });
          });
        })
        .catch(err => console.error('Periodic sync failed:', err))
    );
  }
});

console.log('Service Worker installed');