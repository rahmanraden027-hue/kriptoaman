import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const ROOT = resolve('.');
const manifest = JSON.parse(await readFile('chain/zevaryq-mainnet/registry/zvq-asset-indexing-readiness.draft.json','utf8'));
const runtime = await readFile('src/data/zevaryqAssetRegistry.js','utf8');
const visual = await readFile('src/data/zevaryqVisualAssetCatalog.js','utf8');

assert.equal(manifest.phase, '16G-C');
assert.equal(manifest.status, 'INDEXING_READINESS_HOLD');
assert.equal(manifest.runtimeMutation, false);
assert.equal(manifest.canonicalNetwork.chainId, 22028);
assert.equal(manifest.canonicalNetwork.chainIdHex, '0x560c');
assert.equal(manifest.catalogPolicy.targetIdentityCount, 11);
assert.equal(manifest.catalogPolicy.productionVisualCapacity, 12);
assert.equal(manifest.catalogPolicy.reservedVisualSlots, 1);
assert.equal(manifest.assets.length, 11);
assert.equal(manifest.reservedSlots.length, 1);

const expectedSymbols = ['ZVQ','zBTC','zETH','zUSDT','zUSDC','zBNB','zSOL','zTRX','zXRP','zADA','zDOGE'];
assert.deepEqual(manifest.assets.map(a => a.symbol), expectedSymbols);
assert.equal(new Set(expectedSymbols).size, expectedSymbols.length);
assert.equal(manifest.reservedSlots[0].slot, 12);
assert.equal(manifest.reservedSlots[0].symbol, null);

const readyArtwork = [];
for (const asset of manifest.assets) {
  if (asset.logoStatus === 'READY') {
    assert.ok(asset.canonicalLogo, asset.symbol + ' READY logo must have path');
    const filePath = resolve(ROOT, 'public' + asset.canonicalLogo);
    await access(filePath);
    const bytes = await readFile(filePath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha256.length, 64);
    readyArtwork.push({symbol:asset.symbol,path:asset.canonicalLogo,sha256});
  } else {
    assert.equal(asset.canonicalLogo, null, asset.symbol + ' pending artwork must not point to placeholder art');
  }

  if (asset.symbol !== 'ZVQ') {
    assert.equal(asset.executable, false, asset.symbol + ' cannot be executable');
    assert.equal(asset.contractAddress, null, asset.symbol + ' cannot claim a deployed contract');
  }
}

assert.deepEqual(readyArtwork.map(x=>x.symbol), ['ZVQ','zBTC','zETH']);
assert.equal(new Set(readyArtwork.map(x=>x.sha256)).size, readyArtwork.length, 'canonical artwork files must be distinct');

const zbtc = manifest.assets.find(a=>a.symbol==='zBTC');
const zeth = manifest.assets.find(a=>a.symbol==='zETH');
assert.deepEqual(zbtc.legacyLogos, ['/assets/zevaryq/tokens/zbtc.svg']);
assert.deepEqual(zeth.legacyLogos, ['/assets/zevaryq/tokens/zeth.svg']);
for (const legacy of [...zbtc.legacyLogos, ...zeth.legacyLogos]) await access(resolve(ROOT,'public'+legacy));

const deprecated = manifest.deprecated.find(a=>a.symbol==='zUSD');
assert.ok(deprecated);
assert.equal(deprecated.status,'DEPRECATED_DO_NOT_INDEX');
assert.equal(deprecated.publishable,false);
assert.equal(deprecated.executable,false);
for (const legacy of deprecated.legacyArtwork) await access(resolve(ROOT,'public'+legacy));

for (const symbol of ['zUSDT','zUSDC','zBNB','zSOL','zTRX','zXRP','zADA','zDOGE']) {
  const asset = manifest.assets.find(a=>a.symbol===symbol);
  assert.equal(asset.logoStatus,'PENDING_ARTWORK');
  assert.equal(asset.runtimeStatus,'NOT_REGISTERED');
  assert.equal(asset.walletIndexing,'BLOCKED');
  assert.equal(asset.explorerIndexing,'BLOCKED');
  assert.equal(asset.qoryvexIndexing,'BLOCKED');
  assert.equal(asset.externalIndexing,'BLOCKED');
}

assert.match(runtime, /symbol: 'ZVQ'/);
assert.match(runtime, /symbol: 'zBTC'/);
assert.match(runtime, /symbol: 'zETH'/);
for (const symbol of ['zUSDT','zUSDC','zBNB','zSOL','zTRX','zXRP','zADA','zDOGE','zUSD']) {
  assert.doesNotMatch(runtime, new RegExp("symbol: ['\"]"+symbol+"['\"]"));
}

assert.match(visual, /ZEVARYQ_VISUAL_TARGET_COUNT = 12/);
assert.match(visual, /length: 9/);
assert.match(visual, /reservedSlotsPublishable: false/);
assert.match(visual, /activatesWalletAsset: false/);
assert.match(visual, /activatesSwapAsset: false/);

console.log('PHASE16G_C_ASSET_INDEXING_READINESS=PASS');
console.log(JSON.stringify({
  targetSymbols: expectedSymbols,
  readyArtwork,
  pendingArtwork: manifest.assets.filter(a=>a.logoStatus==='PENDING_ARTWORK').map(a=>a.symbol),
  deprecated: manifest.deprecated.map(a=>a.symbol),
  runtimeActivationChanged: manifest.runtimeMutation
},null,2));
