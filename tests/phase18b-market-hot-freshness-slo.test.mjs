import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../scripts/probe-production-slo.mjs', import.meta.url), 'utf8');

test('production SLO reports hot-market freshness independently of provider healthy flag', () => {
  assert.match(source, /const MARKET_HOT_FRESHNESS_TARGET_MS = 60_000/);
  assert.match(source, /const marketHotFreshnessMet = market\?\.healthy === true/);
  assert.match(source, /marketHotAgeMs !== null && marketHotAgeMs <= MARKET_HOT_FRESHNESS_TARGET_MS/);
  assert.match(source, /marketHotFreshnessMet,/);
  assert.match(source, /marketHotFreshnessTargetMs: MARKET_HOT_FRESHNESS_TARGET_MS/);
});

test('missing market age remains unknown and misses freshness target', () => {
  assert.match(source, /Number\.isFinite\(marketHotAge\) && marketHotAge >= 0 \? marketHotAge : null/);
  assert.match(source, /marketHotAgeMs !== null/);
  assert.match(source, /report\.current\.marketHotAgeMs \?\? 'unknown'/);
});

test('stale market hot freshness is recorded as target miss without weakening hard failures', () => {
  assert.match(source, /if \(!marketHotFreshnessMet\) targetMisses\.push\('market-hot-freshness'\)/);
  assert.match(source, /targetMisses,/);
  assert.match(source, /hardFailures: hardFailures\.map\(\(r\) => r\.name\)/);
  assert.match(source, /if \(hardFailures\.length\) process\.exit\(2\)/);
  assert.doesNotMatch(source, /Math\.random\(/);
});
