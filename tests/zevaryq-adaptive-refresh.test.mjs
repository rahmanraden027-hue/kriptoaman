import assert from 'node:assert/strict';
import test from 'node:test';
import { getZevaryqRefreshDelay, ZEVARYQ_REFRESH_MS } from '../src/services/zevaryqRefreshPolicy.js';

test('uses fast refresh only when first-party intelligence reports websocket stream connected', () => {
  assert.equal(getZevaryqRefreshDelay({
    rpc: 'connected',
    sources: { tokenIntelligence: { streamState: 'connected' } },
  }), ZEVARYQ_REFRESH_MS.STREAM);
});

test('uses bounded fallback cadence for verified RPC without websocket evidence', () => {
  assert.equal(getZevaryqRefreshDelay({
    rpc: 'connected',
    sources: { tokenIntelligence: { streamState: 'fallback' } },
  }), ZEVARYQ_REFRESH_MS.FALLBACK);
});

test('backs off when status is degraded or unavailable', () => {
  assert.equal(getZevaryqRefreshDelay(null, 'offline'), ZEVARYQ_REFRESH_MS.DEGRADED);
  assert.equal(getZevaryqRefreshDelay({ rpc: 'error' }, 'degraded'), ZEVARYQ_REFRESH_MS.DEGRADED);
});
