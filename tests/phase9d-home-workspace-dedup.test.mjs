import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 9D gives public landing and authenticated Home different jobs', async () => {
  const [landing, home] = await Promise.all([
    read('src/components/landing/GLandingDeferredContent.jsx'),
    read('src/pages/HomeV3.jsx'),
  ]);

  assert.match(landing, /LiveBlockFlow3D/);
  assert.match(home, /MY KRIPTOAMAN/);
  assert.match(home, /MY WORKSPACE/);
  assert.doesNotMatch(home, /LiveBlockFlow3D/);
  assert.doesNotMatch(home, /CommandCenterHeroVisual/);
  assert.doesNotMatch(home, /CRYPTO COMMAND CENTER/);
});

test('Phase 9D prioritizes personal routes before deep technical evidence', async () => {
  const home = await read('src/pages/HomeV3.jsx');

  const workspace = home.indexOf('MY WORKSPACE');
  const market = home.indexOf('MY MARKET');
  const radar = home.indexOf('New Token Radar');
  const evidence = home.indexOf('ZEVARYQ EVIDENCE');

  assert.ok(workspace >= 0);
  assert.ok(market > workspace);
  assert.ok(radar > market);
  assert.ok(evidence > radar);

  for (const route of ['/Market', '/Alerts', '/PortfolioOverview', '/IntelligenceHub']) {
    assert.match(home, new RegExp(route.replace('/', '\\/')));
  }
});

test('Phase 9D routes full diagnostics to dedicated surfaces', async () => {
  const home = await read('src/pages/HomeV3.jsx');

  assert.match(home, /System Evidence/);
  assert.match(home, /\/SystemStatus/);
  assert.match(home, /https:\/\/explorer\.kriptoaman\.com/);
  assert.match(home, /Verified state, without duplicate diagnostics/);

  assert.doesNotMatch(home, /Network Operations Console/);
  assert.doesNotMatch(home, /Block Event → Node Pulse → Explorer Index/);
  assert.doesNotMatch(home, /Insight → Evidence → Blockchain/);
  assert.doesNotMatch(home, /Your monitored market, without noise/);
});

test('Phase 9D preserves fail-closed production truth in compact status', async () => {
  const home = await read('src/pages/HomeV3.jsx');

  assert.match(home, /UNAVAILABLE/);
  assert.match(home, /payload\?\.live === true && payload\?\.verified === true/);
  assert.match(home, /payload\?\.status === 'live' && Number\(payload\?\.chainId\) === 22028/);
  assert.match(home, /KriptoAman market source/);
  assert.match(home, /Successful live probes/);
});
