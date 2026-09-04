import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('market provider circuit state is persisted in D1', async () => {
  const source = await read('functions/_shared/market-provider-circuit.js');

  assert.match(source, /CREATE TABLE IF NOT EXISTS market_provider_circuit/);
  assert.match(source, /provider TEXT PRIMARY KEY/);
  assert.match(source, /consecutive_failures INTEGER NOT NULL DEFAULT 0/);
  assert.match(source, /open_until INTEGER NOT NULL DEFAULT 0/);
  assert.match(source, /last_failure_at INTEGER/);
  assert.match(source, /last_success_at INTEGER/);
});

test('provider opens after three consecutive failures and cools down for ten minutes', async () => {
  const source = await read('functions/_shared/market-provider-circuit.js');

  assert.match(source, /PROVIDER_FAILURE_THRESHOLD = 3/);
  assert.match(source, /PROVIDER_COOLDOWN_MS = 10 \* 60 \* 1000/);
  assert.match(source, /consecutiveFailures >= PROVIDER_FAILURE_THRESHOLD/);
  assert.match(source, /now \+ PROVIDER_COOLDOWN_MS/);
});

test('success resets the provider circuit', async () => {
  const source = await read('functions/_shared/market-provider-circuit.js');

  assert.match(source, /recordMarketProviderSuccess/);
  assert.match(source, /consecutive_failures = 0/);
  assert.match(source, /open_until = 0/);
  assert.match(source, /last_error = NULL/);
});

test('market refresh skips an open provider and continues failover', async () => {
  const source = await read('functions/api/market-snapshot.js');

  assert.match(source, /readMarketProviderCircuit\(db, source\)/);
  assert.match(source, /if \(circuit\.openUntil > now\)/);
  assert.match(source, /Market provider circuit open; skipping provider/);
  assert.match(source, /recordMarketProviderFailure\(db, source, error, Date\.now\(\)\)/);
  assert.match(source, /recordMarketProviderSuccess\(db, source, Date\.now\(\)\)/);
});

test('market health metadata exposes circuit breaker policy', async () => {
  const source = await read('functions/api/market-snapshot.js');

  assert.match(source, /providerCircuit:/);
  assert.match(source, /persistence: 'd1'/);
  assert.match(source, /failureThreshold: PROVIDER_FAILURE_THRESHOLD/);
  assert.match(source, /cooldownMs: PROVIDER_COOLDOWN_MS/);
  assert.match(source, /recoveryMode: 'cooldown-then-probe'/);
});
