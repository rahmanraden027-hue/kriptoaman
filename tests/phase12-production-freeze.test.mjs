import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 12 freezes the accepted Phase 11 production contract', async () => {
  const manifest = JSON.parse(await read('release/phase12-production-freeze.json'));

  assert.equal(manifest.phase, '12');
  assert.equal(manifest.status, 'production-freeze-observation');
  assert.equal(manifest.phase11Final.commit, '3179ae8130ad31bfb26d9eacb07fe8f8113db436');
  assert.equal(manifest.phase11Final.pullRequest, 1018);
  assert.equal(manifest.phase11Final.result, 'FINAL_PASS');

  assert.equal(manifest.protectedInvariants.chainId, 22028);
  assert.equal(manifest.protectedInvariants.chainIdHex, '0x560c');
  assert.equal(manifest.protectedInvariants.networkName, 'ZEVARYQ Network');
  assert.equal(manifest.protectedInvariants.nativeSymbol, 'ZVQ');
  assert.equal(manifest.protectedInvariants.genesisUnchanged, true);
  assert.equal(manifest.protectedInvariants.commercialLaunchEnabled, false);

  for (const [key, expected] of Object.entries({
    readOnlyObservation: true,
    transactionSubmission: false,
    walletSigningMutation: false,
    genesisMutation: false,
    validatorMutation: false,
    privateKeyMutation: false,
    balanceMutation: false,
    dnsMutation: false,
  })) {
    assert.equal(manifest.protectedRuntimeBoundary[key], expected, key);
  }
});

test('Phase 12 observation remains read-only and evidence based', async () => {
  const workflow = await read('.github/workflows/phase12-final-release-observation.yml');

  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron: '27 \*\/6 \* \* \*'/);
  assert.match(workflow, /api\/kam\/network-status/);
  assert.match(workflow, /market-snapshot\?health=1/);
  assert.match(workflow, /developer\/network\.json/);
  assert.match(workflow, /api\/v2\/blocks/);
  assert.match(workflow, /eth_chainId/);
  assert.match(workflow, /eth_blockNumber/);
  assert.match(workflow, /actions\/upload-artifact/);

  assert.doesNotMatch(workflow, /eth_sendRawTransaction|eth_sendTransaction|wallet_sendCalls/);
  assert.doesNotMatch(workflow, /admin_|debug_|personal_/);
  assert.doesNotMatch(workflow, /private.?key|mnemonic|seed phrase/i);
});

test('Phase 12 reuses the existing production safety gates instead of replacing them', async () => {
  const manifest = JSON.parse(await read('release/phase12-production-freeze.json'));
  const required = new Set(manifest.existingRequiredGates);

  for (const path of [
    '.github/workflows/kam-chain-freeze-guard.yml',
    '.github/workflows/kam-mainnet-24x7-monitor.yml',
    '.github/workflows/zvq-explorer-browser-proof.yml',
    '.github/workflows/zvq-wallet-production-gate.yml',
    '.github/workflows/security-audit.yml',
    '.github/workflows/kam-landing-live-smoke.yml',
  ]) {
    assert.equal(required.has(path), true, path);
    const source = await read(path);
    assert.ok(source.length > 100, path + ' must remain present');
  }
});

test('Phase 12 landing smoke follows the active ZEVARYQ identity', async () => {
  const smoke = await read('.github/workflows/kam-landing-live-smoke.yml');
  assert.match(smoke, /js\.includes\('ZEVARYQ Network'\)/);
  assert.match(smoke, /current ZEVARYQ Network integration contract/);
  assert.match(smoke, /LANDING_BUNDLE: VERIFIED \| ZEVARYQ Network integration contract present=true/);
  assert.doesNotMatch(smoke, /const hasKamLabel = js\.includes\('KAM Network'\)/);
});
