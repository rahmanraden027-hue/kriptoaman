import test from 'node:test';
import assert from 'node:assert/strict';
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
