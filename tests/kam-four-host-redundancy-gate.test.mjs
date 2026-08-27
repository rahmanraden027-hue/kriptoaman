import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const verifier = new URL('../chain/kam-mainnet/scripts/verify-four-host-topology.mjs', import.meta.url);
const fingerprint = character => character.repeat(64);

function validEvidence() {
  return {
    checkedAt: new Date().toISOString(),
    validators: ['a', 'b', 'c', 'd'].map((character, index) => ({
      hostFingerprint: fingerprint(character),
      validatorFingerprint: fingerprint(String(index + 1)),
      failureDomain: `domain-${index + 1}`,
      persistentStorage: true,
      timeSync: true,
      managementRpcPrivate: true,
    })),
    rpcSentry: {
      hostFingerprint: fingerprint('e'),
      separateFromValidators: true,
    },
  };
}

async function verify(evidence) {
  const directory = await mkdtemp(join(tmpdir(), 'kam-four-host-'));
  const path = join(directory, 'evidence.json');
  await writeFile(path, JSON.stringify(evidence));
  const result = spawnSync(process.execPath, [verifier.pathname, path], { encoding: 'utf8' });
  await rm(directory, { recursive: true, force: true });
  return { ...result, output: JSON.parse(result.stdout) };
}

test('four-host gate accepts fresh, unique, real SHA-256 fingerprints', async () => {
  const result = await verify(validEvidence());
  assert.equal(result.status, 0);
  assert.equal(result.output.ready, true);
  assert.equal(result.output.checks.fingerprintFormat.ok, true);
  assert.equal(result.output.checks.rpcSentrySeparate.ok, true);
});

test('four-host gate rejects placeholder fingerprints', async () => {
  const evidence = validEvidence();
  evidence.validators[0].hostFingerprint = 'sha256-redacted-host-1';
  const result = await verify(evidence);
  assert.notEqual(result.status, 0);
  assert.equal(result.output.ready, false);
  assert.equal(result.output.checks.fingerprintFormat.ok, false);
});

test('four-host gate rejects future evidence and a sentry sharing a validator host', async () => {
  const evidence = validEvidence();
  evidence.checkedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  evidence.rpcSentry.hostFingerprint = evidence.validators[0].hostFingerprint;
  const result = await verify(evidence);
  assert.notEqual(result.status, 0);
  assert.equal(result.output.checks.evidenceFresh.ok, false);
  assert.equal(result.output.checks.rpcSentrySeparate.ok, false);
});
