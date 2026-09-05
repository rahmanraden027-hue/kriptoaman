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

test('sKAM Phantom gate proves control with an off-chain signature before transactions', () => {
  assert.match(page, /phantom\.signMessage/);
  assert.match(page, /ed25519\.verify/);
  assert.match(page, /NOT an on-chain transaction/);
  assert.match(page, /if \(!launchGateReady\) throw new Error/);
});

test('sKAM mint transaction uses canonical SPL helpers and the approved fixed supply', () => {
  assert.match(page, /MINT_DECIMALS = 9/);
  assert.match(page, /TOTAL_SUPPLY_BASE_UNITS = 1_000_000_000_000_000_000n/);
  assert.match(page, /createInitializeMint2Instruction/);
  assert.match(page, /createAssociatedTokenAccountInstruction/);
  assert.match(page, /createMintToCheckedInstruction/);
  assert.match(page, /transaction\.partialSign\(mintKeypair\)/);
  assert.match(page, /phantom\.signAndSendTransaction/);
  assert.match(page, /\/api\/solana\/skam-mint-prep/);
  assert.match(page, /\/api\/solana\/skam-mint-verify/);
});

test('sKAM mint execution does not persist or recover secret signing material', () => {
  for (const forbidden of [
    /mintKeypair\.secretKey/,
    /PRIVATE_KEY\s*=/,
    /SECRET_KEY\s*=/,
    /solana-keygen\s+recover/i,
    /mnemonic\s*=/i,
    /\.createPool\s*\(/,
    /\.swap\s*\(/,
  ]) {
    assert.doesNotMatch(page, forbidden);
  }
  assert.match(page, /sessionStorage\.setItem\(PENDING_MINT_KEY, nextMint\)/);
  assert.match(page, /sessionStorage\.setItem\(PENDING_SIGNATURE_KEY, nextSignature\)/);
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
