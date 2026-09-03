import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('progress broadcast is admin-only, branded, deduplicated, and privacy preserving', async () => {
  const [endpoint, panel, asset, bimi] = await Promise.all([
    readFile(new URL('../functions/api/auth/admin/broadcast-progress.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/AppUpdatePanel.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../public/assets/kriptoaman-ecosystem-progress-september-2026.svg', import.meta.url), 'utf8'),
    readFile(new URL('../public/.well-known/kriptoaman-bimi.svg', import.meta.url), 'utf8'),
  ]);

  assert.match(endpoint, /requireSameOrigin/);
  assert.match(endpoint, /verifySessionToken/);
  assert.match(endpoint, /user\.role !== 'admin'/);
  assert.match(endpoint, /email_verified = 1/);
  assert.match(endpoint, /COUNT\(DISTINCT LOWER\(TRIM\(email\)\)\)/);
  assert.match(endpoint, /KIRIM UPDATE SEPTEMBER 2026/);
  assert.match(endpoint, /broadcast\.progress\.sent/);
  assert.match(endpoint, /emails\/batch/);
  assert.match(endpoint, /Idempotency-Key/);
  assert.match(endpoint, /MAX_RECIPIENTS = 100/);
  assert.match(endpoint, /ecosystem-progress-2026-09-03/);
  assert.match(endpoint, /kriptoaman-logo-primary\.png/);
  assert.match(endpoint, /Official Ecosystem Update/);
  assert.match(endpoint, /kriptoaman-ecosystem-progress-september-2026\.svg/);
  assert.doesNotMatch(endpoint, /return json\(\{\s*recipients\s*[,}]/);

  assert.match(panel, /\/api\/auth\/admin\/broadcast-progress/);
  assert.match(panel, /KIRIM UPDATE SEPTEMBER 2026/);
  assert.match(panel, /window\.confirm/);
  assert.match(panel, /Semua pengguna terverifikasi/);

  assert.match(asset, /Kemajuan Positif KriptoAman/);
  assert.match(asset, /KAM Mainnet/);
  assert.match(asset, /ethereum-lists\/chains/);

  assert.match(bimi, /baseProfile="tiny-ps"/);
  assert.match(bimi, /<title>KriptoAman<\/title>/);
  assert.match(bimi, /viewBox="0 0 512 512"/);
  assert.doesNotMatch(bimi, /<script/i);
  assert.doesNotMatch(bimi, /https?:\/\//i);
});
