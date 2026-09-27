import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet, onRequestPatch } from '../functions/api/auth/me.js';
import { createSessionToken } from '../server/auth/session.js';

const ORIGIN = 'https://kriptoaman.com';
const SECRET = 'local-test-session-secret-with-at-least-32-characters';

function envWithDatabaseTrap() {
  let queries = 0;
  const AUTH_DB = {
    prepare() {
      queries += 1;
      throw new Error('unexpected database access');
    },
    exec() {
      queries += 1;
      throw new Error('unexpected database access');
    },
    batch() {
      queries += 1;
      throw new Error('unexpected database access');
    },
  };
  return { env: { AUTH_DB, SESSION_SECRET: SECRET }, queries: () => queries };
}

function request(path = '/api/auth/me', init = {}) {
  return new Request(ORIGIN + path, init);
}

test('anonymous GET /api/auth/me returns a private 401 without opening D1', async () => {
  const db = envWithDatabaseTrap();
  const response = await onRequestGet({ request: request(), env: db.env });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { authenticated: false });
  assert.match(response.headers.get('cache-control') || '', /no-store/i);
  assert.equal(db.queries(), 0, 'anonymous poll must never access the database');
});

test('invalid session cookie returns a private 401 without opening D1', async () => {
  const db = envWithDatabaseTrap();
  const response = await onRequestGet({
    request: request('/api/auth/me', { headers: { Cookie: 'ka_session=invalid.signature' } }),
    env: db.env,
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).authenticated, false);
  assert.equal(db.queries(), 0, 'invalid signature must not cause database work');
});

test('anonymous profile PATCH requires same origin and returns 401 without D1', async () => {
  const db = envWithDatabaseTrap();
  const response = await onRequestPatch({
    request: request('/api/auth/me', {
      method: 'PATCH',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Someone' }),
    }),
    env: db.env,
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).authenticated, false);
  assert.equal(db.queries(), 0);
});

test('invalid profile PATCH cookie returns 401 without D1 or updating data', async () => {
  const db = envWithDatabaseTrap();
  const response = await onRequestPatch({
    request: request('/api/auth/me', {
      method: 'PATCH',
      headers: {
        Origin: ORIGIN,
        Cookie: 'ka_session=invalid.signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ full_name: 'Someone' }),
    }),
    env: db.env,
  });
  assert.equal(response.status, 401);
  assert.equal(db.queries(), 0);
});

test('validly signed session still reaches database-backed verification', async () => {
  const db = envWithDatabaseTrap();
  const token = await createSessionToken(SECRET, {
    id: 'mock-test-user',
    email: 'mock@example.invalid',
    role: 'user',
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await onRequestGet({
      request: request('/api/auth/me', { headers: { Cookie: 'ka_session=' + token } }),
      env: db.env,
    });
    assert.equal(response.status, 503, 'database failure must fail closed');
    assert.deepEqual(await response.json(), { error: 'Authentication service unavailable' });
    assert.ok(db.queries() > 0, 'signed session must still verify against D1');
  } finally {
    console.error = originalError;
  }
});
