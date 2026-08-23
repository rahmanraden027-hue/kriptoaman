import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('paged market endpoint caps responses at 500 assets', async () => {
  const source = await read('functions/api/market-snapshot-page.js');
  assert.match(source, /const DEFAULT_PAGE_SIZE = 500;/);
  assert.match(source, /const MAX_PAGE_SIZE = 500;/);
  assert.match(source, /all\.slice\(start, start \+ pageSize\)/);
  assert.match(source, /hasMore:/);
  assert.match(source, /totalAssets/);
  assert.match(source, /stale-while-revalidate=840/);
});

test('paged market endpoint reads only the persisted KriptoAman market snapshot', async () => {
  const source = await read('functions/api/market-snapshot-page.js');
  assert.match(source, /FROM market_snapshots WHERE id = \?/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.doesNotMatch(source, /generateSynthetic/);
});
