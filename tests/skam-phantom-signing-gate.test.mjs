import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageUrl = new URL('../src/pages/AdminSKAMLaunch.jsx', import.meta.url);
const builderUrl = new URL('../src/lib/skamToken2022Builder.js', import.meta.url);
const pagesConfigUrl = new URL('../src/pages.config.js', import.meta.url);
const appUrl = new URL('../src/App.jsx', import.meta.url);

const [page, builder, pagesConfig, app] = await Promise.all([
  readFile(pageUrl, 'utf8'),
  readFile(builderUrl, 'utf8'),
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

test('sKAM Phantom gate proves control with an off-chain signature before writes', () => {
  assert.match(page, /phantom\.signMessage/);
  assert.match(page, /ed25519\.verify/);
  assert.match(page, /NOT an on-chain transaction/);
  assert.match(page, /launchGateReady = addressMatches && balanceReady && proofVerified && metadataReady/);
});

test('real sKAM mint requires simulation, explicit summary and Phantom approval', () => {
  assert.match(page, /if \(!launchGateReady\).*Signing gate belum READY/);
  assert.match(page, /window\.confirm\(/);
  assert.match(page, /TRANSAKSI NYATA SOLANA MAINNET/);
  assert.match(page, /await simulateTransaction\(connection, transaction\)/);
  assert.match(page, /phantom\.signAndSendTransaction\(transaction/);
  assert.match(page, /skipPreflight: false/);
  assert.match(page, /confirmTransaction/);
  assert.match(page, /verifySkamMintAccount/);
});

test('mint is deterministic, atomic and duplicate/conflict protected', () => {
  assert.match(builder, /SKAM_MINT_SEED = 'kriptoaman-skam-v1'/);
  assert.match(builder, /PublicKey\.createWithSeed/);
  assert.match(builder, /SystemProgram\.createAccountWithSeed/);
  assert.match(builder, /createInitializeMetadataPointerInstruction/);
  assert.match(builder, /createInitializeMint2Instruction/);
  assert.match(builder, /createInitializeTokenMetadataInstruction/);
  assert.match(builder, /createAssociatedTokenAccountInstruction/);
  assert.match(builder, /createMintToCheckedInstruction/);
  assert.match(page, /existing\.exists && existing\.verified/);
  assert.match(page, /CONFLICT — LOCKED/);
});

test('mainnet mint UI contains no secret recovery and no pool/swap execution surface', () => {
  const combined = `${page}\n${builder}`;
  for (const forbidden of [
    /PRIVATE_KEY\s*=/,
    /SECRET_KEY\s*=/,
    /solana-keygen\s+recover/i,
    /mnemonic\s*=/i,
    /seed phrase\s*=/i,
    /\.createPool\s*\(/,
    /smoke-swap\.mjs/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
  assert.match(page, /Pool Raydium 0\.20 SOL BELUM dibuat/);
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
