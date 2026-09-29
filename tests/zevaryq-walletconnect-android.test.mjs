import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('WalletConnect exposes pairing URI and deep-links MetaMask on mobile', async () => {
  const provider = await read('src/components/web3/Web3Provider.jsx');
  assert.match(provider, /walletConnectUri/);
  assert.match(provider, /display_uri/);
  assert.match(provider, /metamask\.app\.link\/wc\?uri=/);
  assert.match(provider, /openMetaMaskPairing/);
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
