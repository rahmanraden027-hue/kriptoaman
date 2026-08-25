import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('portfolio distinguishes loading, error, and truly empty states', async () => {
  const portfolio = await read('src/pages/PortfolioOverview.jsx');
  assert.match(portfolio, /isLoading/);
  assert.match(portfolio, /isError/);
  assert.match(portfolio, /refetch/);
  assert.match(portfolio, /loadingTitle|Memuat data portofolio|Loading portfolio data/);
  assert.match(portfolio, /errorTitle|Data portofolio belum dapat dimuat|Portfolio data could not be loaded/);
});

test('security posture uses server-backed email verification', async () => {
  const security = await read('src/pages/SecurityHub.jsx');
  assert.match(security, /user\?\.email_verified/);
  assert.doesNotMatch(security, /const emailAvailable = !!user\?\.email/);
});

test('wallet keeps KAM Points fetch owned by KAMTokenCard only', async () => {
  const [wallet, kamCard] = await Promise.all([
    read('src/pages/Wallet.jsx'),
    read('src/components/wallet/KAMTokenCard.jsx'),
  ]);
  assert.doesNotMatch(wallet, /getKamPoints\(/);
  assert.doesNotMatch(wallet, /kamPoints/);
  assert.match(kamCard, /\/api\/auth\/kam-points/);
});
