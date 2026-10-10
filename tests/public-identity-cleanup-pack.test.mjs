import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const escapeRegex = value => value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');

test('public identity cleanup pack is preparation-only during Phase 16F', async () => {
  const pack = JSON.parse(await read('release/public-identity-cleanup-pack.json'));
  assert.equal(pack.status, 'prepared-not-applied');
  assert.equal(pack.applyAfter, 'phase16f-24h-pass');
  assert.equal(pack.runtimePolicy.productionFrozen, true);
  assert.equal(pack.runtimePolicy.mergeBefore24hPass, false);
  assert.equal(pack.runtimePolicy.deployBefore24hPass, false);
  assert.equal(pack.runtimePolicy.renameInternalCompatibilityPaths, false);
  assert.equal(pack.runtimePolicy.renameHistoricalArchives, false);
  assert.equal(pack.runtimePolicy.convertKamPointsToZvq, false);
  assert.equal(pack.canonicalIdentity.network, 'ZEVARYQ Mainnet');
  assert.equal(pack.canonicalIdentity.nativeAsset, 'ZVQ');
  assert.equal(pack.canonicalIdentity.chainId, 22028);
  assert.equal(pack.canonicalIdentity.chainIdHex, '0x560c');
});

test('planned public replacements correspond to real current identity drift', async () => {
  const pack = JSON.parse(await read('release/public-identity-cleanup-pack.json'));
  const cache = new Map();
  for (const item of pack.publicReplacementsAfter24hPass) {
    if (!cache.has(item.path)) cache.set(item.path, await read(item.path));
    assert.match(cache.get(item.path), new RegExp(escapeRegex(item.from)));
    assert.ok(item.to.includes('ZEVARYQ'));
  }
});

test('compatibility, history and off-chain rewards remain distinct from ZVQ identity', async () => {
  const pack = JSON.parse(await read('release/public-identity-cleanup-pack.json'));
  assert.ok(pack.retainAsCompatibility.includes('/api/kam/network-status'));
  assert.ok(pack.retainAsHistoricalArchive.includes('src/pages/KAMDEX.jsx'));
  assert.equal(pack.retainAsSeparateOffchainProduct[0].name, 'KAM Points');
  assert.match(pack.retainAsSeparateOffchainProduct[0].reason, /Off-chain/);
  assert.equal(pack.acceptance.noGenesisValidatorKeyBalanceSupplyLiquidityDnsConsensusRpcWriteMutation, true);
});
