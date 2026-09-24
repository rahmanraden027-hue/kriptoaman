import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../.github/workflows/kam-mainnet-24x7-monitor.yml', import.meta.url),
  'utf8',
);

test('a degraded site status never suppresses the independent chain proof', () => {
  assert.match(workflow, /id: status_contract\s+continue-on-error: true/);
  assert.match(workflow, /id: public_proof\s+if: always\(\)/);
  assert.match(workflow, /node chain\/kam-mainnet\/scripts\/verify-public-endpoints\.mjs/);
  assert.match(workflow, /node scripts\/assess-zevaryq-public-proof\.mjs/);
});

test('both the raw public status and independent report remain available for diagnosis', () => {
  assert.match(workflow, /-o artifacts\/kam-network-status\.json/);
  assert.match(workflow, /path: artifacts\/\*\.json/);
  assert.match(workflow, /name: Upload KAM monitoring evidence\s+if: always\(\)/);
});

test('independent success cannot hide a failed public site health response', () => {
  assert.match(workflow, /name: Enforce both public health contracts\s+if: always\(\)/);
  assert.match(workflow, /steps\.status_contract\.outcome[^\n]*== success/);
  assert.match(workflow, /steps\.public_proof\.outcome[^\n]*== success/);
  assert.match(workflow, /if \(p\.live !== true \|\| p\.verified !== true\) process\.exit\(6\)/);
});
