import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { onRequestGet } from '../functions/api/platform-status.js';

test('degraded market status bypasses poisoned edge cache without publishing new degraded cache', async () => {
  const oldFetch = globalThis.fetch;
  const oldCaches = globalThis.caches;
  let puts = 0;
  const tasks = [];
  globalThis.caches = {
    default: {
      match: async () => Response.json({ overall: 'degraded', components: { market: { healthy: false } } }),
      put: async () => { puts += 1; },
    },
  };
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === '/api/market-snapshot') {
      return Response.json({
        healthy: true, assetCount: 4900, source: 'fixture',
        capturedAt: Date.now() - 60 * 60 * 1000,
        ageMs: 60 * 60 * 1000, stale: true,
      });
    }
    if (path === '/api/network-health') {
      return Response.json({ summary: { online: 12, total: 12, minimum_active_target: 12, offline: 0 } });
    }
    if (path === '/api/kam/network-status') {
      return Response.json({ verified: true, chainId: 22028, blockNumber: 500001 });
    }
    throw new Error('unexpected test endpoint: ' + path);
  };

  try {
    const response = await onRequestGet({
      request: new Request('https://kriptoaman.com/api/platform-status'),
      env: {},
      waitUntil: (promise) => tasks.push(promise),
    });
    const body = await response.json();
    assert.equal(response.headers.get('X-KriptoAman-Status-Cache'), 'MISS');
    assert.equal(body.overall, 'degraded');
    assert.equal(body.components.market.healthy, false);
    assert.equal(body.components.market.stale, true);
    assert.equal(puts, 0, 'degraded HTTP 200 response must not enter edge cache');
    await Promise.allSettled(tasks);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.caches = oldCaches;
  }
});

test('stale market memory/edge guards preserve the 15-minute truth boundary', async () => {
  const src = await readFile(new URL('../functions/api/platform-status.js', import.meta.url), 'utf8');
  assert.match(src, /const DEGRADED_STATUS_TTL_MS = 2_000/);
  assert.match(src, /canReuseCachedStatus\(memoryNow\)/);
  assert.match(src, /canReuseCachedStatus\(now\)/);
  assert.match(src, /atMs - capturedAt <= MARKET_SNAPSHOT_FRESH_MS/);
  assert.match(src, /cachedBody && isVerifiedOperationalBody\(cachedBody\)/);
  assert.match(src, /&& isVerifiedOperationalBody\(result\.body\)/);
  assert.match(src, /marketOperationalRequiresFreshSnapshot: true/);
  assert.doesNotMatch(src, /Math\.random|eth_sendRawTransaction|eth_sendTransaction/);
});
