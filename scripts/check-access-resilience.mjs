#!/usr/bin/env node

const PRIMARY = String(process.env.PRIMARY_ORIGIN || 'https://kriptoaman.com').replace(/\/$/, '');
const SECONDARY = String(process.env.SECONDARY_ORIGIN || '').replace(/\/$/, '');
const REQUIRE_SECONDARY = /^(1|true|yes)$/i.test(String(process.env.REQUIRE_SECONDARY || 'false'));
const TIMEOUT_MS = Number(process.env.ACCESS_CHECK_TIMEOUT_MS || 15000);

function abortAfter(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function request(url, options = {}) {
  const guard = abortAfter(TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      cache: 'no-store',
      ...options,
      signal: guard.signal,
    });
  } finally {
    guard.clear();
  }
}

async function checkPage(origin, path) {
  const response = await request(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.text();
  if (!/<!doctype html|<html/i.test(body)) throw new Error(`${path} did not return HTML`);
}

async function checkReadiness(origin) {
  const response = await request(`${origin}/api/auth/readiness`, {
    headers: { Accept: 'application/json' },
  });
  if (response.status !== 200) throw new Error(`/api/auth/readiness returned HTTP ${response.status}`);
  const cacheControl = response.headers.get('cache-control') || '';
  if (!/no-store/i.test(cacheControl)) throw new Error('auth readiness is missing Cache-Control: no-store');

  const contentType = response.headers.get('content-type') || '';
  if (!/application\/json/i.test(contentType)) throw new Error('auth readiness did not return JSON');

  const payload = await response.json();
  if (payload?.ready !== true || payload?.registration !== true) {
    throw new Error('auth readiness reports registration unavailable');
  }
  for (const key of ['configuration', 'database', 'email', 'session']) {
    if (payload?.checks?.[key] !== true) throw new Error(`auth readiness check failed: ${key}`);
  }
}

async function checkRegistrationContract(origin) {
  const response = await request(`${origin}/api/auth/register`, {
    method: 'POST',
    headers: {
      Origin: origin,
      Referer: `${origin}/register`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: 'invalid',
      password: 'not-a-real-registration',
      termsAccepted: true,
    }),
  });
  if (response.status !== 400) throw new Error(`/api/auth/register contract returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!/valid email/i.test(String(payload?.error || ''))) {
    throw new Error('registration route did not return the expected validation contract');
  }
}

async function checkOrigin(label, origin) {
  const started = Date.now();
  await checkPage(origin, '/');
  await checkPage(origin, '/login');
  await checkPage(origin, '/register');
  await checkReadiness(origin);
  await checkRegistrationContract(origin);
  const latencyMs = Date.now() - started;
  console.log(JSON.stringify({ label, origin, healthy: true, latencyMs }));
  return { label, origin, healthy: true, latencyMs };
}

const results = [];
let failed = false;

try {
  results.push(await checkOrigin('primary', PRIMARY));
} catch (error) {
  failed = true;
  results.push({ label: 'primary', origin: PRIMARY, healthy: false, error: String(error?.message || error) });
}

if (SECONDARY) {
  try {
    results.push(await checkOrigin('secondary', SECONDARY));
  } catch (error) {
    failed = true;
    results.push({ label: 'secondary', origin: SECONDARY, healthy: false, error: String(error?.message || error) });
  }
} else if (REQUIRE_SECONDARY) {
  failed = true;
  results.push({ label: 'secondary', origin: null, healthy: false, error: 'SECONDARY_ORIGIN is required but not configured' });
} else {
  results.push({ label: 'secondary', origin: null, healthy: null, note: 'standby origin not configured yet' });
}

console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
if (failed) process.exit(1);
