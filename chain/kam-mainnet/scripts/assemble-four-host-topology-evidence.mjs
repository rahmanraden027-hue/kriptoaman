import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const MAX_ATTESTATION_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function fail(message) {
  console.error(JSON.stringify({ ready: false, error: message }, null, 2));
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 6 || args.length > 6) {
  fail('Usage: node assemble-four-host-topology-evidence.mjs <validator1.json> <validator2.json> <validator3.json> <validator4.json> <rpc-sentry.json> <output.json>');
}

const [validator1Path, validator2Path, validator3Path, validator4Path, sentryPath, outputPath] = args.map(resolve);

async function load(path) {
  const raw = await readFile(path, 'utf8').catch((error) => fail(`Unable to read ${path}: ${error.message}`));
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON in ${path}: ${error.message}`);
  }
}

function assertFresh(attestation, label) {
  const checkedAtMs = Date.parse(attestation.checkedAt);
  const ageMs = Date.now() - checkedAtMs;
  if (!Number.isFinite(checkedAtMs)) fail(`${label}: checkedAt is invalid`);
  if (ageMs < -MAX_FUTURE_SKEW_MS) fail(`${label}: checkedAt is too far in the future`);
  if (ageMs > MAX_ATTESTATION_AGE_MS) fail(`${label}: attestation is older than 24 hours`);
}

function assertBase(attestation, label, expectedRole) {
  if (attestation?.schemaVersion !== 1) fail(`${label}: unsupported schemaVersion`);
  if (attestation?.role !== expectedRole) fail(`${label}: role must be ${expectedRole}`);
  if (attestation?.redacted !== true) fail(`${label}: attestation must be redacted`);
  if (!SHA256_PATTERN.test(String(attestation?.hostFingerprint || ''))) fail(`${label}: hostFingerprint must be lowercase SHA-256 hex`);
  if (attestation?.persistentStorage !== true) fail(`${label}: persistentStorage must be true`);
  if (attestation?.timeSync !== true) fail(`${label}: timeSync must be true`);
  if (attestation?.managementRpcPrivate !== true) fail(`${label}: managementRpcPrivate must be true`);
  assertFresh(attestation, label);
}

function assertValidator(attestation, label) {
  assertBase(attestation, label, 'validator');
  if (!SHA256_PATTERN.test(String(attestation?.validatorFingerprint || ''))) fail(`${label}: validatorFingerprint must be lowercase SHA-256 hex`);
  const failureDomain = String(attestation?.failureDomain || '').trim();
  if (!failureDomain || failureDomain === 'unknown' || failureDomain === 'placeholder') fail(`${label}: failureDomain must identify the real operator-defined failure domain`);
}

const validators = await Promise.all([
  load(validator1Path),
  load(validator2Path),
  load(validator3Path),
  load(validator4Path),
]);
const sentry = await load(sentryPath);

validators.forEach((attestation, index) => assertValidator(attestation, `validator-${index + 1}`));
assertBase(sentry, 'rpc-sentry', 'rpc-sentry');

const hostFingerprints = validators.map((item) => item.hostFingerprint);
const validatorFingerprints = validators.map((item) => item.validatorFingerprint);
const failureDomains = validators.map((item) => item.failureDomain);

if (new Set(hostFingerprints).size !== 4) fail('Validator host fingerprints are not four unique hosts');
if (new Set(validatorFingerprints).size !== 4) fail('Validator fingerprints are not four unique identities');
if (new Set(failureDomains).size !== 4) fail('Validator failure domains are not four unique domains');
if (hostFingerprints.includes(sentry.hostFingerprint)) fail('RPC sentry shares a host fingerprint with a validator');

const evidence = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  validators: validators.map((item) => ({
    hostFingerprint: item.hostFingerprint,
    validatorFingerprint: item.validatorFingerprint,
    failureDomain: item.failureDomain,
    persistentStorage: true,
    timeSync: true,
    managementRpcPrivate: true,
  })),
  rpcSentry: {
    hostFingerprint: sentry.hostFingerprint,
    separateFromValidators: true,
  },
  sourceAttestations: {
    count: 5,
    redacted: true,
    maxAgeHours: 24,
  },
};

await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });

console.log(JSON.stringify({
  ready: true,
  output: outputPath,
  validatorHostCount: 4,
  validatorIdentityCount: 4,
  failureDomainCount: 4,
  rpcSentrySeparate: true,
  checkedAt: evidence.checkedAt,
}, null, 2));
