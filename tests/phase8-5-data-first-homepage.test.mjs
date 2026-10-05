import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 8.5 removes explanatory marketing-style blocks from the public root', async () => {
  const deferred = await read('src/components/landing/GLandingDeferredContent.jsx');
  assert.doesNotMatch(deferred, /GLandingBody/);
  assert.match(deferred, /LiveBlockFlow3D/);
  assert.match(deferred, /LandingMarketPulse/);
  assert.match(deferred, /GLandingProductionGateways/);
});

test('Phase 8.5 keeps production routes compact and action-oriented', async () => {
  const gateways = await read('src/components/landing/GLandingProductionGateways.jsx');
  assert.match(gateways, /PRODUCTION ROUTES/);
  assert.match(gateways, /VERIFIED-ONLY UI/);
  assert.match(gateways, />EVIDENCE</);
  assert.match(gateways, /xl:grid-cols-4/);
  assert.doesNotMatch(gateways, /Empat surface inti/);
  assert.doesNotMatch(gateways, /Satu gateway produksi/);
  assert.doesNotMatch(gateways, /Akses platform, wallet, discovery/);
});

test('Phase 8.5 preserves live evidence as the dominant below-fold content', async () => {
  const deferred = await read('src/components/landing/GLandingDeferredContent.jsx');
  const flow = deferred.indexOf('<LiveBlockFlow3D');
  const routes = deferred.indexOf('<GLandingProductionGateways');
  assert.ok(flow >= 0 && routes > flow);
});
