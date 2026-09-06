import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('service worker prevents stale app-shell navigation and only caches fingerprinted UI assets', async () => {
  const sw = await read('public/sw.js');
  assert.match(sw, /KriptoAman Service Worker v2\.4\.0/);
  assert.match(sw, /isImmutableAsset/);
  assert.match(sw, /IMMUTABLE_CACHE/);
  assert.match(sw, /request\.mode === 'navigate'/);
  assert.match(sw, /new Request\(request, \{ cache: 'no-store' \}\)/);
  assert.match(sw, /offlineNavigationResponse/);
  assert.doesNotMatch(sw, /caches\.match\('\/index\.html'\)/);
  assert.doesNotMatch(sw, /cache\.put\('\/index\.html'/);
});

test('app error boundary performs bounded stale chunk recovery in embedded browsers', async () => {
  const boundary = await read('src/components/AppErrorBoundary.jsx');
  assert.match(boundary, /Failed to fetch dynamically imported module/);
  assert.match(boundary, /ka_chunk_recovery_once/);
  assert.match(boundary, /CACHE_RECOVERY_TIMEOUT_MS = 1500/);
  assert.match(boundary, /CHUNK_RECOVERY_RETRY_MS = 5000/);
  assert.match(boundary, /settleWithin/);
  assert.match(boundary, /Promise\.allSettled/);
  assert.match(boundary, /Recovery must still continue/);
  assert.match(boundary, /ka_chunk_recover/);
});

test('admin SPA routes are never served as cacheable app-shell HTML', async () => {
  const headers = await read('public/_headers');
  assert.match(headers, /\/Admin\*\n\s+Cache-Control: no-cache, no-store, must-revalidate/);
  assert.match(headers, /\/ServerControl\*\n\s+Cache-Control: no-cache, no-store, must-revalidate/);
  assert.match(headers, /\/dashboard\*\n\s+Cache-Control: no-cache, no-store, must-revalidate/);
  assert.match(headers, /\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
});
