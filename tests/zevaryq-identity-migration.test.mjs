import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('canonical ZEVARYQ identity preserves chain continuity', async () => {
  const decision = JSON.parse(await read('chain/kam-mainnet/zevaryq-rebrand.json'));
  assert.equal(decision.newIdentity.mainnetName, 'ZEVARYQ Mainnet');
  assert.equal(decision.newIdentity.symbol, 'ZVQ');
  assert.equal(decision.technicalContinuity.chainId, 22028);
  assert.equal(decision.technicalContinuity.chainIdHex, '0x560c');
  assert.equal(decision.technicalContinuity.newGenesis, false);
  assert.equal(decision.technicalContinuity.resetBlockchain, false);
  assert.equal(decision.technicalContinuity.resetBalances, false);
  assert.equal(decision.technicalContinuity.changeValidatorKeys, false);
  assert.equal(decision.technicalContinuity.deleteBlockHistory, false);
});

test('all public Explorer route bundles use the active ZEVARYQ identity', async () => {
  const directory = new URL('../explorer-dashboard/', import.meta.url);
  const files = (await readdir(directory)).filter((name) => /\.(?:html|json)$/.test(name));
  for (const file of files) {
    const source = await read(`explorer-dashboard/${file}`);
    assert.doesNotMatch(source, /\bKAM\b/, `${file} still exposes the legacy KAM identity`);
  }

  const network = JSON.parse(await read('explorer-dashboard/developer-network.json'));
  assert.equal(network.networkName, 'ZEVARYQ Mainnet');
  assert.equal(network.chainId, 22028);
  assert.equal(network.chainIdHex, '0x560c');
  assert.deepEqual(network.nativeCurrency, { name: 'ZEVARYQ', symbol: 'ZVQ', decimals: 18 });
});

test('active website and wallet metadata agree on ZEVARYQ', async () => {
  const [landing, docs, walletMetadata] = await Promise.all([
    read('src/components/landing/GLandingHero.jsx'),
    read('src/pages/KAMNetworkDocs.jsx'),
    read('public/kam-mainnet.json'),
  ]);
  assert.match(landing, /ZEVARYQ Explorer/);
  assert.match(landing, /ZEVARYQ Mainnet/);
  assert.match(docs, /ZEVARYQ Network/);

  const network = JSON.parse(walletMetadata);
  assert.equal(network.name, 'ZEVARYQ Mainnet');
  assert.equal(network.chainId, 22028);
  assert.equal(network.nativeCurrency.symbol, 'ZVQ');
});

test('historical KAM publications are clearly retained as legacy records', async () => {
  const [campaign, tokenomics] = await Promise.all([
    read('src/pages/KAMCampaignNews.jsx'),
    read('src/pages/KAMTokenomics.jsx'),
  ]);
  assert.match(campaign, /Arsip identitas lama/);
  assert.match(campaign, /KAM tidak lagi digunakan sebagai label jaringan aktif/);
  assert.match(tokenomics, /Legacy economic record/);
  assert.match(tokenomics, /belum otomatis menjadi tokenomics ZVQ/);
});
