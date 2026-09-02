#!/usr/bin/env node

const target = process.env.STAGING_ORIGIN || process.argv[2];
if (!target) {
  console.error('Usage: STAGING_ORIGIN=https://example.pages.dev node scripts/verify-staging-provisioning.mjs');
  process.exit(2);
}

const url = new URL(target);
const host = url.hostname.toLowerCase();
if (url.protocol !== 'https:') throw new Error('Staging origin must use HTTPS');
if (host === 'kriptoaman.com' || host.endsWith('.kriptoaman.com')) {
  throw new Error(`Refusing production/company hostname: ${host}`);
}

const expectedPaths = ['/', '/login', '/api/auth/readiness', '/api/staging-readiness'];
const results = [];

for (const path of expectedPaths) {
  const started = performance.now();
  const response = await fetch(new URL(path, url), {
    redirect: 'manual',
    headers: { 'user-agent': 'KriptoAman-Staging-Provisioning-Verification/1.0' },
  });
  const latencyMs = Number((performance.now() - started).toFixed(2));
  results.push({ path, status: response.status, latencyMs });

  if (path === '/api/staging-readiness') {
    if (response.status !== 200) {
      throw new Error(`Staging readiness must return HTTP 200, got ${response.status}`);
    }
    const body = await response.json();
    if (body?.ready !== true || body?.environment !== 'staging') {
      throw new Error('Staging readiness attestation did not confirm ready=true and environment=staging');
    }
    const checks = body?.checks || {};
    for (const [name, value] of Object.entries(checks)) {
      if (value !== true) throw new Error(`Staging isolation check failed: ${name}`);
    }
    if (!body?.database_fingerprint || !body?.session_fingerprint) {
      throw new Error('Staging readiness must expose redacted database/session fingerprints');
    }
  } else if (response.status < 200 || response.status >= 400) {
    throw new Error(`${path} failed with HTTP ${response.status}`);
  }
}

console.log(JSON.stringify({
  verified: true,
  target: `${url.protocol}//${host}`,
  checkedAt: new Date().toISOString(),
  results,
}, null, 2));
