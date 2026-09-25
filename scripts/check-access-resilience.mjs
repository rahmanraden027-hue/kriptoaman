#!/usr/bin/env node

const PRIMARY = String(process.env.PRIMARY_ORIGIN || 'https://kriptoaman.com').replace(/\/$/, '');
const SECONDARY = String(process.env.SECONDARY_ORIGIN || '').replace(/\/$/, '');
const REQUIRE_SECONDARY = /^(1|true|yes)$/i.test(String(process.env.REQUIRE_SECONDARY || 'false'));
const TIMEOUT_MS = Number(process.env.ACCESS_CHECK_TIMEOUT_MS || 15000);
const MIN_MARKET_ASSETS = Number(process.env.MIN_MARKET_ASSETS || 4500);
const CORE_MARKET_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];

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

function requireHeader(response, name, pattern, label) {
  const value = response.headers.get(name) || '';
  if (!pattern.test(value)) throw new Error(`${label} is missing or invalid: ${name}`);
}

async function checkPage(origin, path, { securityHeaders = false } = {}) {
  const response = await request(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.text();
  if (!/<!doctype html|<html/i.test(body)) throw new Error(`${path} did not return HTML`);

  if (securityHeaders) {
    requireHeader(response, 'strict-transport-security', /max-age=\d+/i, path);
    requireHeader(response, 'x-content-type-options', /nosniff/i, path);
    requireHeader(response, 'x-frame-options', /DENY/i, path);
    requireHeader(response, 'content-security-policy', /frame-ancestors\s+'none'/i, path);
    requireHeader(response, 'referrer-policy', /strict-origin-when-cross-origin|no-referrer/i, path);
  }
}

async function readJson(origin, path, options = {}) {
  const response = await request(`${origin}${path}`, {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const contentType = response.headers.get('content-type') || '';
  if (!/application\/json/i.test(contentType)) {
    throw new Error(`${path} did not return JSON (HTTP ${response.status})`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${path} returned invalid JSON`);
  }
  return { response, payload };
}

async function checkReadiness(origin) {
  const { response, payload } = await readJson(origin, '/api/auth/readiness');
  if (response.status !== 200) throw new Error(`/api/auth/readiness returned HTTP ${response.status}`);
  const cacheControl = response.headers.get('cache-control') || '';
  if (!/no-store/i.test(cacheControl)) throw new Error('auth readiness is missing Cache-Control: no-store');

  if (payload?.ready !== true || payload?.registration !== true) {
    throw new Error('auth readiness reports registration unavailable');
  }
  for (const key of ['configuration', 'database', 'email', 'session']) {
    if (payload?.checks?.[key] !== true) throw new Error(`auth readiness check failed: ${key}`);
  }
}

async function checkRegistrationContract(origin) {
  const { response, payload } = await readJson(origin, '/api/auth/register', {
    method: 'POST',
    headers: {
      Origin: origin,
      Referer: `${origin}/register`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'invalid',
      password: 'not-a-real-registration',
      termsAccepted: true,
    }),
  });
  if (response.status !== 400) throw new Error(`/api/auth/register contract returned HTTP ${response.status}`);
  if (!/valid email/i.test(String(payload?.error || ''))) {
    throw new Error('registration route did not return the expected validation contract');
  }
}

async function checkMarketSnapshot(origin) {
  const { response, payload } = await readJson(origin, '/api/market-snapshot?health=1');
  if (response.status !== 200) throw new Error(`/api/market-snapshot?health=1 returned HTTP ${response.status}`);
  if (!Number.isFinite(Number(payload?.assetCount)) || Number(payload.assetCount) < MIN_MARKET_ASSETS) {
    throw new Error(`market snapshot asset coverage is below ${MIN_MARKET_ASSETS}: ${payload?.assetCount}`);
  }
  if (!Number.isFinite(Number(payload?.capturedAt)) || Number(payload.capturedAt) <= 0) {
    throw new Error('market snapshot is missing a valid capturedAt timestamp');
  }
  if (!Array.isArray(payload?.providerFailover) || payload.providerFailover.length < 2) {
    throw new Error('market snapshot failover contract is missing');
  }
  return {
    source: payload.source || null,
    assetCount: Number(payload.assetCount),
    ageMs: Number.isFinite(Number(payload.ageMs)) ? Number(payload.ageMs) : null,
    stale: Boolean(payload.stale),
    healthy: Boolean(payload.healthy),
  };
}

async function checkMarketContinuity(origin) {
  const { response, payload } = await readJson(origin, '/api/market-hot');
  if (response.status !== 200) throw new Error(`/api/market-hot returned HTTP ${response.status}`);
  if (payload?.available !== true) throw new Error('/api/market-hot reports data unavailable');
  if (!Array.isArray(payload?.data) || payload.data.length < CORE_MARKET_SYMBOLS.length) {
    throw new Error('/api/market-hot returned insufficient market data');
  }
  const symbols = new Set(payload.data.map((item) => String(item?.symbol || '').toUpperCase()));
  const missing = CORE_MARKET_SYMBOLS.filter((symbol) => !symbols.has(symbol));
  if (missing.length) throw new Error(`/api/market-hot is missing core assets: ${missing.join(', ')}`);
  if (!Number.isFinite(Number(payload?.capturedAt)) || Number(payload.capturedAt) <= 0) {
    throw new Error('/api/market-hot is missing a valid capturedAt timestamp');
  }
  return {
    source: payload.source || null,
    freshness: payload.freshness || null,
    stale: Boolean(payload.stale),
    healthy: Boolean(payload.healthy),
    available: true,
  };
}

async function captureCheck(name, check) {
  const started = Date.now();
  try {
    const details = await check();
    return {
      name,
      healthy: true,
      latencyMs: Date.now() - started,
      ...(details === undefined ? {} : { details }),
    };
  } catch (error) {
    return {
      name,
      healthy: false,
      latencyMs: Date.now() - started,
      error: String(error?.message || error),
    };
  }
}

async function checkOrigin(label, origin) {
  const started = Date.now();
  const checks = await Promise.all([
    captureCheck('homepage-and-security-headers', () => checkPage(origin, '/', { securityHeaders: true })),
    captureCheck('login-page', () => checkPage(origin, '/login')),
    captureCheck('register-page', () => checkPage(origin, '/register')),
    captureCheck('auth-readiness', () => checkReadiness(origin)),
    captureCheck('registration-contract', () => checkRegistrationContract(origin)),
    captureCheck('market-snapshot', () => checkMarketSnapshot(origin)),
    captureCheck('market-continuity', () => checkMarketContinuity(origin)),
  ]);
  const result = {
    label,
    origin,
    healthy: checks.every((check) => check.healthy),
    latencyMs: Date.now() - started,
    checks,
  };
  console.log(JSON.stringify(result));
  return result;
}

const results = [];
let failed = false;

const primary = await checkOrigin('primary', PRIMARY);
results.push(primary);
failed ||= !primary.healthy;

if (SECONDARY) {
  const secondary = await checkOrigin('secondary', SECONDARY);
  results.push(secondary);
  failed ||= !secondary.healthy;
} else if (REQUIRE_SECONDARY) {
  failed = true;
  results.push({ label: 'secondary', origin: null, healthy: false, error: 'SECONDARY_ORIGIN is required but not configured' });
} else {
  results.push({ label: 'secondary', origin: null, healthy: null, note: 'standby origin not configured yet' });
}

console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
if (failed) process.exit(1);
