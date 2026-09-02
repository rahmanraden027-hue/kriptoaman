import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const readinessSource = fs.readFileSync('functions/api/staging-readiness.js', 'utf8');
const verifierSource = fs.readFileSync('scripts/verify-staging-provisioning.mjs', 'utf8');
const gateSource = fs.readFileSync('.github/workflows/large-scale-staging-gate.yml', 'utf8');

test('staging readiness and verifiers use the same nested fingerprint contract', () => {
  assert.match(readinessSource, /fingerprints:\s*\{/);
  assert.match(readinessSource, /database:\s*databaseFingerprint/);
  assert.match(readinessSource, /session:\s*sessionFingerprint/);

  assert.match(verifierSource, /body\?\.fingerprints\?\.database/);
  assert.match(verifierSource, /body\?\.fingerprints\?\.session/);

  assert.match(gateSource, /report\.fingerprints\?\.database/);
  assert.match(gateSource, /report\.fingerprints\?\.session/);
});

test('staging provisioning verifier requires every isolation control', () => {
  for (const key of [
    'capacityTestsExplicitlyAllowed',
    'writesDisabled',
    'syntheticDataOnly',
    'emailIsolated',
    'kycIsolated',
    'databaseMarkerPresent',
    'sessionMarkerPresent',
  ]) {
    assert.match(verifierSource, new RegExp(key));
  }
});

test('staging verifier refuses production and company hostnames', () => {
  assert.match(verifierSource, /host === 'kriptoaman\.com'/);
  assert.match(verifierSource, /host\.endsWith\('\.kriptoaman\.com'\)/);
});
