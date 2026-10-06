import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('ZVQ network-status alias delegates to the existing verified handler', async () => {
  const [alias, legacy] = await Promise.all([
    read('functions/api/zvq/network-status.js'),
    read('functions/api/kam/network-status.js'),
  ]);
  assert.match(alias, /legacyNetworkStatus/);
  assert.match(alias, /\.\.\/kam\/network-status\.js/);
  assert.match(alias, /return legacyNetworkStatus\(context\)/);
  assert.match(legacy, /networkName: 'ZEVARYQ Mainnet'/);
  assert.match(legacy, /symbol: 'ZVQ'/);
  assert.match(legacy, /EXPECTED_CHAIN_ID = 22028/);
  assert.match(legacy, /EXPECTED_CHAIN_ID_HEX = '0x560c'/);
});

test('Phase 16F preparation does not mutate the protected Wallet runtime path', async () => {
  const service = await read('src/services/zevaryqNetwork.js');
  assert.match(service, /PUBLIC_STATUS_PATH = '\/api\/kam\/network-status'/);
  assert.doesNotMatch(service, /LEGACY_PUBLIC_STATUS_PATH/);
  assert.doesNotMatch(service, /eth_sendRawTransaction|eth_sendTransaction/);
});

test('Platform runtime remains on the frozen endpoint until a governed transition', async () => {
  const hook = await read('src/hooks/useZevaryqSurface.js');
  assert.match(hook, /NETWORK_ENDPOINT = '\/api\/kam\/network-status'/);
  assert.doesNotMatch(hook, /NETWORK_ENDPOINTS = Object\.freeze/);
});
