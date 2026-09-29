import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('wallet header preserves the full ZEVARYQ Wallet product name on narrow screens', async () => {
  const [wallet, css] = await Promise.all([
    read('src/pages/Wallet.jsx'),
    read('src/pages/ZevaryqWallet.css'),
  ]);
  assert.match(wallet, /zv-header-main/);
  assert.match(wallet, /zv-header-copy/);
  assert.match(wallet, />ZEVARYQ Wallet</);
  assert.doesNotMatch(wallet, /aria-label="Notifications"/);
  assert.doesNotMatch(wallet, /aria-label="QR scanner"/);
  assert.match(css, /ZEVARYQ Wallet readability gate/);
  assert.match(css, /\.zv-header-title\{[\s\S]*white-space:nowrap/);
  assert.match(css, /word-break:normal/);
  assert.match(css, /text-overflow:clip/);
});

test('important wallet content wraps instead of ellipsizing', async () => {
  const [wallet, swap] = await Promise.all([
    read('src/pages/Wallet.jsx'),
    read('src/components/zevaryq-wallet/ZevaryqSwap.jsx'),
  ]);
  assert.doesNotMatch(wallet, /truncate font-black">\{asset\.name\}/);
  assert.doesNotMatch(wallet, /max-w-\[42%\] truncate/);
  assert.match(wallet, /break-all font-mono text-\[10px\]/);
  assert.match(wallet, /zv-settings-status/);
  assert.doesNotMatch(swap, /truncate text-right text-2xl/);
  assert.match(swap, /break-all text-right text-2xl/);
});

test('narrow asset rows move balances below names instead of squeezing copy', async () => {
  const css = await read('src/pages/ZevaryqWallet.css');
  assert.match(css, /@media\(max-width:480px\)[\s\S]*\.zv-asset-row\{[\s\S]*grid-template-columns:auto minmax\(0,1fr\)/);
  assert.match(css, /\.zv-asset-row>div:last-child\{[\s\S]*grid-column:2/);
  assert.match(css, /@media\(max-width:340px\)/);
});
