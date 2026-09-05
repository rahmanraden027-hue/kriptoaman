import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [page, readiness, shared, mintPrep, mintVerify] = await Promise.all([
  readFile(new URL('../src/pages/AdminSKAMLaunch.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../functions/api/solana/skam-readiness.js', import.meta.url), 'utf8'),
  readFile(new URL('../functions/api/solana/_skam-admin.js', import.meta.url), 'utf8'),
  readFile(new URL('../functions/api/solana/skam-mint-prep.js', import.meta.url), 'utf8'),
  readFile(new URL('../functions/api/solana/skam-mint-verify.js', import.meta.url), 'utf8'),
]);
const approvedWallet = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';

test('sKAM admin page reads Solana state through same-origin endpoints, not browser RPC', () => {
  assert.ok(page.includes("fetch('/api/solana/skam-readiness'"));
  assert.ok(page.includes("fetch('/api/solana/skam-mint-prep'"));
  assert.match(page, /credentials: 'same-origin'/);
  assert.doesNotMatch(page, /new Connection\s*\(/);
});

test('sKAM Solana endpoints share verified admin and 2FA enforcement', () => {
  assert.match(shared, /verifySessionToken/);
  assert.match(shared, /getActiveSession/);
  assert.match(shared, /user\.role !== 'admin'/);
  assert.match(shared, /Admin 2FA required/);
  for (const endpoint of [readiness, mintPrep, mintVerify]) assert.match(endpoint, /requireVerifiedAdmin/);
});

test('sKAM shared RPC client is fixed-purpose and not environment-selectable', () => {
  assert.match(shared, new RegExp(approvedWallet));
  assert.match(shared, /solana-rpc\.publicnode\.com/);
  assert.match(shared, /api\.mainnet-beta\.solana\.com/);
  assert.doesNotMatch(shared, /env\.SOLANA_RPC_URL/);
  assert.doesNotMatch(shared, /request\.json\s*\(/);
});

test('sKAM mint prep exposes only deterministic public transaction inputs', () => {
  for (const field of ['getLatestBlockhash', 'getMinimumBalanceForRentExemption', 'getBalance']) assert.match(mintPrep, new RegExp(field));
  assert.match(mintPrep, /MINT_SIZE/);
  assert.match(mintPrep, /TOTAL_SUPPLY_BASE_UNITS/);
  assert.doesNotMatch(mintPrep, /sendTransaction/);
  assert.doesNotMatch(mintPrep, /private[_-]?key/i);
});

test('sKAM mint verification requires canonical mint state and full wallet ownership', () => {
  assert.match(mintVerify, /TOKEN_PROGRAM_ID/);
  assert.match(mintVerify, /TOTAL_SUPPLY_BASE_UNITS/);
  assert.match(mintVerify, /info\.mintAuthority !== APPROVED_WALLET/);
  assert.match(mintVerify, /info\.freezeAuthority !== APPROVED_WALLET/);
  assert.match(mintVerify, /ownedBaseUnits\.toString\(\) !== TOTAL_SUPPLY_BASE_UNITS/);
  assert.match(mintVerify, /getSignatureStatuses/);
  assert.match(mintVerify, /getTransaction/);
  assert.doesNotMatch(mintVerify, /private[_-]?key/i);
});
