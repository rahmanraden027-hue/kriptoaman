import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

const LEGACY_ICON = 'zevaryq-wallet-premium-icon.webp';

test('ZEVARYQ app and ZVQ token identities have separate canonical assets', async () => {
  const brand = await read('src/lib/zevaryqBrandAssets.js');
  const mark = await read('src/components/zevaryq-wallet/ZevaryqMark.jsx');

  assert.match(brand, /ZEVARYQ_APP_ICON = '\/brand\/zevaryq-app-icon-final-v1\.svg'/);
  assert.match(brand, /ZVQ_TOKEN_ICON = '\/brand\/zvq-token-icon-final-v1\.svg'/);
  assert.match(mark, /variant = 'app'/);
  assert.match(mark, /variant === 'token'/);
  assert.match(mark, /ZEVARYQ_APP_ICON/);
  assert.match(mark, /ZVQ_TOKEN_ICON/);
});

test('wallet uses app identity for chrome and QR, token identity for native ZVQ rows', async () => {
  const wallet = await read('src/pages/Wallet.jsx');
  assert.match(wallet, /imageSettings=\{\{src:ZEVARYQ_APP_ICON/);
  assert.match(wallet, /variant="token" className="h-12 w-12"/);
  assert.match(wallet, /variant="token" className="h-11 w-11"/);
  assert.doesNotMatch(wallet, new RegExp(LEGACY_ICON.replaceAll('.', '\\.')));
});

test('market, registry and WalletConnect no longer depend on legacy ZEVARYQ artwork', async () => {
  const files = await Promise.all([
    read('src/components/market/AssetLogo.jsx'),
    read('src/data/zevaryqAssetRegistry.js'),
    read('src/data/zevaryqVisualAssetCatalog.js'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
    read('src/components/web3/Web3Provider.jsx'),
  ]);
  for (const source of files) assert.doesNotMatch(source, new RegExp(LEGACY_ICON.replaceAll('.', '\\.')));
  assert.match(files[0], /ZVQ_TOKEN_ICON/);
  assert.match(files[1], /icon: ZVQ_TOKEN_ICON/);
  assert.match(files[2], /icon: ZVQ_TOKEN_ICON/);
  assert.match(files[3], /logo: ZVQ_TOKEN_ICON/);
  assert.match(files[4], /icons: \[ZEVARYQ_APP_ICON_ABSOLUTE\]/);
});

test('Android launcher is text-free Gold Z + Blue Halo and wallet splash uses it', async () => {
  const launcher = await read('android/app/src/main/res/drawable/zevaryq_wallet_launcher.xml');
  const walletSplash = await read('android/app/src/wallet/res/drawable/zevaryq_premium_launcher.xml');
  assert.match(launcher, /#F2C86B/);
  assert.match(launcher, /#53D8FB/);
  assert.doesNotMatch(launcher, /VQ monogram/);
  assert.match(walletSplash, /zevaryq_wallet_launcher/);
});
