import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/landing/LandingLiveSystemStrip.jsx', import.meta.url), 'utf8');

test('public landing distinguishes verified live states from unavailable evidence', () => {
  assert.match(source, /liveBlock \? 'LIVE' : 'VERIFYING'/);
  assert.match(source, /const marketState = marketAvailable \? snapshot\.freshness : 'UNAVAILABLE'/);
  assert.match(source, /const marketHealthy = marketAvailable && snapshot\.verified && snapshot\.freshness !== 'STALE'/);
  assert.match(source, /Number\.isFinite\(rpc\)/);
  assert.match(source, /synced \? 'SYNCED'/);
  assert.doesNotMatch(source, /Data belum tersedia/);
});

test('public landing retains factual degraded wording after cleanup', () => {
  assert.match(source, /No synthetic fallback/);
  assert.match(source, /No current probe count/);
  assert.match(source, /NO SYNC CLAIM/);
  assert.match(source, /Waiting for verified head/);
});
