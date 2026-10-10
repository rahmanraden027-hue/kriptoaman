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

async function runFixture({ scenario, networkRow, httpNetwork }) {
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
              if (query.includes('FROM network_health_snapshots')) return networkRow;
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
  globalThis.caches = undefined;
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
