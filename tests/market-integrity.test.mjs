import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('user-facing market history never fabricates prices or volume', async () => {
  const source = await read('src/components/market/marketDataService.jsx');

  assert.doesNotMatch(source, /generateSynthetic/);
  assert.doesNotMatch(source, /FALLBACK_PRICES/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.match(source, /volume:\s*null/);
  assert.match(source, /source:\s*'coingecko'/);
  assert.match(source, /if \(!geckoId\) return \[\]/);
});

test('market history coverage includes a broad global asset set', async () => {
  const source = await read('src/components/market/marketDataService.jsx');

  for (const symbol of [
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'AVAX', 'DOT',
    'LINK', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'SUI', 'ARB', 'OP', 'AAVE',
    'SHIB', 'USDT', 'USDC', 'PEPE', 'BCH', 'XLM', 'TON', 'HBAR', 'ICP', 'ETC',
    'FIL', 'LDO', 'DAI', 'CRO', 'MKR', 'ALGO', 'VET', 'TIA', 'IMX', 'GRT',
    'STX', 'RUNE', 'KAS',
  ]) {
    assert.match(source, new RegExp(`\\b${symbol}:`));
  }
});

test('unverified forex and commodity data fail closed', async () => {
  const source = await read('src/components/market/marketDataService.jsx');

  assert.match(source, /export function getForexRates\(\) \{\s*return \{\};/s);
  assert.match(source, /export function getForexHistory\(\) \{\s*return \[\];/s);
  assert.match(source, /export function getCommodityRates\(\) \{\s*return \{\};/s);
});
