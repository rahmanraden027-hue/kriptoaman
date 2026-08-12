import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { hashPassword, validatePassword, verifyPassword } from '../server/auth/password.js';
import { createOtp, createResetToken, createSignedToken, verifySignedToken } from '../server/auth/tokens.js';

test('password policy rejects weak and oversized passwords', () => {
  assert.equal(validatePassword('short'), 'Password must contain at least 12 characters');
  assert.equal(validatePassword('x'.repeat(129)), 'Password must contain no more than 128 characters');
  assert.equal(validatePassword('correct horse battery staple'), null);
});

test('password hashes are salted and verify without exposing the password', async () => {
  const password = 'correct horse battery staple';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('wrong password value', first), false);
});

test('OTP and reset tokens use expected secure formats', () => {
  for (let index = 0; index < 50; index += 1) assert.match(createOtp(), /^\d{6}$/);
  assert.match(createResetToken(), /^[A-Za-z0-9_-]{40,}$/);
});

test('signed tokens enforce signature, purpose, and expiry', async () => {
  const secret = 'test-secret-that-is-long-enough';
  const now = Math.floor(Date.now() / 1000);
  const token = await createSignedToken(secret, { purpose: 'email', exp: now + 60, sub: 'user-1' });
  assert.equal((await verifySignedToken(secret, token, 'email')).sub, 'user-1');
  assert.equal(await verifySignedToken(secret, token, 'reset'), null);
  assert.equal(await verifySignedToken('different-secret', token, 'email'), null);
  const expired = await createSignedToken(secret, { purpose: 'email', exp: now - 1 });
  assert.equal(await verifySignedToken(secret, expired, 'email'), null);
});

test('account deletion is first-party, same-origin, authenticated, and clears the session', async () => {
  const [endpoint, users, client, component, gradle] = await Promise.all([
    readFile(new URL('../functions/api/auth/delete-account.js', import.meta.url), 'utf8'),
    readFile(new URL('../server/auth/users.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/kriptoAuth.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/mobile/DeleteAccount.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8'),
  ]);

  assert.match(endpoint, /requireSameOrigin/);
  assert.match(endpoint, /verifySessionToken/);
  assert.match(endpoint, /confirmation !== 'HAPUS'/);
  assert.match(endpoint, /clearSessionCookie/);
  assert.match(endpoint, /user\.role === 'admin'/);
  assert.match(users, /DELETE FROM auth_challenges/);
  assert.match(users, /DELETE FROM auth_consents/);
  assert.match(users, /DELETE FROM auth_users/);
  assert.match(client, /\/api\/auth\/delete-account/);
  assert.match(component, /kriptoAuth\.deleteAccount/);
  assert.doesNotMatch(component, /adminSecurityCheck|base44\.functions\.invoke/);
  assert.match(gradle, /versionCode 2/);
  assert.match(gradle, /versionName "1\.1"/);
});
