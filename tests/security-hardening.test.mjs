import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

test('API responses enforce defensive security headers', async () => {
  const http = await source('../server/auth/http.js');
  assert.match(http, /Cache-Control.*no-store/);
  assert.match(http, /X-Content-Type-Options.*nosniff/);
  assert.match(http, /X-Frame-Options.*DENY/);
  assert.match(http, /Referrer-Policy.*no-referrer/);
  assert.match(http, /Permissions-Policy/);
  assert.match(http, /Cross-Origin-Opener-Policy.*same-origin/);
  assert.match(http, /Cross-Origin-Resource-Policy.*same-origin/);
  assert.match(http, /X-Robots-Tag.*noindex/);
  assert.match(http, /Sec-Fetch-Site/);
});

test('edge middleware blocks dangerous HTTP methods and disables API caching', async () => {
  const middleware = await source('../functions/api/_middleware.js');
  assert.match(middleware, /TRACE/);
  assert.match(middleware, /TRACK/);
  assert.match(middleware, /CONNECT/);
  assert.match(middleware, /status:\s*405/);
  assert.match(middleware, /no-store/);
  assert.match(middleware, /X-Frame-Options/);
});

test('admin sessions have a shorter cryptographic lifetime than normal sessions', async () => {
  const session = await source('../server/auth/session.js');
  assert.match(session, /SESSION_TTL_SECONDS\s*=\s*60 \* 60 \* 24 \* 30/);
  assert.match(session, /ADMIN_SESSION_TTL_SECONDS\s*=\s*60 \* 60 \* 8/);
  assert.match(session, /user\?\.role === 'admin'/);
  assert.match(session, /HttpOnly; Secure; SameSite=Lax; Priority=High/);
});

test('admin UI remains protected by a server-side admin verification endpoint', async () => {
  const [route, endpoint] = await Promise.all([
    source('../src/components/security/AdminRoute.jsx'),
    source('../functions/api/auth/admin/check.js'),
  ]);
  assert.match(route, /\/api\/auth\/admin\/check/);
  assert.match(route, /credentials:\s*'same-origin'/);
  assert.match(endpoint, /verifySessionToken/);
  assert.match(endpoint, /getActiveSession/);
  assert.match(endpoint, /user\.role !== 'admin'/);
});

test('admin magic links are short-lived, rate limited, one-time, and never auto-promote accounts', async () => {
  const [requestLink, callback] = await Promise.all([
    source('../functions/api/auth/admin/request-link.js'),
    source('../functions/api/auth/admin/callback.js'),
  ]);
  assert.match(requestLink, /user\.role === 'admin'/);
  assert.match(requestLink, /'admin-link',[\s\S]*2,[\s\S]*60 \* 60/);
  assert.match(requestLink, /exp:\s*now \+ 5 \* 60/);
  assert.match(callback, /consumeOneTimeToken/);
  assert.match(callback, /user\.role !== 'admin'/);
  assert.match(callback, /ADMIN_MAGIC_LINK_SESSION_TTL_SECONDS = 60 \* 60/);
  assert.doesNotMatch(callback, /promoteConfiguredAdmin/);
});

test('Coinbase account, order, transfer, conversion and SQL actions are admin-only', async () => {
  const coinbase = await source('../base44/functions/coinbaseAdvancedTrade/entry.ts');
  assert.match(coinbase, /const adminOnlyActions = new Set/);
  for (const action of [
    'get_balance', 'list_portfolios', 'get_portfolio', 'get_fees',
    'list_orders', 'get_order', 'list_fills', 'preview_order', 'create_order',
    'cancel_orders', 'convert_quote', 'convert_execute', 'convert_get', 'transfer',
    'get_accounts_v2', 'run_sql',
  ]) {
    assert.match(coinbase, new RegExp(`'${action}'`));
  }
  assert.match(coinbase, /adminOnlyActions\.has\(action\) && !isAdmin/);
  assert.match(coinbase, /status:\s*403/);
});

test('static security policy enables HSTS, CSP, anti-framing and noindex for admin surfaces', async () => {
  const headers = await source('../public/_headers');
  assert.match(headers, /Strict-Transport-Security/);
  assert.match(headers, /Content-Security-Policy/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /\/Admin\*/);
  assert.match(headers, /X-Robots-Tag: noindex, nofollow, noarchive/);
});
