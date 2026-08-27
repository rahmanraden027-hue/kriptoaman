import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const evidencePath = process.argv[2] || '/var/lib/kam-evidence/four-host-topology-evidence.json';
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MAX_EVIDENCE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function fail(message) {
  console.error(JSON.stringify({ ready: false, error: message }, null, 2));
  process.exit(1);
}

function hash(values) {
  return createHash('sha256').update(values.sort().join('\n')).digest('hex');
}

const raw = await readFile(evidencePath, 'utf8').catch((error) => fail(`Unable to read evidence: ${error.message}`));
const evidence = (() => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid evidence JSON: ${error.message}`);
  }
})();
const validators = Array.isArray(evidence.validators) ? evidence.validators : [];

const hostIds = validators.map((v) => String(v.hostFingerprint || '')).filter(Boolean);
const failureDomains = validators.map((v) => String(v.failureDomain || '')).filter(Boolean);
const validatorIds = validators.map((v) => String(v.validatorFingerprint || '')).filter(Boolean);
const rpcSentryId = String(evidence.rpcSentry?.hostFingerprint || '');
const evidenceCheckedAtMs = Date.parse(evidence.checkedAt);
const evidenceAgeMs = Date.now() - evidenceCheckedAtMs;

const checks = {
  validatorCount: { ok: validators.length === 4, count: validators.length, expected: 4 },
  uniqueHosts: { ok: hostIds.length === 4 && new Set(hostIds).size === 4, count: new Set(hostIds).size, expected: 4 },
  uniqueValidatorIdentities: { ok: validatorIds.length === 4 && new Set(validatorIds).size === 4, count: new Set(validatorIds).size, expected: 4 },
  fingerprintFormat: {
    ok: hostIds.length === 4
      && validatorIds.length === 4
      && hostIds.every((value) => SHA256_PATTERN.test(value))
      && validatorIds.every((value) => SHA256_PATTERN.test(value)),
    format: 'lowercase-sha256-hex',
  },
  independentFailureDomains: { ok: failureDomains.length === 4 && new Set(failureDomains).size === 4, count: new Set(failureDomains).size, expected: 4 },
  persistentStorage: { ok: validators.every((v) => v.persistentStorage === true) },
  timeSync: { ok: validators.every((v) => v.timeSync === true) },
  managementRpcPrivate: { ok: validators.every((v) => v.managementRpcPrivate === true) },
  rpcSentrySeparate: {
    ok: evidence.rpcSentry?.separateFromValidators === true
      && SHA256_PATTERN.test(rpcSentryId)
      && !hostIds.includes(rpcSentryId),
  },
  evidenceFresh: {
    ok: Number.isFinite(evidenceCheckedAtMs)
      && evidenceAgeMs >= -MAX_FUTURE_SKEW_MS
      && evidenceAgeMs <= MAX_EVIDENCE_AGE_MS,
    checkedAt: evidence.checkedAt || null,
    maxAgeHours: 24,
    maxFutureSkewMinutes: 5,
  },
};

const ready = Object.values(checks).every((check) => check.ok === true);
const output = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  sourceEvidenceCheckedAt: evidence.checkedAt || null,
  topology: 'four-validator-four-host-plus-rpc-sentry',
  endpointRedacted: true,
  hostSetFingerprintSha256: hostIds.length ? hash(hostIds) : null,
  failureDomainFingerprintSha256: failureDomains.length ? hash(failureDomains) : null,
  checks,
  ready,
};

console.log(JSON.stringify(output, null, 2));
if (!ready) process.exitCode = 1;
