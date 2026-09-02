import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ticker = await readFile(new URL('../src/components/market/LiveTickerBar.jsx', import.meta.url), 'utf8');
const meta = await readFile(new URL('../src/components/home/coinMeta.jsx', import.meta.url), 'utf8');

test('live ticker renders real coin logo assets with a safe visual fallback', () => {
  assert.match(ticker, /COIN_META/);
  assert.match(ticker, /<img/);
  assert.match(ticker, /meta\.logo/);
  assert.match(ticker, /onError=/);
  assert.match(meta, /BTC:\s*\{[^}]*bitcoin\.png/s);
  assert.match(meta, /ETH:\s*\{[^}]*ethereum\.png/s);
  assert.match(meta, /SOL:\s*\{[^}]*solana\.png/s);
});

test('live ticker continuously moves market data from right to left', () => {
  assert.match(ticker, /animation:\s*ticker-move\s+60s\s+linear\s+infinite/);
  assert.match(ticker, /translate3d\(-50%,\s*0,\s*0\)/);
  assert.match(ticker, /w-max/);
});

test('ticker remains backed by Binance websocket data and forbids synthetic fallback', () => {
  assert.match(ticker, /wss:\/\/stream\.binance\.com:9443/);
  assert.match(ticker, /Never synthesize market data/);
  assert.doesNotMatch(ticker, /Math\.random\s*\(/);
});
