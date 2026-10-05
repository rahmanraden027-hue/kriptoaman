import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 8.6 removes duplicate telemetry cards from the public hero', async () => {
  const [hero, strip, consoleSource] = await Promise.all([
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/LandingLiveSystemStrip.jsx'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
  ]);

  assert.doesNotMatch(hero, /productionMetrics/);
  assert.doesNotMatch(hero, /MARKET ASSETS/);
  assert.doesNotMatch(hero, /ZVQ BLOCK/);
  assert.doesNotMatch(hero, /VERIFIED NETWORKS/);
  assert.doesNotMatch(hero, /CHAIN \/ RPC/);

  assert.match(strip, /MARKET/);
  assert.match(strip, /ZEVARYQ/);
  assert.match(strip, /RPC/);
  assert.match(strip, /NETWORKS/);
  assert.match(consoleSource, /PRODUCTION COMMAND CENTER/);
});

test('Phase 8.6 keeps the hero concise and action-first', async () => {
  const hero = await read('src/components/landing/GLandingHero.jsx');

  assert.match(hero, /Data produksi, langsung terlihat/);
  assert.match(hero, /Market · On-chain · Network · Evidence/);
  assert.match(hero, /Market intelligence dan evidence jaringan ZEVARYQ/);
  assert.match(hero, /Open Workspace/);
  assert.match(hero, /ZEVARYQ Explorer/);
  assert.doesNotMatch(hero, /Verified data only/);
  assert.doesNotMatch(hero, /no synthetic production metrics/);
});

test('Phase 8.6 collapses the redundant mobile spacer after the live strip', async () => {
  const styles = await read('src/components/landing/global-landing.css');

  assert.match(styles, /Phase 8\.6 final mobile density freeze/);
  assert.match(styles, /#beranda\{padding-top:24px!important;padding-bottom:26px!important\}/);
  assert.match(styles, /#beranda \.ka-hero-grid\{gap:18px!important\}/);
  assert.match(styles, /@media\(max-width:420px\)\{\n  #beranda\{padding-top:20px!important\}/);
  assert.match(styles, /\.ka-console-metrics>div,\.ka-console-metrics>a\{min-height:60px!important/);
});
