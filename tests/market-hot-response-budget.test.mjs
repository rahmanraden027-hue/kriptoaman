import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const endpoint = await readFile(new URL('../functions/api/market-hot.js', import.meta.url), 'utf8');
const load = await readFile(new URL('../load/k6-production-readonly.js', import.meta.url), 'utf8');

test('ordinary hot-market cold reads prefer verified durable data within a bounded budget', () => {
  assert.match(endpoint, /const DURABLE_READ_BUDGET_MS = 350/);
  assert.match(endpoint, /const PUBLIC_COLD_RESPONSE_BUDGET_MS = 1_800/);
  assert.match(endpoint, /const durable = await withDeadline\(durableRead, DURABLE_READ_BUDGET_MS, null\)/);
  assert.match(endpoint, /durable-verified-background-refresh/);
  assert.match(endpoint, /const snapshot = await withDeadline\(refresh, PUBLIC_COLD_RESPONSE_BUDGET_MS, null\)/);
  assert.match(endpoint, /warming-background-refresh/);
});

test('bounded hot-market fallback never fabricates market values', () => {
  assert.match(endpoint, /healthy: false/);
  assert.match(endpoint, /available: false/);
  assert.match(endpoint, /source: null/);
  assert.match(endpoint, /capturedAt: null/);
  assert.match(endpoint, /ageMs: null/);
  assert.match(endpoint, /assetCount: 0/);
  assert.match(endpoint, /data: \[\]/);
  assert.match(endpoint, /fabricatedMetrics: false/);
  assert.match(endpoint, /verified_hot_market_snapshot_unavailable_within_response_budget/);
});

test('successful hot-market responses seed edge cache before returning when possible', () => {
  assert.match(endpoint, /const EDGE_CACHE_WRITE_BUDGET_MS = 350/);
  assert.match(endpoint, /edgeCache\.put\(cacheKey, response\.clone\(\)\)/);
  assert.match(endpoint, /await withDeadline\(cacheWrite, EDGE_CACHE_WRITE_BUDGET_MS, false\)/);
  assert.match(endpoint, /if \(!cacheWritten\) scheduleBackground/);
});

test('hot-market data standards and core symbols remain unchanged', () => {
  assert.match(endpoint, /const CORE_SYMBOLS = \['BTC', 'ETH', 'BNB', 'SOL', 'XRP'\]/);
  assert.match(endpoint, /HOT_HEALTHY_AGE_MS = 60 \* 60 \* 1000/);
  assert.match(endpoint, /MAX_FALLBACK_AGE_MS = 365 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(endpoint, /if \(!hasCoreSymbols\(data\)\) throw new Error\('hot market response missing core assets'\)/);
});

test('production load thresholds remain strict while timeout checks are null-safe', () => {
  assert.match(load, /http_req_failed: \['rate<0\.01'\]/);
  assert.match(load, /http_req_duration\{endpoint:market-hot\}'\] = \['p\(95\)<750'\]/);
  assert.match(load, /const hasBody = \(response\) => typeof response\?\.body === 'string'/);
  assert.match(load, /const bodyIncludes = \(response, needle\) => hasBody\(response\) && response\.body\.includes\(needle\)/);
  assert.doesNotMatch(load, /r\.body\.includes\(/);
});
