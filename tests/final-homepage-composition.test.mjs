import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('final homepage composition exposes only production-ready evidence gateways', async () => {
  const [deferred, gateways] = await Promise.all([
    read('src/components/landing/GLandingDeferredContent.jsx'),
    read('src/components/landing/GLandingProductionGateways.jsx'),
  ]);

  assert.match(deferred, /<GLandingProductionGateways \/>/);
  assert.match(gateways, /PRODUCTION ROUTES/);
  assert.match(gateways, /VERIFIED-ONLY UI/);
  assert.match(gateways, />EVIDENCE</);

  for (const route of ['/IntelligenceHub', '/qoryvex/discovery', '/login', '/wallet-app']) {
    assert.equal(gateways.includes(route), true, `missing production route ${route}`);
  }

  assert.match(gateways, /https:\/\/explorer\.kriptoaman\.com/);
  assert.doesNotMatch(gateways, /fetch\(/);
  assert.doesNotMatch(gateways, /Math\.random/);
});

test('final homepage composition does not advertise unpublished ecosystem routes', async () => {
  const gateways = await read('src/components/landing/GLandingProductionGateways.jsx');

  assert.doesNotMatch(gateways, /\/Nexus|\/ORIVEX|\/ORYVANTIQ/i);
  assert.match(gateways, /LIVE ROUTE/);
});
