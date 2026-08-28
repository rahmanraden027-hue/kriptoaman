import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet } from '../functions/api/auth/readiness.js';

function makeEnv({ databaseOk = true } = {}) {
  return {
    AUTH_DB: {
      prepare() {
        return {
          async first() {
            if (!databaseOk) throw new Error('db unavailable');
            return { ok: 1 };
          },
        };
      },
    },
    SESSION_SECRET: 'test-session-secret',
    RESEND_API_KEY: 'test-resend-key',
    AUTH_EMAIL_FROM: 'KriptoAman <noreply@example.com>',
  };
}

test('auth readiness reports registration ready when dependencies are healthy', async () => {
  const response = await onRequestGet({ env: makeEnv() });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-store/i);
  const body = await response.json();
  assert.equal(body.ready, true);
  assert.equal(body.registration, true);
  assert.deepEqual(body.checks, {
    configuration: true,
    database: true,
    email: true,
    session: true,
  });
});

test('auth readiness fails closed when database is unavailable', async () => {
  const response = await onRequestGet({ env: makeEnv({ databaseOk: false }) });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ready, false);
  assert.equal(body.registration, false);
  assert.equal(body.checks.database, false);
});

test('auth readiness fails closed when required configuration is missing', async () => {
  const env = makeEnv();
  delete env.RESEND_API_KEY;
  const response = await onRequestGet({ env });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ready, false);
  assert.equal(body.registration, false);
});
