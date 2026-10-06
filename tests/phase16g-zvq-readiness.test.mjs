import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 16G keeps the ZVQ supply migration target honest and non-final', async () => {
  const registry = JSON.parse(await read('chain/zevaryq-mainnet/registry/zvq-production-registry.draft.json'));
  assert.equal(registry.network.chainId, 22028);
  assert.equal(registry.network.chainIdHex, '0x560c');
  assert.equal(registry.network.nativeSymbol, 'ZVQ');
  assert.equal(registry.supplyPolicy.maximumSupplyProjectBaseline, '1000000000');
  assert.equal(registry.supplyPolicy.proposedInitialCirculatingTarget, '70000000');
  assert.equal(registry.supplyPolicy.legacyKamInitialCirculatingTarget, '50000000');
  assert.equal(registry.supplyPolicy.circulatingSupplyVerified, false);
  assert.equal(registry.supplyPolicy.externalSubmissionAllowed, false);
});

test('Phase 16G does not silently activate planned wrapped assets or zUSD', async () => {
  const registry = JSON.parse(await read('chain/zevaryq-mainnet/registry/zvq-production-registry.draft.json'));
  assert.deepEqual(registry.assets.filter(asset => asset.executable).map(asset => asset.symbol), ['ZVQ']);
  for (const asset of registry.assets.filter(asset => asset.symbol !== 'ZVQ')) {
    assert.equal(asset.contractAddress, null);
    assert.equal(asset.executable, false);
  }
  const zusd = registry.deprecatedAssets.find(asset => asset.symbol === 'zUSD');
  assert.equal(zusd.status, 'DEPRECATED_DO_NOT_INDEX');
});

test('Phase 16G liquidity package is preparation only and cannot authorize execution', async () => {
  const liquidity = JSON.parse(await read('chain/zevaryq-mainnet/liquidity/liquidity-readiness.draft.json'));
  assert.equal(liquidity.liquidityAuthorized, false);
  assert.equal(liquidity.publicSwapAuthorized, false);
  assert.equal(liquidity.mainnetContractDeploymentAuthorized, false);
  assert.equal(liquidity.requiresPhase16FLongRunStable, true);
  assert.ok(Object.values(liquidity.preconditions).every(value => value === false));
  assert.ok(liquidity.candidatePairs.every(pair =>
    pair.status === 'PLANNED'
    && pair.poolAddress === null
    && pair.liquidityAmountZVQ === null
    && pair.liquidityAmountQuote === null
  ));
});

test('Phase 16G verifier protects legacy deployment authorization gates', async () => {
  const verifier = await read('scripts/verify-phase16g-zvq-readiness.mjs');
  assert.match(verifier, /WZVQ_DEPLOYMENT_AUTHORIZED = false/);
  assert.match(verifier, /LIQUIDITY_AUTHORIZED = false/);
  assert.match(verifier, /PUBLIC_SWAP_AUTHORIZED = false/);
  assert.doesNotMatch(verifier, /eth_sendTransaction|eth_sendRawTransaction|wallet_requestPermissions|private.?key/i);
});

test('Phase 16G exchange package blocks unsupported supply and market claims', async () => {
  const doc = await read('docs/ZVQ_EXCHANGE_MARKET_SUBMISSION_PACKAGE.md');
  assert.match(doc, /NOT AUTHORIZED FOR FINAL SUBMISSION/);
  assert.match(doc, /70,000,000 ZVQ \(7%\)/);
  assert.match(doc, /NOT YET VERIFIED/);
  assert.match(doc, /FINAL_SUBMISSION_AUTHORIZED = false/);
  assert.match(doc, /candidate markets only/i);
});
