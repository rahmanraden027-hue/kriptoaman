import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const path = 'chain/kam-mainnet/scripts/diagnose-kam-recovery-host.sh';
const script = await readFile(path, 'utf8');

test('KAM recovery diagnostic passes bash syntax validation', () => {
  const result = spawnSync('bash', ['-n', path], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('KAM recovery diagnostic is read-only, redacted, and shell-safe by contract', () => {
  assert.match(script, /EXPECTED_CHAIN_ID="0x560c"/);
  assert.match(script, /qbft_getValidatorsByBlockNumber/);
  assert.match(script, /validator_set_fingerprint=/);
  assert.match(script, /ready_for_migration_planning=/);
  assert.match(script, /rpc_binding_classes=/);
  assert.doesNotMatch(script, /--argjson/);
  assert.doesNotMatch(script, /PRIVATE_KEY|MNEMONIC|SEED_PHRASE|PASSWORD=/);
  assert.doesNotMatch(script, /systemctl\s+(stop|restart|disable|enable)/);
  assert.doesNotMatch(script, /docker\s+(stop|restart|rm)/);
  assert.doesNotMatch(script, /rm\s+-rf|mkfs|wipefs|rebuild|qbft_proposeValidatorVote/);
});
