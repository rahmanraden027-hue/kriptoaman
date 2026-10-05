import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 9B freezes KRIPTOAMAN as the singular public master brand', async () => {
  const [hero, header, footer, routes, seo, manifestRaw, index] = await Promise.all([
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingHeader.jsx'),
    read('src/components/landing/GLandingFooter.jsx'),
    read('src/components/landing/GLandingProductionGateways.jsx'),
    read('src/lib/RouteSeo.jsx'),
    read('public/manifest.json'),
    read('index.html'),
  ]);

  const manifest = JSON.parse(manifestRaw);

  assert.match(hero, /KRIPTOAMAN · VERIFIED DATA/);
  assert.doesNotMatch(hero, /KRIPTOAMAN INTELLIGENCE/);
  assert.doesNotMatch(header, /> INTELLIGENCE</);
  assert.match(footer, /KRIPTOAMAN = VERIFIED DATA · ZEVARYQ = INFRASTRUCTURE/);
  assert.doesNotMatch(footer, /KRIPTOAMAN INTELLIGENCE =/);
  assert.match(routes, /label: 'KriptoAman'/);
  assert.doesNotMatch(routes, /label: 'KriptoAman Intelligence'/);
  assert.match(seo, /KriptoAman — Verified Data\. Real Intelligence\./);
  assert.doesNotMatch(seo, /KriptoAman Intelligence —/);
  assert.equal(manifest.name, 'KriptoAman');
  assert.equal(manifest.short_name, 'KriptoAman');
  assert.match(index, /KriptoAman — Verified Data\. Real Intelligence\./);
  assert.doesNotMatch(index, /"name": "KriptoAman Intelligence"/);
});

test('Phase 9B keeps intelligence as a product category, not part of the master name', async () => {
  const [hero, footer, manifestRaw] = await Promise.all([
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingFooter.jsx'),
    read('public/manifest.json'),
  ]);
  const manifest = JSON.parse(manifestRaw);

  assert.match(hero, /Market · On-chain · Network · Evidence/);
  assert.match(footer, /Verified crypto intelligence/);
  assert.match(manifest.description, /Verified crypto intelligence/);
});

test('Phase 9B preserves legal and ecosystem identities', async () => {
  const [index, routes] = await Promise.all([
    read('index.html'),
    read('src/components/landing/GLandingProductionGateways.jsx'),
  ]);

  assert.match(index, /"legalName": "PT KRIPTO AMAN INDONESIA"/);
  assert.match(routes, /ZEVARYQ Wallet/);
  assert.match(routes, /QoryVEx/);
  assert.match(routes, /ZEVARYQ Explorer/);
});

test('Phase 9B documents the brand boundary so the suffix does not drift back', async () => {
  const contract = await read('docs/KRIPTOAMAN_BRAND_IDENTITY_CONTRACT.md');
  assert.match(contract, /\*\*KRIPTOAMAN\*\*/);
  assert.match(contract, /Intelligence.*product\/category descriptor/);
  assert.match(contract, /Do not present these as the master brand/);
  assert.match(contract, /KriptoAman Intelligence/);
  assert.match(contract, /Verified Data\. Real Intelligence\./);
  assert.match(contract, /PT KRIPTO AMAN INDONESIA/);
});
