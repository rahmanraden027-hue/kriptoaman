import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getProductionFreshness } from '../src/components/landing/productionFreshness.js';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('authoritative freshness fails closed without provenance', () => {
  const result = getProductionFreshness({
    snapshotAgeMs: null,
    snapshotGeneratedAt: null,
    snapshotReadMode: null,
  }, Date.parse('2026-10-05T02:00:00Z'));

  assert.equal(result.freshness, 'UNVERIFIED');
  assert.equal(result.verified, false);
  assert.equal(result.ageLabel, '—');
  assert.equal(result.modeLabel, 'UNVERIFIED');
});

test('live aggregate provenance reports live only for live-verified delivery', () => {
  const now = Date.parse('2026-10-05T02:00:10Z');
  const live = getProductionFreshness({
    snapshotAgeMs: 5_000,
    snapshotGeneratedAt: '2026-10-05T02:00:06Z',
    snapshotReadMode: 'live-verified',
  }, now);
  assert.equal(live.freshness, 'LIVE');
  assert.equal(live.modeLabel, 'LIVE VERIFIED');
  assert.equal(live.ageMs, 5_000);

  const durable = getProductionFreshness({
    snapshotAgeMs: 30_000,
    snapshotGeneratedAt: '2026-10-05T01:59:45Z',
    snapshotReadMode: 'd1-last-verified',
  }, now);
  assert.equal(durable.freshness, 'RECENT');
  assert.equal(durable.modeLabel, 'D1 VERIFIED');
  assert.equal(durable.verified, true);
});

test('freshness never understates wall-clock age and marks old aggregates stale', () => {
  const now = Date.parse('2026-10-05T02:10:00Z');
  const result = getProductionFreshness({
    snapshotAgeMs: 15_000,
    snapshotGeneratedAt: '2026-10-05T02:00:00Z',
    snapshotReadMode: 'memory-last-verified',
  }, now);

  assert.equal(result.ageMs, 10 * 60_000);
  assert.equal(result.freshness, 'STALE');
  assert.equal(result.modeLabel, 'MEMORY VERIFIED');
});

test('landing production surfaces expose the same authoritative snapshot provenance', async () => {
  const [strip, consoleSource] = await Promise.all([
    read('src/components/landing/LandingLiveSystemStrip.jsx'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
  ]);

  assert.match(strip, /getProductionFreshness\(stats\)/);
  assert.match(strip, /AUTHORITATIVE SNAPSHOT/);
  assert.match(strip, /snapshot\.modeLabel/);
  assert.match(strip, /snapshot\.ageLabel/);
  assert.match(strip, /snapshot\.generatedLabel/);

  assert.match(consoleSource, /getProductionFreshness\(stats\)/);
  assert.match(consoleSource, /stats\?\.overall === 'operational'/);
  assert.match(consoleSource, /PROOF OF FRESHNESS \{snapshot\.freshness\}/);
  assert.match(consoleSource, /snapshot\.modeLabel/);
  assert.doesNotMatch(consoleSource, /verifiedAtRaw|verifiedAgeMs/);
});

console.log('phase 8 proof-of-freshness observability regression: ok');
