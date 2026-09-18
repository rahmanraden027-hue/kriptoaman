import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const worker = await readFile(new URL('../chain/kam-mainnet/explorer-cutover-worker/worker.js', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/kam-explorer-origin-cutover.yml', import.meta.url), 'utf8');

test('cutover worker rewrites browser RPC to same-origin without fabricating indexer health', () => {
  assert.match(worker, /RPC='\/rpc'/);
  assert.match(worker, /Same-origin \/rpc gateway/);
  assert.match(worker, /KAM RPC via \/rpc/);
  assert.match(worker, /Reconnecting/);
  assert.match(worker, /Partial/);
  assert.match(worker, /x-kam-explorer-browser-rpc/);
  assert.doesNotMatch(worker, /state\('apiState','Online','ok'\);health\('hApi','Online','ok'\)/);
});

test('cutover workflow does not route broken API v2 through the legacy asset worker', () => {
  assert.doesNotMatch(workflow, /API_ROUTE_PATTERN/);
  assert.doesNotMatch(workflow, /Route Blockscout API v2 to preserved Explorer gateway/);
  assert.match(workflow, /blockscout_api_state=/);
  assert.match(workflow, /x-kam-explorer-browser-rpc: same-origin/);
  assert.match(workflow, /eth_chainId/);
  assert.match(workflow, /eth_blockNumber/);
  assert.match(workflow, /Roll back production route on verification failure/);
});
