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

test('Wallet service prefers ZVQ identity path and retains only a compatibility fallback', async () => {
  const service = await read('src/services/zevaryqNetwork.js');
  assert.match(service, /PUBLIC_STATUS_PATH = '\/api\/zvq\/network-status'/);
  assert.match(service, /LEGACY_PUBLIC_STATUS_PATH = '\/api\/kam\/network-status'/);
  assert.match(service, /for \(const basePath of \[PUBLIC_STATUS_PATH, LEGACY_PUBLIC_STATUS_PATH\]\)/);
  assert.match(service, /\[404, 405\]\.includes\(response\.status\)/);
  assert.doesNotMatch(service, /eth_sendRawTransaction|eth_sendTransaction/);
});

test('KriptoAman ZEVARYQ surface prefers the new path while exposing fallback provenance', async () => {
  const hook = await read('src/hooks/useZevaryqSurface.js');
  assert.match(hook, /NETWORK_ENDPOINTS = Object\.freeze\(\['\/api\/zvq\/network-status', '\/api\/kam\/network-status'\]\)/);
  assert.match(hook, /networkEndpoint: NETWORK_ENDPOINTS\[0\]/);
  assert.match(hook, /networkEndpointFallback: NETWORK_ENDPOINTS\[1\]/);
  assert.match(hook, /networkEndpointSelected: networkResult\.endpoint \|\| null/);
});
