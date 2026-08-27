/**
 * KriptoAman Service Worker v2.4.0
 * Fail-safe policy:
 * - navigation is always network-first and never falls back to a cached app shell
 * - internal APIs are never cached by the service worker
 * - failed precache entries can never block worker installation
 * - only immutable fingerprinted assets use long-lived cache-first behavior
 */

const CACHE_PREFIX = 'kriptoaman-';
const STATIC_CACHE = `${CACHE_PREFIX}static-v2.4.0`;
const IMMUTABLE_CACHE = `${CACHE_PREFIX}immutable-v2.4.0`;
const CURRENT_CACHES = new Set([STATIC_CACHE, IMMUTABLE_CACHE]);

const OPTIONAL_STATIC_ASSETS = [
  '/kriptoaman-logo-primary.png',
  '/icons/kriptoaman-192.png',
  '/icons/kriptoaman-512.png',
  '/icons/kriptoaman-maskable-192.png',
  '/icons/kriptoaman-maskable-512.png',
];

const APP_METADATA_PATHS = new Set([
  '/sw.js',
  '/manifest.json',
  '/manifest.webmanifest',
  '/deploy-version.json',
]);

const fetchWithDeadline = (request, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timeout));
};

const offlineNavigationResponse = () => new Response(
  '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Cache-Control" content="no-store"><title>KriptoAman — Koneksi Terputus</title></head><body style="margin:0;background:#050b14;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px;box-sizing:border-box"><main style="max-width:420px;text-align:center"><h1 style="margin:0 0 12px">KriptoAman</h1><p style="color:#a8b3c7;line-height:1.6">Koneksi ke layanan belum tersedia. Tidak ada versi aplikasi lama yang digunakan. Periksa koneksi lalu coba lagi.</p><button onclick="location.reload()" style="margin-top:12px;border:0;border-radius:12px;background:#2563eb;color:#fff;padding:12px 18px;font-weight:700">Coba Lagi</button></main></body></html>',
  {
    status: 503,
    statusText: 'Offline',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  },
);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        OPTIONAL_STATIC_ASSETS.map(asset => cache.add(new Request(asset, { cache: 'reload' }))),
      );
    } catch (err) {
      console.warn('[SW] Optional precache unavailable; install continues:', err);
    } finally {
      await self.skipWaiting();
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(key))
        .map(key => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol === 'chrome-extension:') return;

  // The service worker must never become an availability or staleness layer for
  // application APIs, authentication, RPC-like endpoints, or deployment metadata.
  if (url.origin === self.location.origin && (
    url.pathname.startsWith('/api/') ||
    APP_METADATA_PATHS.has(url.pathname)
  )) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetchWithDeadline(new Request(request, { cache: 'no-store' }), 12000)
        .then(response => response)
        .catch(() => offlineNavigationResponse()),
    );
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isImmutableAsset = isSameOrigin && url.pathname.startsWith('/assets/') && /-[A-Za-z0-9_-]{6,}\.(?:js|css|woff2?|png|jpe?g|webp|svg)$/i.test(url.pathname);

  if (isImmutableAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(IMMUTABLE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetchWithDeadline(request);
      if (response && response.ok && response.type !== 'opaque') {
        await cache.put(request, response.clone());
      }
      return response;
    })());
    return;
  }

  const isStableImage = isSameOrigin && request.destination === 'image' && (
    url.pathname.startsWith('/icons/') || url.pathname === '/kriptoaman-logo-primary.png'
  );

  if (isStableImage) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetchWithDeadline(request);
      if (response && response.ok && response.type !== 'opaque') {
        await cache.put(request, response.clone());
      }
      return response;
    })());
    return;
  }

  // Everything else is network-first. Cache failure is never allowed to block
  // a valid response and no generic response is persisted as an app-shell fallback.
  event.respondWith(fetchWithDeadline(new Request(request, { cache: 'no-store' })));
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
      { action: 'dismiss', title: 'Tutup' },
    ],
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
        return undefined;
      }),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('[SW] Background sync: transactions');
  }
});

console.log('[SW] KriptoAman Service Worker v2.4.0 loaded');
