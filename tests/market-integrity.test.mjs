import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('user-facing market history never fabricates prices or volume', async () => {
  const source = await read('src/components/market/marketDataService.jsx');

  assert.doesNotMatch(source, /generateSynthetic/);
  assert.doesNotMatch(source, /FALLBACK_PRICES/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.match(source, /volume:c\.volume==null\?null:Number\(c\.volume\)/);
  assert.match(source, /source:'kriptoaman-market-history'/);
  assert.match(source, /\/api\/market-history/);
  assert.match(source, /SUPPORTED_HISTORY_ASSETS\.has\(asset\)/);
  assert.doesNotMatch(source, /api\.coingecko\.com|api\.coinlore\.net|min-api\.cryptocompare\.com|stream\.binance\.com/i);
});

test('market history uses a bounded server-owned asset allowlist', async () => {
  const source = await read('src/components/market/marketDataService.jsx');

  assert.match(source, /SUPPORTED_HISTORY_ASSETS=new Set\(\['BTC','ETH','BNB','SOL','XRP','USDT','USDC'\]\)/);
  assert.match(source, /if\(!SUPPORTED_HISTORY_ASSETS\.has\(asset\)\)return \[\]/);
  assert.match(source, /\/api\/market-history/);
  assert.doesNotMatch(source, /generateSynthetic|Math\.random/);
});
test('unverified forex and commodity data fail closed', async () => {
  const source = await read('src/components/market/marketDataService.jsx');

  assert.match(source, /export function getForexRates\(\)\{return \{\};\}/);
  assert.match(source, /export function getForexHistory\(\)\{return \[\];\}/);
  assert.match(source, /export function getCommodityRates\(\)\{return \{\};\}/);
});
