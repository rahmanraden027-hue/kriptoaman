import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KAM UI uses verified live data and never invents market values', async () => {
  const [card, endpoint, metadata] = await Promise.all([
    read('src/components/wallet/KAMTokenCard.jsx'),
    read('functions/api/kam/network-status.js'),
    read('public/kam-mainnet.json'),
  ]);
  assert.match(card, /\/api\/kam\/network-status/);
  assert.match(card, /network\.verified/);
  assert.match(card, /balanceZVQ/);
  assert.match(endpoint, /balanceKAM/); // Legacy additive API alias for existing clients.
  assert.doesNotMatch(card, /\$2\.47|marketPrice:\s*[1-9]/);
  assert.match(endpoint, /eth_chainId/);
  assert.match(endpoint, /eth_blockNumber/);
  assert.match(endpoint, /eth_syncing/);
  assert.match(endpoint, /syncStatus: syncing === false \? 'synced' : 'syncing'/);
  assert.match(endpoint, /eth_getBalance/);
  assert.match(endpoint, /RPC chain ID mismatch/);
  const probeTimeout = Number(endpoint.match(/NETWORK_PROBE_TIMEOUT_MS\s*=\s*(\d+)/)?.[1]);
  assert.ok(probeTimeout >= 3000 && probeTimeout <= 10000, 'network probe timeout must tolerate public RPC latency while remaining bounded');
  assert.match(endpoint, /AbortError/);
  assert.match(endpoint, /rpc-timeout/);
  assert.match(endpoint, /marketPrice:\s*null/);
  const parsed = JSON.parse(metadata);
  assert.equal(parsed.status, 'mainnet-candidate-not-public');
  assert.equal(parsed.commercialLaunchEnabled, false);
});
