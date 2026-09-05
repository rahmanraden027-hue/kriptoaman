import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageUrl = new URL('../src/pages/AdminSKAMLaunch.jsx', import.meta.url);
const pagesConfigUrl = new URL('../src/pages.config.js', import.meta.url);
const appUrl = new URL('../src/App.jsx', import.meta.url);

const [page, pagesConfig, app] = await Promise.all([
  readFile(pageUrl, 'utf8'),
  readFile(pagesConfigUrl, 'utf8'),
  readFile(appUrl, 'utf8'),
]);

const approvedWallet = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';

test('sKAM Phantom gate is bound to the approved public operator wallet', () => {
  assert.match(page, new RegExp(approvedWallet));
  assert.match(page, /address === APPROVED_WALLET/);
  assert.match(page, /MIN_PLANNED_SOL = 0\.44/);
  assert.match(page, /LIQUIDITY_SOL = 0\.2/);
});

test('sKAM Phantom gate proves control with an off-chain signature', () => {
  assert.match(page, /phantom\.signMessage/);
  assert.match(page, /ed25519\.verify/);
  assert.match(page, /NOT an on-chain transaction/);
});

test('sKAM Phantom gate contains no transaction execution surface or secret recovery mechanism', () => {
  for (const forbidden of [
    /\.sendTransaction\s*\(/,
    /\.signTransaction\s*\(/,
    /\.signAllTransactions\s*\(/,
    /\.createPool\s*\(/,
    /\.mintTo\s*\(/,
    /PRIVATE_KEY\s*=/,
    /SECRET_KEY\s*=/,
    /solana-keygen\s+recover/i,
    /mnemonic\s*=/i,
  ]) {
    assert.doesNotMatch(page, forbidden);
  }
});

test('sKAM launch gate is registered and admin-protected', () => {
  assert.match(pagesConfig, /'AdminSKAMLaunch'/);
  assert.match(app, /'AdminSKAMLaunch'/);
  assert.match(app, /ADMIN_PAGE_KEYS\.has\(path\)/);
});

test('sKAM gate verifies official metadata and logo paths', () => {
  assert.ok(page.includes("fetch('/token/skam.json'"));
  assert.ok(page.includes('https://kriptoaman.com/token/skam-logo.png'));
});
