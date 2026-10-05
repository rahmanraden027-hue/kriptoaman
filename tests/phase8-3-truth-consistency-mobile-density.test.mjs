import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 8.3 binds market labels to authoritative freshness', async () => {
  const [strip, hero, consoleSource] = await Promise.all([
    read('src/components/landing/LandingLiveSystemStrip.jsx'),
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
  ]);

  assert.match(strip, /const marketState = marketAvailable \? snapshot\.freshness : 'UNAVAILABLE'/);
  assert.match(strip, /const marketHealthy = marketAvailable && snapshot\.verified && snapshot\.freshness !== 'STALE'/);
  assert.match(hero, /const marketState = stats\?\.marketAvailable \? snapshot\.freshness : 'UNAVAILABLE'/);
  assert.match(hero, /CHAIN \/ RPC/);
  assert.match(consoleSource, /snapshot\.freshness !== 'STALE'/);
});

test('Phase 8.3 explains authoritative snapshot versus live ZEVARYQ head', async () => {
  const [deferred, flow] = await Promise.all([
    read('src/components/landing/GLandingDeferredContent.jsx'),
    read('src/components/home/LiveBlockFlow3D.jsx'),
  ]);

  assert.match(deferred, /snapshotBlock=\{stats\?\.zvqBlockNumber\}/);
  assert.match(deferred, /snapshotGeneratedAt=\{stats\?\.snapshotGeneratedAt\}/);
  assert.match(flow, /AUTHORITATIVE SNAPSHOT #\{fmtNumber\(snapshotHead\)\}/);
  assert.match(flow, /LIVE HEAD #\{fmtNumber\(liveHead\)\}/);
  assert.match(flow, /snapshotBlock === null \|\| snapshotBlock === undefined/);
  assert.match(flow, /const snapshotDelta = hasSnapshotComparison \? liveHead - snapshotHead : null/);
});

test('Phase 8.3 labels hot market feed freshness separately from the aggregate snapshot', async () => {
  const pulse = await read('src/components/landing/LandingMarketPulse.jsx');
  assert.match(pulse, /HOT FEED LIVE/);
  assert.match(pulse, /HOT FEED \$\{String\(state\.freshness/);
  assert.match(pulse, /independently from the authoritative aggregate snapshot/);
});

test('Phase 8.3 compacts production navigation into one four-surface gateway', async () => {
  const gateways = await read('src/components/landing/GLandingProductionGateways.jsx');
  assert.match(gateways, /UNIFIED ECOSYSTEM GATEWAY/);
  assert.match(gateways, /Empat surface inti\. Satu gateway produksi\./);
  for (const label of ['KriptoAman Platform', 'ZEVARYQ Wallet', 'QoryVEx', 'ZEVARYQ Explorer']) {
    assert.equal(gateways.includes(label), true, `missing core surface ${label}`);
  }
  assert.doesNotMatch(gateways, /Tiga surface inti/);
  assert.doesNotMatch(gateways, /PRODUCTION SURFACES/);
});

test('Phase 8.3 raises footer mobile legibility floor', async () => {
  const footer = await read('src/components/landing/GLandingFooter.jsx');
  assert.match(footer, /text-\[13px\] leading-5/);
  assert.match(footer, /text-\[11px\] font-black uppercase tracking-\[0\.12em\]/);
  assert.match(footer, /text-xs ka-text2 leading-5/);
});
