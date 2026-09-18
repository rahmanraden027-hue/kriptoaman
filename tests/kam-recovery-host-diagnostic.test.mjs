import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile('chain/kam-mainnet/scripts/diagnose-kam-recovery-host.sh', 'utf8');

test('KAM recovery diagnostic is read-only and redacted by contract', () => {
  assert.match(script, /EXPECTED_CHAIN_ID="0x560c"/);
  assert.match(script, /qbft_getValidatorsByBlockNumber/);
  assert.match(script, /validatorSetFingerprint/);
  assert.match(script, /readyForMigrationPlanning/);
  assert.match(script, /json_array_or_empty/);
  assert.match(script, /jq -nc --arg method/);
  assert.doesNotMatch(script, /\| jq -Rsc[^\n]+\|\| echo '\[\]'/);
  assert.doesNotMatch(script, /cat .*key/i);
  assert.doesNotMatch(script, /sed .*key/i);
  assert.doesNotMatch(script, /PRIVATE_KEY|MNEMONIC|SEED_PHRASE/);
  assert.doesNotMatch(script, /systemctl\s+(stop|restart|disable|enable)/);
  assert.doesNotMatch(script, /docker\s+(stop|restart|rm)/);
  assert.doesNotMatch(script, /rm\s+-rf|mkfs|wipefs|rebuild/);
});
