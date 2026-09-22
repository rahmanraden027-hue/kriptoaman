import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const json = async path => JSON.parse(await read(path));

test('ZEVARYQ is the canonical identity for Chain ID 22028 without resetting chain state', async () => {
  const [decision, profile, metadata, developer] = await Promise.all([
    json('chain/kam-mainnet/zevaryq-rebrand.json'),
    json('chain/kam-mainnet/network-profile.json'),
    json('public/zevaryq-mainnet.json'),
    json('explorer-dashboard/developer-network.json'),
  ]);

  assert.equal(decision.decision, 'approved');
  assert.equal(decision.migration.type, 'in-place-rebrand');
  assert.equal(decision.migration.productionCutoverApproved, true);
  assert.equal(decision.migration.destructiveChainMigration, false);
  assert.equal(decision.technicalContinuity.chainId, 22028);
  assert.equal(decision.technicalContinuity.chainIdHex, '0x560c');
  for (const key of ['newGenesis', 'resetBlockchain', 'resetBalances', 'changeAddresses', 'changeValidatorKeys', 'deleteBlockHistory']) {
    assert.equal(decision.technicalContinuity[key], false, `${key} must remain false`);
  }

  for (const item of [profile, metadata, developer]) {
    const chainId = item.candidateChainId ?? item.chainId;
    const chainIdHex = item.candidateChainIdHex ?? item.chainIdHex;
    assert.equal(chainId, 22028);
    assert.equal(chainIdHex, '0x560c');
    assert.equal(item.networkName ?? item.name, 'ZEVARYQ Mainnet');
    assert.equal(item.nativeCurrency.symbol, 'ZVQ');
  }
});

test('canonical public ZEVARYQ surfaces do not publish the retired KAM network identity', async () => {
  const paths = [
    'public/zevaryq-mainnet.json',
    'explorer-dashboard/developer-network.json',
    'src/theme/zevaryqWallet.js',
    'src/pages/KAMNetwork.jsx',
    'src/pages/KAMDeveloper.jsx',
    'src/pages/KAMTransactionLab.jsx',
    'src/pages/KAMNetworkDocs.jsx',
    'explorer-dashboard/index.html',
    'explorer-dashboard/developer.html',
    'explorer-dashboard/developer-docs.html',
    'explorer-dashboard/developer-starter.html',
    'explorer-dashboard/status.html',
  ];
  const forbidden = [
    'KriptoAman Mainnet Candidate',
    'KriptoAman Mainnet',
    'KAM Network',
    "symbol: 'KAM'",
    '"symbol": "KAM"',
  ];

  for (const path of paths) {
    const source = await read(path);
    for (const phrase of forbidden) {
      assert.equal(source.includes(phrase), false, `${path} still publishes retired identity: ${phrase}`);
    }
  }
});

test('legacy routes remain compatibility aliases instead of destructive deletions', async () => {
  const [legacyApi, legacyProfile, legacyMetadata, canonicalMetadata] = await Promise.all([
    read('functions/api/kam/network-status.js'),
    read('functions/api/kam/address-profile/[address].js'),
    json('public/kam-mainnet.json'),
    json('public/zevaryq-mainnet.json'),
  ]);

  assert.match(legacyApi, /zevaryq\/network-status/);
  assert.match(legacyProfile, /zevaryq\/address-profile/);
  assert.equal(legacyMetadata.legacyAlias, true);
  assert.equal(legacyMetadata.canonicalPath, '/zevaryq-mainnet.json');
  assert.equal(canonicalMetadata.nativeCurrency.symbol, 'ZVQ');
});

test('legacy on-chain WKAM identity remains preserved and explicitly historical', async () => {
  const tokenSurface = await read('explorer-dashboard/tokens.html');
  assert.match(tokenSurface, /Legacy Wrapped KAM/);
  assert.match(tokenSurface, /WKAM/);
  assert.match(tokenSurface, /0x0d8848CE88BB09a81a4248Efdd574d50B98b544A/);
});
