import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet } from '../functions/api/network-health.js';

const json = (payload) => new Response(JSON.stringify(payload), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

test('explicit verified refresh primes canonical cache without reading it or fabricating fallback data', async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const stored = new Map();
  const writes = [];
  const reads = [];
  const waiters = [];
  let fetches = 0;
  let providerOutage = false;

  try {
    globalThis.caches = {
      default: {
        async match(key) {
          reads.push(key.url);
          return stored.get(key.url)?.clone();
        },
        async put(key, response) {
          writes.push(key.url);
          stored.set(key.url, response.clone());
        },
      },
    };

    globalThis.fetch = async (url, options = {}) => {
      fetches += 1;
      if (providerOutage) return new Response('provider offline', { status: 503 });
      const address = String(url);
      if (address.includes('/blocks/tip/height')) return new Response('123456', { status: 200 });
      if (address.includes('/api/v1/tip')) return json([{ block_no: 123456 }]);
      if (address.includes('/api/v2')) return json({ blockbook: { bestHeight: 123456 } });
      if (address.includes('/wallet/getnowblock')) {
        return json({ block_header: { raw_data: { number: 123456 } } });
      }
      const method = options.body ? JSON.parse(options.body).method : null;
      if (method === 'eth_blockNumber') return json({ jsonrpc: '2.0', id: 1, result: '0x1e240' });
      if (method === 'getBlockHeight') return json({ jsonrpc: '2.0', id: 1, result: 123456 });
      if (method === 'server_info') {
        return json({ result: { info: { validated_ledger: { seq: 123456 } } } });
      }
      if (method === 'chain_getHeader') {
        return json({ jsonrpc: '2.0', id: 1, result: { number: '0x1e240' } });
      }
      return new Response('unknown probe', { status: 503 });
    };

    const context = (url) => ({
      request: new Request(url),
      env: {},
      waitUntil(promise) { waiters.push(promise); },
    });
    const canonical = 'https://kriptoaman.com/api/network-health';

    const warmed = await onRequestGet(context(canonical + '?refresh=1'));
    assert.equal(warmed.status, 200);
    const fresh = await warmed.json();
    assert.equal(fresh.summary.total, 21);
    assert.equal(fresh.summary.online, 21);
    assert.equal(fresh.delivery.freshProbe, true);
    assert.equal(fresh.delivery.edgeCacheEligible, true);
    assert.equal(reads.length, 0, 'explicit refresh must not read cached results');
    assert.deepEqual(writes, [canonical], 'explicit refresh primes canonical GET key, not query URL');

    const firstProbeCount = fetches;
    const cached = await onRequestGet(context(canonical));
    assert.equal(cached.status, 200);
    assert.equal(cached.headers.get('X-KriptoAman-Network-Cache'), 'HIT');
    assert.equal((await cached.json()).summary.online, 21);
    assert.equal(fetches, firstProbeCount, 'normal cached request must not probe providers again');

    providerOutage = true;
    stored.clear();
    const noProof = await onRequestGet(context(canonical + '?refresh=1'));
    assert.equal(noProof.status, 503, 'no current online probes must fail closed');
    const unavailable = await noProof.json();
    assert.equal(unavailable.summary.online, 0);
    assert.equal(unavailable.delivery.edgeCacheEligible, false);
    assert.equal(writes.length, 1, 'unverified refresh must not overwrite canonical cached proof');
    await Promise.allSettled(waiters);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
});
