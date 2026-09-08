import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../functions/api/network-health.js', import.meta.url), 'utf8');

test('ordinary public network-health reads have a bounded cold path', () => {
  assert.match(source, /const DURABLE_READ_BUDGET_MS = 500/);
  assert.match(source, /const PUBLIC_RESPONSE_BUDGET_MS = 6500/);
  assert.match(source, /const EDGE_CACHE_WRITE_BUDGET_MS = 400/);
  assert.match(source, /const snapshot = await withDeadline\(refresh, PUBLIC_RESPONSE_BUDGET_MS, null\)/);
  assert.match(source, /deliveryMode: 'warming-background-refresh'/);
  assert.match(source, /verified_snapshot_unavailable_within_response_budget/);
  assert.match(source, /backgroundRefreshContinues: true/);
});

test('bounded fallback never fabricates network evidence', () => {
  assert.match(source, /summary: null/);
  assert.match(source, /networks: \[\]/);
  assert.match(source, /checked_at: null/);
  assert.match(source, /unavailableMetricsUseNull: true/);
  assert.match(source, /fabricatedMetrics: false/);
  assert.match(source, /return json\(warmingPayload\(deliveryMode\), \{ status: 503 \}/);
});

test('background refresh can finish and persist after response budget expires', () => {
  assert.match(source, /refresh\.then\(\(fresh\) => persistDurableSnapshot\(env, fresh\)\)/);
  assert.match(source, /scheduleBackground\([\s\S]*refresh\.then\(\(fresh\) => persistDurableSnapshot\(env, fresh\)\)/);
});

test('fresh-only cache policy remains strict and reduces immediate cold-read races', () => {
  assert.match(source, /edgeCacheEligible: !forceRefresh && deliveryMode === 'fresh-probe'/);
  assert.match(source, /!forceRefresh && edgeCache && status === 200 && deliveryMode === 'fresh-probe'/);
  assert.match(source, /edgeCache\.put\(cacheKey, response\.clone\(\)\)/);
  assert.match(source, /await withDeadline\(cacheWrite, EDGE_CACHE_WRITE_BUDGET_MS, false\)/);
  assert.doesNotMatch(source, /deliveryMode === 'd1-recent-verified'[\s\S]{0,220}edgeCache\.put/);
});

test('explicit refresh and minimum verified-network standard are not weakened', () => {
  assert.match(source, /const MIN_ACTIVE_TARGET = 12/);
  assert.match(source, /if \(forceRefresh\) \{[\s\S]*const snapshot = await startRefresh\(\)/);
  assert.match(source, /refreshParameterAlwaysForcesFreshProbe: true/);
  assert.match(source, /liveOnlineRequiresSuccessfulCurrentProbe: true/);
  assert.match(source, /lastKnownGoodNeverCountsAsOnline: true/);
  assert.doesNotMatch(source, /Math\.random/);
});
