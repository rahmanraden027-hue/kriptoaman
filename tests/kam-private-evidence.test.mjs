import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('private KAM evidence redacts endpoints and fingerprints four validators', async () => {
  const collector = await read('chain/kam-mainnet/scripts/collect-private-evidence.mjs');
  assert.match(collector, /expectedValidatorCount = 4/);
  assert.match(collector, /qbft_getValidatorsByBlockNumber/);
  assert.match(collector, /net_peerCount/);
  assert.match(collector, /fingerprintSha256/);
  assert.match(collector, /endpointRedacted: true/);
  assert.doesNotMatch(collector, /console\.log\([^)]*rpcUrl/);
});

test('private KAM workflow requires a protected self-hosted runner', async () => {
  const workflow = await read('.github/workflows/kam-private-mainnet-evidence.yml');
  assert.match(workflow, /runs-on: \[self-hosted, linux, x64, kam-mainnet-evidence\]/);
  assert.match(workflow, /KAM_PRIVATE_RPC_URL: http:\/\/127\.0\.0\.1:8648/);
  assert.doesNotMatch(workflow, /secrets\.[A-Z_]*PRIVATE_KEY/);
  assert.match(workflow, /retention-days: 30/);
});

test('backup verification requires recent isolated restore checksums', async () => {
  const verifier = await read('chain/kam-mainnet/scripts/verify-backup-restore-evidence.mjs');
  assert.match(verifier, /isolated-non-production/);
  assert.match(verifier, /backupChecksumSha256/);
  assert.match(verifier, /restoredDataChecksumSha256/);
  assert.match(verifier, /7 \* 24 \* 60 \* 60 \* 1000/);
});
