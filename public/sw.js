/**
 * KriptoAman Service Worker v2.3.3
 * Strategy: fresh navigation + fresh UI bundles; cache only stable shell/data fallbacks.
 */

const STATIC_CACHE = 'kriptoaman-static-v2.3.3';
const DATA_CACHE = 'kriptoaman-data-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kriptoaman-logo-primary.png',
  '/icons/kriptoaman-192.png',
  '/icons/kriptoaman-512.png',
  '/icons/kriptoaman-maskable-192.png',
  '/icons/kriptoaman-maskable-512.png',
];

const API_DOMAINS = [
  'api.binance.com',
  'api.coingecko.com',
  'api.coinlore.net',
  'min-api.cryptocompare.com',
  'api.exchangerate-api.com',
];

const fetchWithDeadline = (request, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timeout));
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install cache failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DATA_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.startsWith('/api/auth/')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchWithDeadline(new Request(event.request, { cache: 'no-store' }))
        .then(response => {
          if (response && response.ok) {
            caches.open(STATIC_CACHE).then(cache => cache.put('/index.html', response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || new Response(
            '<!doctype html><html lang="id"><meta name="viewport" content="width=device-width"><title>KriptoAman Offline</title><body style="background:#050b14;color:white;font-family:system-ui;padding:32px"><h1>KriptoAman</h1><p>Aplikasi sedang offline. Coba kembali saat koneksi tersedia.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        })
    );
    return;
  }

  const isApiCall = API_DOMAINS.some(d => url.hostname.includes(d)) || url.pathname.startsWith('/api/');
  if (isApiCall) {
    event.respondWith(
      fetchWithDeadline(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(DATA_CACHE).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  const isHashedUiBundle = url.origin === self.location.origin && url.pathname.startsWith('/assets/') && (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  );

  if (isHashedUiBundle) {
    // Hashed Vite chunks must never fall back to an old cached build.
    // A stale HTML document requesting a removed chunk should fail fast so the app can recover.
    event.respondWith(fetchWithDeadline(new Request(event.request, { cache: 'no-store' })));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        caches.open(STATIC_CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      }))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Ada notifikasi baru dari KriptoAman',
    icon: '/icons/kriptoaman-192.png',
    badge: '/icons/kriptoaman-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Buka App' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || 'KriptoAman', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('[SW] Background sync: transactions');
  }
});

console.log('[SW] KriptoAman Service Worker v2.3.3 loaded');
