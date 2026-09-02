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
let readinessEvidence = null;

for (const path of expectedPaths) {
  const started = performance.now();
  const response = await fetch(new URL(path, url), {
    redirect: 'manual',
    headers: { 'user-agent': 'KriptoAman-Staging-Provisioning-Verification/1.1' },
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
    const requiredChecks = [
      'capacityTestsExplicitlyAllowed',
      'writesDisabled',
      'syntheticDataOnly',
      'emailIsolated',
      'kycIsolated',
      'databaseMarkerPresent',
      'sessionMarkerPresent',
    ];
    for (const name of requiredChecks) {
      if (checks[name] !== true) throw new Error(`Staging isolation check failed: ${name}`);
    }

    const databaseFingerprint = body?.fingerprints?.database;
    const sessionFingerprint = body?.fingerprints?.session;
    if (!databaseFingerprint || !sessionFingerprint) {
      throw new Error('Staging readiness must expose redacted fingerprints.database and fingerprints.session');
    }

    readinessEvidence = {
      revision: body?.revision || null,
      databaseFingerprint,
      sessionFingerprint,
      checks: Object.fromEntries(requiredChecks.map((name) => [name, true])),
    };
  } else if (response.status < 200 || response.status >= 400) {
    throw new Error(`${path} failed with HTTP ${response.status}`);
  }
}

console.log(JSON.stringify({
  verified: true,
  target: `${url.protocol}//${host}`,
  checkedAt: new Date().toISOString(),
  readiness: readinessEvidence,
  results,
}, null, 2));
