import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('genesis attestation collector is read-only and privacy-preserving by default', async () => {
  const script = await read('scripts/collect-zvq-genesis-attestation.mjs');
  assert.match(script, /sha256/);
  assert.match(script, /aggregateAllocWei/);
  assert.match(script, /aggregateAllocZVQ/);
  assert.match(script, /eth_chainId/);
  assert.match(script, /eth_getBlockByNumber/);
  assert.match(script, /eth_blockNumber/);
  assert.match(script, /allocationAddressesPublished: false/);
  assert.match(script, /allocationAddressesEmitted: false/);
  assert.match(script, /chainMutationPerformed: false/);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|personal_|admin_|debug_|wallet_requestPermissions/);
});

test('collector never promotes aggregate genesis allocation to current/circulating supply', async () => {
  const script = await read('scripts/collect-zvq-genesis-attestation.mjs');
  assert.match(script, /currentTotalSupplyVerified: false/);
  assert.match(script, /currentCirculatingSupplyVerified: false/);
  assert.match(script, /maximumSupplyTechnicallyEnforcedVerified: false/);
});
