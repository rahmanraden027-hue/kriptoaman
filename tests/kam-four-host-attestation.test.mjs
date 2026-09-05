import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const assembler = new URL('../chain/kam-mainnet/scripts/assemble-four-host-topology-evidence.mjs', import.meta.url);
const verifier = new URL('../chain/kam-mainnet/scripts/verify-four-host-topology.mjs', import.meta.url);
const fingerprint = character => character.repeat(64);

function validator(index) {
  return {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    role: 'validator',
    hostFingerprint: fingerprint(String.fromCharCode(96 + index)),
    validatorFingerprint: fingerprint(String(index)),
    failureDomain: `domain-${index}`,
    persistentStorage: true,
    timeSync: true,
    managementRpcPrivate: true,
    nodeData: { path: '/var/lib/besu', filesystemType: 'ext4' },
    redacted: true,
  };
}

function sentry() {
  return {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    role: 'rpc-sentry',
    hostFingerprint: fingerprint('e'),
    validatorFingerprint: '',
    failureDomain: '',
    persistentStorage: true,
    timeSync: true,
    managementRpcPrivate: true,
    nodeData: { path: '/var/lib/besu', filesystemType: 'ext4' },
    redacted: true,
  };
}

async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'kam-attestation-'));
  const paths = [];
  for (let index = 1; index <= 4; index += 1) {
    const path = join(directory, `validator-${index}.json`);
    await writeFile(path, JSON.stringify(validator(index)));
    paths.push(path);
  }
  const sentryPath = join(directory, 'sentry.json');
  await writeFile(sentryPath, JSON.stringify(sentry()));
  const outputPath = join(directory, 'four-host-topology-evidence.json');
  return { directory, paths, sentryPath, outputPath };
}

test('assembler produces evidence accepted by the four-host verifier', async () => {
  const fixture = await setup();
  const assembled = spawnSync(process.execPath, [assembler.pathname, ...fixture.paths, fixture.sentryPath, fixture.outputPath], { encoding: 'utf8' });
  assert.equal(assembled.status, 0, assembled.stderr);

  const evidence = JSON.parse(await readFile(fixture.outputPath, 'utf8'));
  assert.equal(evidence.validators.length, 4);
  assert.equal(evidence.rpcSentry.separateFromValidators, true);

  const verified = spawnSync(process.execPath, [verifier.pathname, fixture.outputPath], { encoding: 'utf8' });
  assert.equal(verified.status, 0, verified.stderr);
  assert.equal(JSON.parse(verified.stdout).ready, true);
  await rm(fixture.directory, { recursive: true, force: true });
});

test('assembler rejects duplicate validator hosts', async () => {
  const fixture = await setup();
  const duplicate = validator(2);
  duplicate.hostFingerprint = fingerprint('a');
  await writeFile(fixture.paths[1], JSON.stringify(duplicate));

  const assembled = spawnSync(process.execPath, [assembler.pathname, ...fixture.paths, fixture.sentryPath, fixture.outputPath], { encoding: 'utf8' });
  assert.notEqual(assembled.status, 0);
  assert.match(assembled.stderr, /not four unique hosts/);
  await rm(fixture.directory, { recursive: true, force: true });
});

test('assembler rejects stale attestations', async () => {
  const fixture = await setup();
  const stale = validator(1);
  stale.checkedAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  await writeFile(fixture.paths[0], JSON.stringify(stale));

  const assembled = spawnSync(process.execPath, [assembler.pathname, ...fixture.paths, fixture.sentryPath, fixture.outputPath], { encoding: 'utf8' });
  assert.notEqual(assembled.status, 0);
  assert.match(assembled.stderr, /older than 24 hours/);
  await rm(fixture.directory, { recursive: true, force: true });
});
