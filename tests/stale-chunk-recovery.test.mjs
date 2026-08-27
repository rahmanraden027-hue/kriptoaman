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

test('app error boundary performs one-shot stale chunk recovery', async () => {
  const boundary = await read('src/components/AppErrorBoundary.jsx');
  assert.match(boundary, /Failed to fetch dynamically imported module/);
  assert.match(boundary, /ka_chunk_recovery_once/);
  assert.match(boundary, /recoverStaleChunkOnce/);
  assert.match(boundary, /clearRuntimeCaches/);
  assert.match(boundary, /ka_chunk_recover/);
});
