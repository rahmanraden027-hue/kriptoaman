import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 8.4 keeps the desktop entry experience inside one viewport budget', async () => {
  const [strip, hero, consoleSource] = await Promise.all([
    read('src/components/landing/LandingLiveSystemStrip.jsx'),
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
  ]);

  assert.match(strip, /lg:pt-\[68px\]/);
  assert.match(strip, /Compact desktop production status/);
  assert.match(strip, /hidden min-h-\[48px\].*lg:grid/);

  assert.match(hero, /lg:min-h-\[calc\(100svh-116px\)\]/);
  assert.match(hero, /sm:grid-cols-4 lg:hidden/);
  assert.match(hero, /lg:text-\[46px\]/);
  assert.match(hero, /lg:hidden\"\>\n        Verified data only/);

  assert.match(consoleSource, /lg:max-w-\[500px\]/);
  assert.match(consoleSource, /lg:max-w-\[280px\]/);
  assert.match(consoleSource, /ka-console-metrics lg:hidden/);
  assert.match(consoleSource, /ka-text2 lg:hidden/);
});

test('Phase 8.4 does not remove production truth or downstream modules', async () => {
  const [strip, landing, deferred] = await Promise.all([
    read('src/components/landing/LandingLiveSystemStrip.jsx'),
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingDeferredContent.jsx'),
  ]);

  assert.match(strip, /AUTHORITATIVE SNAPSHOT/);
  assert.match(strip, /snapshot\.freshness/);
  assert.match(landing, /GLandingDeferredContent/);
  assert.match(deferred, /LiveBlockFlow3D/);
  assert.match(deferred, /LandingMarketPulse/);
  assert.match(deferred, /GLandingProductionGateways/);
});
