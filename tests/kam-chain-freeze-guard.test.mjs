import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/kam-chain-freeze-guard.yml', import.meta.url), 'utf8');

test('protected chain candidate identity checks remain in place', () => {
  for (const marker of [
    "status: 'mainnet-candidate-not-public'",
    'candidateChainId: 22028',
    "candidateChainIdHex: '0x560c'",
    "consensus: 'QBFT'",
    'validatorCount: 4',
    'reuseTestnetKeys: false',
    'publicRpcDirectValidatorExposure: false',
    'commercialLaunchEnabled: false',
  ]) assert.ok(workflow.includes(marker), 'missing protected invariant: ' + marker);
});

test('main protected-path changes require exact authoritative merged PR association', () => {
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(workflow, /commits\/\$\{AFTER\}\/pulls/);
  assert.match(workflow, /merge_commit_sha == \$sha/);
  assert.match(workflow, /curl --fail-with-body -sS/);
  assert.doesNotMatch(workflow, /curl --fail-with-body -fsS/, 'curl -f and --fail-with-body cannot be combined');
  assert.match(workflow, /\.merged_at != null/);
  assert.match(workflow, /\.base\.ref == "main"/);
  assert.match(workflow, /if type == "array" then any/);
  assert.match(workflow, /\[ "\$verified" != true \]/);
  assert.match(workflow, /if \[ "\$attempt" -lt 8 \]/);
  assert.doesNotMatch(workflow, /COMMIT_MSG=|grep -Eq '\\\(#/, 'commit text alone is not trustworthy attribution');
  assert.match(workflow, /CHANGED=\$\(git diff --name-only/);
});


test('authoritative PR lookup uses non-conflicting curl failure options', () => {
  // --fail-with-body and -f are mutually exclusive: their combination makes
  // every PR lookup fail before contacting GitHub, even for reviewed merges.
  assert.match(workflow, /curl --fail-with-body -sS --connect-timeout 8 --max-time 20/);
  assert.doesNotMatch(workflow, /curl --fail-with-body -f(?:sS)?/);
});
