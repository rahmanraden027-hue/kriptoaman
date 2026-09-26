import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('ZEVARYQ canonical public metadata preserves chain identity and no fabricated commercial status', async () => {
  const metadata = JSON.parse(await read('public/kam-mainnet.json'));
  assert.equal(metadata.name, 'ZEVARYQ Mainnet');
  assert.equal(metadata.nativeCurrency.symbol, 'ZVQ');
  assert.equal(metadata.chainId, 22028);
  assert.equal(metadata.commercialLaunchEnabled, false);
  const profile = JSON.parse(await read('chain/kam-mainnet/network-profile.json'));
  assert.equal(profile.rebrand.genesisUnchanged, true);
  assert.equal(profile.rebrand.balancesUnchanged, true);
});

test('Public frontend, status API, wallet and Android agree on network branding', async () => {
  const [landing, status, wallet, api, docs, native, styles, icon24] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/pages/KAMNetwork.jsx'),
    read('src/pages/Wallet.jsx'),
    read('functions/api/kam/network-status.js'),
    read('src/pages/KAMNetworkDocs.jsx'),
    read('android/app/src/main/java/com/kriptoaman/app/MainActivity.java'),
    read('android/app/src/main/res/values/styles.xml'),
    read('android/app/src/main/res/mipmap-anydpi-v24/ic_launcher.xml'),
  ]);
  assert.match(landing, /name: 'ZEVARYQ Network'/);
  assert.match(landing, /symbol: 'ZVQ'/);
  assert.match(status, /chainName: 'ZEVARYQ Mainnet'/);
  assert.match(wallet, /ZEVARYQ\.network/);
  assert.match(api, /networkName: 'ZEVARYQ Mainnet'/);
  assert.match(api, /balanceZVQ:/);
  assert.match(api, /balanceKAM:/); // Temporary additive compatibility alias only.
  assert.match(docs, /ZEVARYQ Network/);
  assert.match(native, /R\.drawable\.zevaryq_wallet_launcher/);
  assert.match(styles, /@drawable\/zevaryq_wallet_launcher/);
  assert.match(icon24, /@drawable\/zevaryq_wallet_launcher/);
});

test('Historical economics and reward points are not mislabeled as current ZVQ supply', async () => {
  const [oldEconomics, card, dex, newProfile] = await Promise.all([
    read('src/pages/KAMTokenomics.jsx'),
    read('src/components/wallet/KAMTokenCard.jsx'),
    read('src/pages/KAMDEX.jsx'),
    read('src/pages/ZEVARYQ.jsx'),
  ]);
  assert.match(oldEconomics, /HISTORICAL KAM ECONOMIC ARCHIVE/);
  assert.match(card, /KAM Points/);
  assert.match(card, /balanceZVQ/);
  assert.match(card, /no automatic conversion is implied/);
  assert.match(dex, /Legacy KAM DEX/);
  assert.match(newProfile, /mainnet publik|public-mainnet promotion/);
  assert.doesNotMatch(newProfile, /70[,.]000[,.]000|1[,.]000[,.]000[,.]000 ZVQ/);
});
