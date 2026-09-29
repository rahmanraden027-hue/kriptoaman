import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('WalletConnect exposes pairing URI and uses native MetaMask handoff on Android', async () => {
  const provider = await read('src/components/web3/Web3Provider.jsx');
  assert.match(provider, /walletConnectUri/);
  assert.match(provider, /display_uri/);
  assert.match(provider, /metamask:\/\/wc\?uri=/);
  assert.match(provider, /metamask\.app\.link\/wc\?uri=/);
  assert.match(provider, /NativeUtility\.openExternalWallet/);
  assert.match(provider, /packageName:\s*'io\.metamask'/);
  assert.match(provider, /showQrModal:\s*!Capacitor\.isNativePlatform\(\)/);
  assert.match(provider, /openMetaMaskPairing/);
});

test('WalletConnect metadata can return to the correct KriptoAman Android flavor', async () => {
  const provider = await read('src/components/web3/Web3Provider.jsx');
  const manifest = await read('android/app/src/main/AndroidManifest.xml');
  assert.match(provider, /redirect:\s*\{/);
  assert.match(provider, /com\.kriptoaman\.wallet:\/\/wc/);
  assert.match(provider, /com\.kriptoaman\.app:\/\/wc/);
  assert.match(manifest, /android:scheme="@string\/custom_url_scheme"/);
  assert.match(manifest, /android:host="wc"/);
});

test('Android native bridge opens MetaMask explicitly and falls back safely', async () => {
  const plugin = await read('android/app/src/main/java/com/kriptoaman/app/KriptoAmanNativePlugin.java');
  const manifest = await read('android/app/src/main/AndroidManifest.xml');
  assert.match(plugin, /openExternalWallet/);
  assert.match(plugin, /Intent\.ACTION_VIEW/);
  assert.match(plugin, /intent\.setPackage\(packageName\.trim\(\)\)/);
  assert.match(plugin, /fallbackUrl/);
  assert.match(manifest, /android:name="io\.metamask"/);
  assert.match(manifest, /android:scheme="metamask"/);
});

test('Android wallet connection UI has visible QR and manual pairing fallbacks', async () => {
  const connector = await read('src/components/zevaryq-wallet/ZevaryqWalletConnector.jsx');
  assert.match(connector, /Open MetaMask via WalletConnect/);
  assert.match(connector, /Pair another compatible wallet/);
  assert.match(connector, /WalletConnect Pairing Ready/);
  assert.match(connector, /QRCodeSVG/);
  assert.match(connector, /Copy pairing URI/);
});

test('WalletConnect pairing does not enable signing or broadcasting by itself', async () => {
  const provider = await read('src/components/web3/Web3Provider.jsx');
  assert.match(provider, /READ_ONLY_RELEASE/);
  assert.match(provider, /Transaksi dinonaktifkan pada rilis publik KriptoAman/);
  assert.match(provider, /Penandatanganan dinonaktifkan pada rilis publik KriptoAman/);
});
