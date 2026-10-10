import assert from 'node:assert/strict';
import test from 'node:test';

const NOW = Date.now();
function verifiedNetworkSnapshot(at = NOW) {
  const networks = Array.from({ length: 21 }, (_, index) => ({
    name: `Network-${index}`,
    status: index < 20 ? 'online' : 'offline',
    checked_at: new Date(at).toISOString(),
  }));
  return {
    summary: {
      total: 21,
      online: 20,
      degraded: 0,
      offline: 1,
      minimum_active_target: 12,
    },
    networks,
    checked_at: new Date(at).toISOString(),
  };
}

async function runFixture({ scenario, networkRow, httpNetwork, cachedResponse = null, slowNetworkD1 = false }) {
  const previousFetch = globalThis.fetch;
  const previousCaches = globalThis.caches;
  const calls = [];
  const pending = [];
  const db = {
    prepare(sql) {
      const query = String(sql);
      return {
        bind() {
          return {
            async first() {
              if (query.includes('FROM platform_status_snapshots')) return null;
              if (query.includes('FROM network_health_snapshots')) {
                if (slowNetworkD1) return new Promise(() => {});
                return networkRow;
              }
              if (query.includes('FROM market_snapshots')) {
                return { source: 'verified-market', asset_count: 4900, captured_at: Date.now() - 1000 };
              }
              throw new Error(`unexpected read query: ${query}`);
            },
          };
        },
        async run() { return { success: true }; },
      };
    },
  };
  globalThis.caches = cachedResponse ? {
    default: { match: async () => cachedResponse.clone(), put: async () => undefined },
  } : undefined;
  globalThis.fetch = async (url) => {
    const pathName = new URL(String(url)).pathname;
    calls.push(pathName);
    if (pathName === '/api/network-health') return httpNetwork;
    if (pathName === '/api/kam/network-status') {
      return Response.json({ verified: true, chainId: 22028, blockNumber: 640001 });
    }
    throw new Error(`unexpected subrequest: ${pathName}`);
  };
  try {
    const { onRequestGet } = await import(`../functions/api/platform-status.js?networkD1Fixture=${scenario}`);
    const response = await onRequestGet({
      request: new Request('https://kriptoaman.com/api/platform-status'),
      env: { AUTH_DB: db },
      waitUntil: (work) => pending.push(work),
    });
    const body = await response.json();
    await Promise.allSettled(pending);
    return { response, body, calls };
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.caches = previousCaches;
  }
}

test('recent internally consistent 21-chain D1 snapshot avoids cold network-health HTTP request', async () => {
  const result = await runFixture({
    scenario: 'fresh',
    networkRow: { captured_at: NOW, payload: JSON.stringify(verifiedNetworkSnapshot()) },
    httpNetwork: Response.json({ availability: { state: 'warming' } }, { status: 503 }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.overall, 'operational');
  assert.equal(result.body.components.networks.readMode, 'd1-recent-verified');
  assert.equal(result.body.components.networks.online, 20);
  assert.equal(result.body.components.networks.total, 21);
  assert.ok(!result.calls.includes('/api/network-health'));
});

test('expired D1 snapshot falls back to HTTP and does not fabricate healthy networks', async () => {
  const old = NOW - 90_000;
  const result = await runFixture({
    scenario: 'expired',
    networkRow: { captured_at: old, payload: JSON.stringify(verifiedNetworkSnapshot(old)) },
    httpNetwork: Response.json({ availability: { state: 'warming' } }, { status: 503 }),
  });
  assert.equal(result.body.components.networks.readMode, 'http-fallback');
  assert.equal(result.body.components.networks.healthy, false);
  assert.equal(result.body.components.networks.online, null);
  assert.ok(result.calls.includes('/api/network-health'));
});

test('contradictory D1 network counts are rejected before HTTP fallback', async () => {
  const bad = verifiedNetworkSnapshot();
  bad.summary.online = 21;
  const result = await runFixture({
    scenario: 'contradictory',
    networkRow: { captured_at: NOW, payload: JSON.stringify(bad) },
    httpNetwork: Response.json({ availability: { state: 'warming' } }, { status: 503 }),
  });
  assert.equal(result.body.components.networks.readMode, 'http-fallback');
  assert.equal(result.body.components.networks.healthy, false);
  assert.ok(result.calls.includes('/api/network-health'));
});

test('previously operational edge cache with expired network checkedAt cannot be reused', async () => {
  const cached = {
    overall: 'operational',
    components: {
      market: { healthy: true, assetCount: 4900, capturedAt: Date.now() - 1000 },
      networks: {
        healthy: true, online: 20, minimumActiveTarget: 12,
        checkedAt: new Date(Date.now() - 90_000).toISOString(),
      },
      kam: { healthy: true, chainId: 22028 },
    },
  };
  const result = await runFixture({
    scenario: 'cache-expired',
    networkRow: { captured_at: Date.now(), payload: JSON.stringify(verifiedNetworkSnapshot(Date.now())) },
    cachedResponse: Response.json(cached),
    httpNetwork: Response.json({ availability: { state: 'warming' } }, { status: 503 }),
  });
  assert.equal(result.response.headers.get('X-KriptoAman-Status-Cache'), 'MISS');
  assert.equal(result.body.components.networks.readMode, 'd1-recent-verified');
  assert.equal(result.body.overall, 'operational');
  assert.ok(!result.calls.includes('/api/network-health'));
});

test('slow D1 session obeys bounded read budget and falls back without invented online status', async () => {
  const started = performance.now();
  const result = await runFixture({
    scenario: 'slow-D1',
    slowNetworkD1: true,
    networkRow: null,
    httpNetwork: Response.json({ availability: { state: 'warming' } }, { status: 503 }),
  });
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 1500, `D1 timeout/fallback exceeded expected budget: ${elapsed}ms`);
  assert.ok(result.calls.includes('/api/network-health'));
  assert.equal(result.body.components.networks.readMode, 'http-fallback');
  assert.equal(result.body.components.networks.healthy, false);
  assert.equal(result.body.components.networks.online, null);
});
