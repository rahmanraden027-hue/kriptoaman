import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validatePassword, hashPassword, verifyPassword } from '../server/auth/password.js';
import {
  createOtp,
  createResetToken,
  signToken,
  verifySignedToken,
} from '../server/auth/tokens.js';

test('password policy rejects weak and oversized passwords', () => {
  assert.equal(validatePassword('short'), false);
  assert.equal(validatePassword('a'.repeat(129)), false);
  assert.equal(validatePassword('StrongPass123!'), true);
});

test('password hashes are salted and verify without exposing the password', async () => {
  const password = 'StrongPass123!';
  const first = await hashPassword(password);
  const second = await hashPassword(password);

  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('wrong-password', first), false);
});

test('OTP and reset tokens use expected secure formats', () => {
  assert.match(createOtp(), /^\d{6}$/);
  assert.match(createResetToken(), /^[A-Za-z0-9_-]{40,}$/);
});

test('signed tokens enforce signature, purpose, and expiry', async () => {
  const secret = 'test-secret-for-auth-regression';
  const token = await signToken({ sub: 'user-1', purpose: 'session' }, secret, 60);

  const payload = await verifySignedToken(token, secret, 'session');
  assert.equal(payload.sub, 'user-1');

  await assert.rejects(() => verifySignedToken(token, secret, 'reset'));
  await assert.rejects(() => verifySignedToken(`${token}tampered`, secret, 'session'));
});

test('account deletion is first-party, same-origin, authenticated, and clears the session', async () => {
  const [endpoint, users, client, component, gradle] = await Promise.all([
    readFile(new URL('../functions/api/auth/delete-account.js', import.meta.url), 'utf8'),
    readFile(new URL('../server/auth/users.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/kriptoAuth.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/DeleteAccountDialog.jsx', import.meta.url), 'utf8'),
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
  assert.match(gradle, /versionCode 4/);
  assert.match(gradle, /versionName "1\.3"/);
});