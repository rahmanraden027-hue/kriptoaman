import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('platform status exposes stable component structure without fabricated values', async () => {
  const source = await read('functions/api/platform-status.js');
  for (const token of ['schemaVersion', "service: 'KriptoAman'", 'components', 'market:', 'networks:', 'kam:', 'overall', 'generatedAt']) {
    assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(source, /valuesAreLiveVerifiedOnly: true/);
  assert.match(source, /unavailableMetricsUseNull: true/);
  assert.match(source, /fabricatedMetrics: false/);
  assert.match(source, /chainId\) === 22028/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.doesNotMatch(source, /eth_sendTransaction|eth_sendRawTransaction|personal_|admin_|debug_|qbft_/);
});

test('platform status only aggregates read-only health endpoints', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /\/api\/market-snapshot\?health=1/);
  assert.match(source, /\/api\/network-health/);
  assert.match(source, /\/api\/kam\/network-status/);
});
