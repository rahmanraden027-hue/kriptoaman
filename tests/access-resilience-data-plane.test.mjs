import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('access resilience verifies web security and durable market continuity', async () => {
  const source = await read('scripts/check-access-resilience.mjs');

  for (const header of [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'content-security-policy',
    'referrer-policy',
  ]) {
    assert.ok(source.includes(`'${header}'`), `missing security header check: ${header}`);
  }

  assert.ok(source.includes('/api/market-snapshot?health=1'));
  assert.ok(source.includes('/api/market-hot'));
  assert.ok(source.includes('MIN_MARKET_ASSETS'));
  assert.ok(source.includes("['BTC', 'ETH', 'BNB', 'SOL', 'XRP']"));
  assert.ok(source.includes("payload?.available !== true"));
  assert.ok(source.includes('/api/auth/readiness'));
  assert.ok(source.includes('/api/auth/register'));
});

test('access resilience runs every 15 minutes without taking over provider refresh', async () => {
  const workflow = await read('.github/workflows/access-resilience.yml');

  assert.ok(workflow.includes("cron: '7,22,37,52 * * * *'"));
  assert.ok(workflow.includes("MIN_MARKET_ASSETS: '4500'"));
  assert.ok(workflow.includes('Web/auth/data resilience verification'));
  assert.doesNotMatch(workflow, /refresh=1/);
});
