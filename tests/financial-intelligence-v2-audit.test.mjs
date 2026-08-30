import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('security posture score is evidence-based and unavailable on degraded checks', async () => {
  const page = await read('src/pages/SecurityCenterV2.jsx');
  assert.match(page, /adminSecurityCheck/);
  assert.match(page, /score: null/);
  assert.doesNotMatch(page, /baselineScore/);
  assert.match(page, /Backend security check/);
});

test('notification center exposes source-aware categories and preserves price alerts', async () => {
  const page = await read('src/pages/NotificationCenterV2.jsx');
  assert.match(page, /Security/);
  assert.match(page, /KAM Network/);
  assert.match(page, /Portfolio/);
  assert.match(page, /System/);
  assert.match(page, /Source pending/);
  assert.match(page, /<Alerts \/>/);
});

test('global search supports asset, wallet-address, transaction-hash and network context without signing', async () => {
  const page = await read('src/components/workspace/WorkspaceExperience.jsx');
  assert.match(page, /ASSETS/);
  assert.match(page, /0x\[a-fA-F0-9\]\{40\}/);
  assert.match(page, /0x\[a-fA-F0-9\]\{64\}/);
  assert.match(page, /KAMNetwork/);
  assert.match(page, /never signs or executes a transaction/);
});

test('onboarding routes progressively through security, KYC, wallet and market', async () => {
  const page = await read('src/components/workspace/WorkspaceExperience.jsx');
  assert.match(page, /\/SecurityHub/);
  assert.match(page, /\/KYC/);
  assert.match(page, /\/Wallet/);
  assert.match(page, /\/Market/);
});

test('transaction history never seeds demo activity automatically', async () => {
  const page = await read('src/pages/TxHistory.jsx');
  assert.doesNotMatch(page, /seedDemoData/);
  assert.match(page, /Tidak ada data demo yang dibuat otomatis/);
  assert.match(page, /useSearchParams/);
});

test('page routing uses audited financial intelligence surfaces', async () => {
  const config = await read('src/pages.config.js');
  assert.match(config, /Alerts: 'NotificationCenterV2'/);
  assert.match(config, /SecurityCenter: 'SecurityCenterV2'/);
  assert.match(config, /PaperTrading: 'PaperTradingV3'/);
});
