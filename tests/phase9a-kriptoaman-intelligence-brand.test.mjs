import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 9A applies KriptoAman Intelligence to public master-brand surfaces', async () => {
  const [hero, footer, routes, seo, manifestRaw, index] = await Promise.all([
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingFooter.jsx'),
    read('src/components/landing/GLandingProductionGateways.jsx'),
    read('src/lib/RouteSeo.jsx'),
    read('public/manifest.json'),
    read('index.html'),
  ]);

  const manifest = JSON.parse(manifestRaw);
  assert.match(hero, /KRIPTOAMAN INTELLIGENCE · VERIFIED DATA/);
  assert.match(footer, /KRIPTOAMAN INTELLIGENCE = VERIFIED DATA/);
  assert.match(routes, /KriptoAman Intelligence/);
  assert.match(seo, /KriptoAman Intelligence — Verified Data\. Real Intelligence\./);
  assert.equal(manifest.name, 'KriptoAman Intelligence');
  assert.equal(manifest.short_name, 'KriptoAman');
  assert.match(index, /KriptoAman Intelligence — Verified Data\. Real Intelligence\./);
  assert.match(index, /"name": "KriptoAman Intelligence"/);
});

test('Phase 9A preserves legal company and ecosystem product identities', async () => {
  const [index, routes, manifestRaw] = await Promise.all([
    read('index.html'),
    read('src/components/landing/GLandingProductionGateways.jsx'),
    read('public/manifest.json'),
  ]);
  const manifest = JSON.parse(manifestRaw);

  assert.match(index, /"legalName": "PT KRIPTO AMAN INDONESIA"/);
  assert.match(routes, /ZEVARYQ Wallet/);
  assert.match(routes, /QoryVEx/);
  assert.match(routes, /ZEVARYQ Explorer/);
  assert.equal(manifest.shortcuts.some((item) => item.name === 'ZEVARYQ Wallet'), true);
});

test('Phase 9A keeps the product positioning evidence-first rather than entity-attribution-first', async () => {
  const [hero, footer] = await Promise.all([
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingFooter.jsx'),
  ]);

  assert.match(hero, /Market · On-chain · Network · Evidence/);
  assert.match(footer, /market, on-chain activity, network state, dan evidence/);
  assert.doesNotMatch(hero, /wallet deanonymization|entity attribution|identify wallet owner/i);
});
