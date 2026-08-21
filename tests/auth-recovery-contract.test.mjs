import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('login uses first-party email/password endpoint and protected dashboard', () => {
  const login = read('src/pages/Login.jsx');
  const auth = read('src/lib/kriptoAuth.js');
  const app = read('src/App.jsx');
  assert.match(login, /loginViaEmailPassword\(email, password\)/);
  assert.match(auth, /\/api\/auth\/login/);
  assert.match(app, /path="\/dashboard"/);
  assert.match(app, /ProtectedRoute/);
});

test('password reset request is wired end-to-end', () => {
  const forgotPage = read('src/pages/ForgotPassword.jsx');
  const auth = read('src/lib/kriptoAuth.js');
  const forgotApi = read('functions/api/auth/forgot-password.js');
  const email = read('server/auth/email.js');
  assert.match(forgotPage, /resetPasswordRequest\(email\)/);
  assert.match(auth, /\/api\/auth\/forgot-password/);
  assert.match(forgotApi, /sendPasswordResetEmail\(env, email, resetUrl\)/);
  assert.match(forgotApi, /ttlSeconds:\s*30\s*\*\s*60/);
  assert.match(email, /subject:\s*'Reset password KriptoAman'/);
  assert.match(email, /RESEND_API_KEY/);
  assert.match(email, /AUTH_EMAIL_FROM/);
});

test('reset token updates the stored password hash and is single-use', () => {
  const resetApi = read('functions/api/auth/reset-password.js');
  const password = read('server/auth/password.js');
  assert.match(resetApi, /findResetChallenge/);
  assert.match(resetApi, /setPassword\(env\.AUTH_DB, user\.id, await hashPassword\(newPassword\)\)/);
  assert.match(resetApi, /markChallengeUsed\(env\.AUTH_DB, challenge\.id\)/);
  assert.match(password, /pbkdf2_sha256/);
  assert.match(password, /const ITERATIONS = 100000/);
});

test('authenticated home remains vertically scrollable', () => {
  const home = read('src/pages/Home.jsx');
  const css = read('src/index.css');
  assert.match(home, /min-h-screen/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.doesNotMatch(css, /body\s*\{[^}]*overflow-y:\s*hidden/s);
});
