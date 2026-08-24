import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('service worker does not cache hashed UI chunks as stale fallbacks', async () => {
  const sw = await read('public/sw.js');
  assert.match(sw, /KriptoAman Service Worker v2\.3\.3/);
  assert.match(sw, /isHashedUiBundle/);
  assert.match(sw, /event\.respondWith\(fetchWithDeadline\(new Request\(event\.request, \{ cache: 'no-store' \}\)\)\)/);
});

test('app error boundary performs one-shot stale chunk recovery', async () => {
  const boundary = await read('src/components/AppErrorBoundary.jsx');
  assert.match(boundary, /Failed to fetch dynamically imported module/);
  assert.match(boundary, /ka_chunk_recovery_once/);
  assert.match(boundary, /recoverStaleChunkOnce/);
  assert.match(boundary, /clearRuntimeCaches/);
  assert.match(boundary, /ka_chunk_recover/);
});
