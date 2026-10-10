import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../'+path, import.meta.url),'utf8');

test('Phase 16G-C defines 11 target identities plus one reserved visual slot', async () => {
  const m = JSON.parse(await read('chain/zevaryq-mainnet/registry/zvq-asset-indexing-readiness.draft.json'));
  assert.equal(m.phase,'16G-C');
  assert.equal(m.assets.length,11);
  assert.equal(m.reservedSlots.length,1);
  assert.equal(m.catalogPolicy.productionVisualCapacity,12);
  assert.deepEqual(m.assets.map(a=>a.symbol),['ZVQ','zBTC','zETH','zUSDT','zUSDC','zBNB','zSOL','zTRX','zXRP','zADA','zDOGE']);
});

test('only ZVQ zBTC and zETH have canonical artwork today', async () => {
  const m = JSON.parse(await read('chain/zevaryq-mainnet/registry/zvq-asset-indexing-readiness.draft.json'));
  assert.deepEqual(m.assets.filter(a=>a.logoStatus==='READY').map(a=>a.symbol),['ZVQ','zBTC','zETH']);
  assert.deepEqual(m.assets.filter(a=>a.logoStatus==='PENDING_ARTWORK').map(a=>a.symbol),['zUSDT','zUSDC','zBNB','zSOL','zTRX','zXRP','zADA','zDOGE']);
});

test('zUSD is deprecated and cannot return through indexing', async () => {
  const m = JSON.parse(await read('chain/zevaryq-mainnet/registry/zvq-asset-indexing-readiness.draft.json'));
  const z = m.deprecated.find(a=>a.symbol==='zUSD');
  assert.equal(z.status,'DEPRECATED_DO_NOT_INDEX');
  assert.equal(z.publishable,false);
  assert.equal(z.executable,false);
});

test('readiness catalog cannot activate runtime assets', async () => {
  const m = JSON.parse(await read('chain/zevaryq-mainnet/registry/zvq-asset-indexing-readiness.draft.json'));
  assert.equal(m.runtimeMutation,false);
  assert.equal(m.catalogPolicy.runtimeRegistryPromotionAutomatic,false);
  for(const a of m.assets.filter(a=>a.symbol!=='ZVQ')) {
    assert.equal(a.executable,false);
    assert.equal(a.contractAddress,null);
  }
});

test('pending issuer and altcoin identities remain blocked cross-surface', async () => {
  const m = JSON.parse(await read('chain/zevaryq-mainnet/registry/zvq-asset-indexing-readiness.draft.json'));
  for(const symbol of ['zUSDT','zUSDC','zBNB','zSOL','zTRX','zXRP','zADA','zDOGE']) {
    const a=m.assets.find(x=>x.symbol===symbol);
    assert.equal(a.walletIndexing,'BLOCKED');
    assert.equal(a.explorerIndexing,'BLOCKED');
    assert.equal(a.qoryvexIndexing,'BLOCKED');
    assert.equal(a.externalIndexing,'BLOCKED');
  }
});
