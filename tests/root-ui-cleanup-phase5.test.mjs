import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('root UI cleanup phase 5 preserves the final production order across the deferred boundary', async () => {
  const [page, deferred] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingDeferredContent.jsx'),
  ]);

  const pageOrder = [
    'LandingLiveSystemStrip',
    '<GLandingHero',
    '<GLandingDeferredContent',
    '<GLandingFooter',
  ];
  let previous = -1;
  for (const token of pageOrder) {
    const index = page.indexOf(token);
    assert.ok(index > previous, `Expected ${token} after previous root production layer`);
    previous = index;
  }

  const deferredOrder = [
    '<LiveBlockFlow3D',
    'betweenBlockAndNode={<LandingMarketPulse />}',
    '<GLandingProductionGateways',
  ];
  previous = -1;
  for (const token of deferredOrder) {
    const index = deferred.indexOf(token);
    assert.ok(index > previous, `Expected ${token} after previous deferred production layer`);
    previous = index;
  }
});

test('hero cleanup removes repeated purpose cards and the duplicate telemetry ticker', async () => {
  const hero = await read('src/components/landing/GLandingHero.jsx');
  assert.doesNotMatch(hero, /const PURPOSE/);
  assert.doesNotMatch(hero, /StreamItems/);
  assert.doesNotMatch(hero, /ka-live-stream-track/);
  assert.doesNotMatch(hero, /MARKET ASSETS/);
  assert.doesNotMatch(hero, /ZVQ BLOCK/);
  assert.doesNotMatch(hero, /VERIFIED NETWORKS/);
  assert.doesNotMatch(hero, /CHAIN \/ RPC/);
  assert.match(hero, /Market · On-chain · Network · Evidence/);
});

test('landing root no longer renders explanatory intelligence cards or duplicate CTA copy', async () => {
  const deferred = await read('src/components/landing/GLandingDeferredContent.jsx');
  assert.doesNotMatch(deferred, /GLandingBody/);
  assert.match(deferred, /GLandingProductionGateways/);
});

test('root network operations is compact while keeping the full diagnostic mode available elsewhere', async () => {
  const [flow, ops] = await Promise.all([
    read('src/components/home/LiveBlockFlow3D.jsx'),
    read('src/components/home/NetworkOperationsPanel.jsx'),
  ]);
  assert.match(flow, /compact=\{compactLanding\}/);
  assert.match(flow, /betweenBlockAndNode/);
  assert.match(ops, /Four production metrics only/);
  assert.match(ops, /View Details/);
  assert.match(ops, /RPC Latency/);
  assert.match(ops, /Block Time/);
  assert.match(ops, /Indexer Lag/);
  assert.match(ops, /Peer Count/);
  assert.match(ops, /Validator Set/);
});

test('live production strip uses existing verified landing stats and adds no new fetch path', async () => {
  const strip = await read('src/components/landing/LandingLiveSystemStrip.jsx');
  assert.match(strip, /zvqBlockNumber/);
  assert.match(strip, /zvqProbeDurationMs/);
  assert.match(strip, /networkActiveCount/);
  assert.match(strip, /marketAvailable/);
  assert.doesNotMatch(strip, /fetch\(/);
});
