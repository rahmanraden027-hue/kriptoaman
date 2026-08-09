/**
 * KriptoAman Service Worker v1.0.0
 * Strategy: Cache-first untuk static assets, Network-first untuk data API
 */

const CACHE_NAME = 'kriptoaman-v1.0.0';
const STATIC_CACHE = 'kriptoaman-static-v1';
const DATA_CACHE = 'kriptoaman-data-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const API_DOMAINS = [
  'api.binance.com',
  'api.coingecko.com',
];

// ── Install: cache static assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing KriptoAman Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install cache failed:', err))
  );
});

// ── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DATA_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: smart caching strategy ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET & browser extension requests
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Authentication responses contain user/session state and must never be
  // stored in the service-worker data cache. Let the browser fetch them
  // directly so Cache-Control and Set-Cookie semantics are preserved.
  if (url.pathname.startsWith('/api/auth/')) return;

  // API calls: Network-first with cache fallback
  const isApiCall = API_DOMAINS.some(d => url.hostname.includes(d)) 
    || url.pathname.startsWith('/api/');
  
  if (isApiCall) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(DATA_CACHE).then(cache => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: Cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            const cloned = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(event.request, cloned));
            return response;
          })
          .catch(() => {
            // Offline fallback: return index.html for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Ada notifikasi baru dari KriptoAman',
    icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69966c5817554cf31f7ec14b/dfa859cab_generated_image.png',
    badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69966c5817554cf31f7ec14b/dfa859cab_generated_image.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Buka App' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'KriptoAman', options)
  );
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

// ── Background Sync ────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('[SW] Background sync: transactions');
  }
});

console.log('[SW] KriptoAman Service Worker loaded ✅');
