import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Android builds KriptoAman Platform and ZEVARYQ Wallet as separate applications', async () => {
  const [gradle, platformStrings, walletStrings, platformConfig, walletConfig, app] = await Promise.all([
    read('android/app/build.gradle'),
    read('android/app/src/main/res/values/strings.xml'),
    read('android/app/src/wallet/res/values/strings.xml'),
    read('android/app/src/platform/assets/capacitor.config.json').then(JSON.parse),
    read('android/app/src/wallet/assets/capacitor.config.json').then(JSON.parse),
    read('src/FullAppShell.jsx'),
  ]);

  assert.match(gradle, /flavorDimensions\s+"product"/);
  assert.match(gradle, /platform\s*\{[\s\S]*applicationId\s+"com\.kriptoaman\.app"/);
  assert.match(gradle, /wallet\s*\{[\s\S]*applicationId\s+"com\.kriptoaman\.wallet"/);
  assert.match(platformStrings, /<string name="app_name">KriptoAman<\/string>/);
  assert.match(platformStrings, /<string name="launcher_name">KriptoAman<\/string>/);
  assert.match(walletStrings, /<string name="app_name">ZEVARYQ Wallet<\/string>/);
  assert.match(walletStrings, /<string name="launcher_name">ZVQ Wallet<\/string>/);
  assert.equal(platformConfig.server.url, 'https://kriptoaman.com');
  assert.equal(walletConfig.server.url, 'https://kriptoaman.com/wallet-app');
  assert.match(app, /path="\/wallet-app"/);
  assert.match(app, /WalletStandalonePage/);
  assert.match(app, /<Web3Provider><WalletStandalonePage \/><\/Web3Provider>/);
});

test('wallet flavor stays non-custodial at the application split boundary', async () => {
  const [wallet, manifest, walletConfig] = await Promise.all([
    read('src/pages/Wallet.jsx'),
    read('android/app/src/main/AndroidManifest.xml'),
    read('android/app/src/wallet/assets/capacitor.config.json'),
  ]);
  assert.doesNotMatch(wallet + walletConfig, /private.?key|mnemonic|seed phrase storage|eth_sign/i);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.doesNotMatch(manifest, /READ_SMS|READ_CONTACTS|ACCESS_FINE_LOCATION|RECORD_AUDIO/);
});


test('standalone ZEVARYQ wallet route has a live Web3 provider', async () => {
  const app = await read('src/FullAppShell.jsx');
  const provider = await read('src/components/web3/Web3Provider.jsx');
  assert.match(app, /const Web3Provider = lazy\(\(\) => import\('@\/components\/web3\/Web3Provider'\)\.then\(\(module\) => \(\{ default: module\.Web3Provider \}\)\)\);/);
  assert.match(app, /path="\/wallet-app"[\s\S]*<Web3Provider><WalletStandalonePage \/><\/Web3Provider>/);
  assert.match(provider, /connectWalletConnect/);
  assert.match(provider, /walletConnectConfigured/);
});
