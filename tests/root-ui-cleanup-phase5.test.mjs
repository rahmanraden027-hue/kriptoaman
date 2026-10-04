import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('root UI cleanup phase 5 preserves the final 12-layer production order', async () => {
  const page = await read('src/pages/KriptoAmanGlobalLanding.jsx');
  const order = [
    'LandingLiveSystemStrip',
    '<GLandingHero',
    '<LiveBlockFlow3D',
    'betweenBlockAndNode={<LandingMarketPulse />}',
    '<GLandingBody',
    '<GLandingInstitutional',
    '<GLandingFooter',
  ];
  let previous = -1;
  for (const token of order) {
    const index = page.indexOf(token);
    assert.ok(index > previous, `Expected ${token} after previous production layer`);
    previous = index;
  }
});

test('hero cleanup removes repeated purpose cards and the duplicate telemetry ticker', async () => {
  const hero = await read('src/components/landing/GLandingHero.jsx');
  assert.doesNotMatch(hero, /const PURPOSE/);
  assert.doesNotMatch(hero, /StreamItems/);
  assert.doesNotMatch(hero, /ka-live-stream-track/);
  assert.match(hero, /MARKET/);
  assert.match(hero, /ON-CHAIN/);
  assert.match(hero, /RISK/);
  assert.match(hero, /EVIDENCE/);
});

test('landing body contains only core intelligence modules and one CTA surface', async () => {
  const body = await read('src/components/landing/GLandingBody.jsx');
  assert.match(body, /KRIPTOAMAN INTELLIGENCE MODULES/);
  assert.match(body, /Empat fungsi utama\. Satu alur verifikasi\./);
  assert.match(body, /Open Intelligence Hub/);
  assert.match(body, /Open ZEVARYQ Wallet/);
  assert.doesNotMatch(body, /Intelligence Workspace/);
  assert.doesNotMatch(body, /EVIDENCE HEALTH/);
  assert.doesNotMatch(body, /SEE → UNDERSTAND → VERIFY/);
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
