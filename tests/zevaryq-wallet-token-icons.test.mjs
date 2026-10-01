import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('wallet token icons fail closed to verified contract addresses', async () => {
  const registry = await read('src/services/zevaryqTokenIcons.js');
  const assets = await read('src/services/zevaryqAssets.js');
  assert.match(registry, /ZEVARYQ_TOKEN_ICON_REGISTRY/);
  assert.match(registry, /String\(contractAddress \|\| ''\)\.toLowerCase\(\)/);
  assert.doesNotMatch(registry, /symbol\s*[),]/i);
  assert.match(assets, /resolveZevaryqTokenIcon\(contractAddress, token\.icon_url\)/);
});

test('approved ecosystem preview logos remain bundled locally', async () => {
  const wallet = await read('src/pages/Wallet.jsx');
  assert.match(wallet, /\/assets\/zevaryq\/tokens\/zusd-v2\.svg/);
  assert.match(wallet, /\/assets\/zevaryq\/tokens\/zbtc-v2\.svg/);
  assert.match(wallet, /\/assets\/zevaryq\/tokens\/zeth-v2\.svg/);
  assert.match(wallet, /Identity preview only · not wallet holdings/);
});
