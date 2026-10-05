import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('HomeV10 range metrics fail closed instead of presenting zero as a real market value', async () => {
  const featured = await read('src/components/home-v10/FeaturedMarketAsset.jsx');
  assert.match(featured, /const formatRangePrice = \(value\) =>/);
  assert.match(featured, /number > 0 \? formatPrice\(number\) : '—'/);
  assert.match(featured, /\['24H High', formatRangePrice\(asset\.high24h\)\]/);
  assert.match(featured, /\['24H Low', formatRangePrice\(asset\.low24h\)\]/);
  assert.doesNotMatch(featured, /\['24H High', formatPrice\(asset\.high24h\)\]/);
  assert.doesNotMatch(featured, /\['24H Low', formatPrice\(asset\.low24h\)\]/);
});

test('HomeV10 replaces developer-facing missing-history copy with a product state', async () => {
  const featured = await read('src/components/home-v10/FeaturedMarketAsset.jsx');
  assert.match(featured, /7D history unavailable/);
  assert.doesNotMatch(featured, /trace not provided in this snapshot/i);
});

test('HomeV10 navigation matches the authenticated five-domain taxonomy', async () => {
  const home = await read('src/pages/HomeV10.jsx');
  assert.match(home, /home: 'Beranda'/);
  assert.match(home, /markets: 'Market'/);
  assert.match(home, /intelligence: 'Intelijen'/);
  assert.match(home, /onchain: 'On-Chain'/);
  assert.match(home, /ecosystem: 'Ekosistem'/);
  assert.match(home, /\{ id: 'onchain', to: '\/ZEVARYQ' \}/);
  assert.match(home, /\{ id: 'ecosystem', to: '\/qoryvex\/discovery' \}/);
  assert.doesNotMatch(home, /to="\/PortfolioOverview" className="grid min-h-11/);
  assert.doesNotMatch(home, />Verify<\/a>/);
});
