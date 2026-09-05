import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../src/pages/AdminSKAMLaunch.jsx', import.meta.url), 'utf8');
const endpoint = await readFile(new URL('../functions/api/solana/skam-readiness.js', import.meta.url), 'utf8');
const approvedWallet = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';

test('sKAM admin page reads balance through same-origin server endpoint, not browser RPC', () => {
  assert.ok(page.includes("fetch('/api/solana/skam-readiness'"));
  assert.match(page, /credentials: 'same-origin'/);
  assert.doesNotMatch(page, /new Connection\s*\(/);
  assert.doesNotMatch(page, /api\.mainnet-beta\.solana\.com/);
});

test('sKAM readiness endpoint is locked to verified admin and 2FA', () => {
  assert.match(endpoint, /verifySessionToken/);
  assert.match(endpoint, /getActiveSession/);
  assert.match(endpoint, /user\.role !== 'admin'/);
  assert.match(endpoint, /Admin 2FA required/);
});

test('sKAM readiness endpoint is fixed-purpose and cannot proxy arbitrary wallet requests', () => {
  assert.match(endpoint, new RegExp(approvedWallet));
  assert.match(endpoint, /method: 'getBalance'/);
  assert.match(endpoint, /params: \[APPROVED_WALLET/);
  assert.doesNotMatch(endpoint, /request\.json\s*\(/);
  assert.doesNotMatch(endpoint, /new URL\(request\.url\).*searchParams/s);
});

test('sKAM readiness response exposes only public readiness fields', () => {
  for (const field of ['owner', 'balanceSol', 'minimumPlannedSol', 'ready']) assert.match(endpoint, new RegExp(field));
  assert.doesNotMatch(endpoint, /private[_-]?key/i);
  assert.doesNotMatch(endpoint, /secret[_-]?key/i);
});
