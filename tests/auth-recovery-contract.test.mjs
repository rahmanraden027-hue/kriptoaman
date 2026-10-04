import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('login uses first-party email/password endpoint and protected dashboard', () => {
  const login = read('src/pages/Login.jsx');
  const auth = read('src/lib/kriptoAuth.js');
  const app = read('src/FullAppShell.jsx');
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
  assert.match(forgotApi, /getUserByEmail\(env\.AUTH_DB, email\)/);
  assert.match(forgotApi, /checkRateLimit\(env\.AUTH_DB, request, 'forgot', user\.id/);
  assert.match(forgotApi, /scheduleDelivery\(context, sendPasswordResetEmail\(env, email, resetUrl\)\)/);
  assert.match(forgotApi, /context\.waitUntil\(guarded\)/);
  assert.match(forgotApi, /ttlSeconds:\s*30\s*\*\s*60/);
  assert.ok(
    forgotApi.indexOf('getUserByEmail(env.AUTH_DB, email)') < forgotApi.indexOf("checkRateLimit(env.AUTH_DB, request, 'forgot', user.id"),
    'unknown accounts should not consume rate-limit writes'
  );
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
  const layout = read('src/Layout.jsx');
  assert.match(home, /min-h-screen/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /@media \(display-mode: standalone\)[\s\S]*touch-action:\s*pan-y/);
  assert.match(layout, /overflow-y:\s*auto/);
  assert.match(layout, /-webkit-overflow-scrolling:\s*touch/);
  assert.doesNotMatch(layout, /html\s*\{\s*overflow:\s*hidden/);
  assert.doesNotMatch(css, /body\s*\{[^}]*overflow-y:\s*hidden/s);
});


test('auth health probe uses independent bounded request timeouts', () => {
  const smoke = read('scripts/check-auth-surface.mjs');
  assert.match(smoke, /async function fetchWithTimeout/);
  assert.match(smoke, /12_000/);
  assert.match(smoke, /example\.invalid/);
  assert.equal((smoke.match(/new AbortController\(\)/g) || []).length, 1);
  assert.match(smoke, /const login = await expectHtml\('\/login'\)/);
  assert.match(smoke, /const forgot = await expectHtml\('\/forgot-password'\)/);
});
