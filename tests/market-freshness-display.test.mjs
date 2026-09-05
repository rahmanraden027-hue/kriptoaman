import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing distinguishes delayed market data from limited service', async () => {
  const page = await read('src/pages/KriptoAmanGlobalLanding.jsx');
  const body = await read('src/components/landing/GLandingBody.jsx');

  assert.match(page, /marketStatus:\s*'unavailable'/);
  assert.match(page, /hasUsableDelayedSnapshot/);
  assert.match(page, /MARKET_DELAYED_MAX_AGE_MS\s*=\s*60 \* 60 \* 1000/);
  assert.match(page, /next\.marketStatus\s*=\s*market\.status === 'operational'/);
  assert.match(body, /Pembaruan tertunda/);
  assert.match(body, /KriptoAman tidak mengganti data yang tidak tersedia dengan angka buatan/);
  assert.match(body, /Status freshness dibedakan/);
});

test('market warm workflow verifies machine-readable quality endpoint', async () => {
  const workflow = await read('.github/workflows/market-snapshot-warm.yml');

  assert.match(workflow, /market-quality/);
  assert.match(workflow, /score < 60/);
  assert.match(workflow, /assetCount/);
  assert.match(workflow, /veryStale/);
  assert.match(workflow, /negativeMarketCaps/);
});

test('market warm workflow has multiple refresh opportunities inside primary freshness window', async () => {
  const workflow = await read('.github/workflows/market-snapshot-warm.yml');
  assert.match(workflow, /3,11,19,27,35,43,51,59/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
});
