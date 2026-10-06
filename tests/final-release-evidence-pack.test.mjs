import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('final release evidence pack defaults to HOLD and cannot infer stability from workflow success', async () => {
  const pack = JSON.parse(await read('release/final-release-evidence-pack.json'));
  assert.equal(pack.status, 'prepared-not-executed');
  assert.equal(pack.decisionPolicy.defaultVerdict, 'HOLD');
  assert.equal(pack.decisionPolicy.workflowSuccessAloneDoesNotEqual24hOr72hPass, true);
  assert.equal(pack.decisionPolicy.greenPreparationPrsDoNotEqualProductionPass, true);
  assert.deepEqual(pack.decisionPolicy.allowedVerdicts, ['GO','CONDITIONAL_GO','HOLD']);
});

test('24H and 72H thresholds match the Phase 16F evidence contract', async () => {
  const pack = JSON.parse(await read('release/final-release-evidence-pack.json'));
  assert.equal(pack.requiredEvidence.phase16f24h.minimumSpanHours, 23);
  assert.equal(pack.requiredEvidence.phase16f24h.minimumHourlyBuckets, 20);
  assert.equal(pack.requiredEvidence.phase16f24h.failedRunsAllowed, 0);
  assert.equal(pack.requiredEvidence.phase16f24h.missingArtifactsAllowed, 0);
  assert.equal(pack.requiredEvidence.phase16f72h.minimumSpanHours, 70);
  assert.equal(pack.requiredEvidence.phase16f72h.minimumHourlyBuckets, 60);
  assert.equal(pack.requiredEvidence.phase16f72h.failedRunsAllowed, 0);
  assert.equal(pack.requiredEvidence.phase16f72h.missingArtifactsAllowed, 0);
});

test('final pack binds the canonical ZEVARYQ identity and read-only wallet policy', async () => {
  const pack = JSON.parse(await read('release/final-release-evidence-pack.json'));
  assert.equal(pack.requiredEvidence.networkIdentity.network, 'ZEVARYQ Mainnet');
  assert.equal(pack.requiredEvidence.networkIdentity.chainId, 22028);
  assert.equal(pack.requiredEvidence.networkIdentity.chainIdHex, '0x560c');
  assert.equal(pack.requiredEvidence.networkIdentity.nativeSymbol, 'ZVQ');
  assert.equal(pack.requiredEvidence.walletSafety.broadcastLocked, true);
  assert.equal(pack.requiredEvidence.walletSafety.rpcWritePolicy, false);
  assert.equal(pack.requiredEvidence.walletSafety.privateKeyCollectionAllowed, false);
  assert.equal(pack.requiredEvidence.walletSafety.seedPhraseCollectionAllowed, false);
  assert.equal(pack.requiredEvidence.walletSafety.mnemonicCollectionAllowed, false);
});

test('GO requires stability, device, security and rollback evidence while unsupported claims remain excluded', async () => {
  const pack = JSON.parse(await read('release/final-release-evidence-pack.json'));
  const go = pack.decisionRules.GO.join(' ');
  assert.match(go, /24H PASS/);
  assert.match(go, /Device Acceptance PASS/);
  assert.match(go, /72H PASS/);
  assert.match(go, /Security gates green/);
  assert.match(go, /Rollback confirmed/);
  for (const claim of ['verified circulating supply','verified treasury or custody','verified liquidity or backing','verified physical VPS count','verified satellite infrastructure','exchange listing approval','regulatory approval','one-million simultaneous user capacity']) {
    assert.ok(pack.forbiddenClaimsWithoutEvidence.includes(claim), 'missing claim boundary: ' + claim);
  }
});

test('final evidence record remains empty until actual production evidence is attached', async () => {
  const pack = JSON.parse(await read('release/final-release-evidence-pack.json'));
  const record = pack.evidenceRecordTemplate;
  assert.equal(record.phase16f24hRunId, null);
  assert.equal(record.phase16f24hArtifactId, null);
  assert.equal(record.phase16f72hRunId, null);
  assert.equal(record.phase16f72hArtifactId, null);
  assert.equal(record.deviceEvidenceReference, null);
  assert.equal(record.finalVerdict, 'HOLD');
  assert.equal(record.decisionAt, null);
  assert.equal(record.decisionCommit, null);
});


test('preparation snapshot stays fail-closed after Command Center v1 production closure', async () => {
  const pack = JSON.parse(await read('release/final-release-evidence-pack.json'));
  assert.equal(pack.presentationBaseline, 'home-live-intelligence-command-center-v1');
  assert.equal(pack.currentPreparationSnapshot.productionClosurePr, 1051);
  assert.equal(pack.currentPreparationSnapshot.phase16f.aggregatorStatus, 'COLLECTING');
  assert.equal(pack.currentPreparationSnapshot.phase16f.qualifiesAs24hPass, false);
  assert.equal(pack.currentPreparationSnapshot.phase16f.qualifiesAs72hPass, false);
  assert.equal(pack.decisionPolicy.defaultVerdict, 'HOLD');
});
