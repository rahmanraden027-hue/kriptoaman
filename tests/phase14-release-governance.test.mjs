import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 14 governance manifest binds to the active repository ruleset contract', async () => {
  const g = JSON.parse(await read('release/phase14-release-governance.json'));
  assert.equal(g.phase, '14');
  assert.equal(g.status, 'locked');
  assert.equal(g.phase13Final.commit, '0b5be71b8386e7af8bc1969acbb85aa7ea23b7c5');
  assert.equal(g.ruleset.id, 21245066);
  assert.equal(g.ruleset.name, 'KriptoAman Production Main Protection');
  assert.equal(g.ruleset.enforcement, 'active');
  assert.equal(g.ruleset.strictRequiredStatusChecks, true);
  assert.equal(g.ruleset.requirePullRequest, true);
  assert.equal(g.ruleset.requireReviewThreadResolution, true);
  assert.equal(g.ruleset.blockDeletion, true);
  assert.equal(g.ruleset.blockNonFastForward, true);
  assert.equal(g.ruleset.bypassActors, 0);
  assert.deepEqual([...g.ruleset.requiredStatusContexts].sort(), ['kriptoaman/live-site-smoke', 'kriptoaman/production-security']);
});

test('Phase 14 transition is sealed and retains immutable transition provenance', async () => {
  const g = JSON.parse(await read('release/phase14-release-governance.json'));
  assert.equal(g.transition.active, false);
  assert.equal(g.transition.headBranch, 'phase14a-hard-enforcement-transition');
  assert.equal(g.transition.baseBranch, 'main');
  assert.equal(g.transition.baselineCommit, '0b5be71b8386e7af8bc1969acbb85aa7ea23b7c5');
  assert.deepEqual(g.transition.allowedProtectedPathChanges, ['.github/workflows/security-audit.yml']);
});

test('required production-security status executes the live Phase 14 governance verifier', async () => {
  const security = await read('.github/workflows/security-audit.yml');
  assert.match(security, /Verify Phase 14 release governance hard enforcement/);
  assert.match(security, /node scripts\/verify-phase14-release-governance\.mjs/);
  assert.match(security, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(security, /kriptoaman\/production-security/);
  assert.match(security, /Production security, governance and KAM integrity gates passed/);
});

test('Phase 13 lock only permits the declared one-time governance transition', async () => {
  const workflow = await read('.github/workflows/phase13-production-stability-release-lock.yml');
  const manifest = JSON.parse(await read('release/phase13-production-stability-lock.json'));
  assert.equal(manifest.releaseBaseline.commit, '546457f9362a761a33e19539d06dbc3821f282d5');
  assert.match(workflow, /releaseBaseline/);
  assert.match(workflow, /TRANSITION_ALLOWED/);
  assert.match(workflow, /AUTHORIZED_PHASE14_TRANSITION/);
  assert.match(workflow, /allowedProtectedPathChanges/);
  assert.match(workflow, /unauthorized drift in protected path/);
});

test('Phase 14 verifier checks live ruleset hard-enforcement properties', async () => {
  const verifier = await read('scripts/verify-phase14-release-governance.mjs');
  for (const marker of ['rulesets/','required_status_checks','strict_required_status_checks_policy','pull_request','required_review_thread_resolution','non_fast_forward','deletion','kriptoaman/production-security']) {
    assert.equal(verifier.includes(marker), true, marker);
  }
  assert.doesNotMatch(verifier, /method:\s*['\"](?:PATCH|POST|PUT|DELETE)/);
});

test('Phase 14 remains runtime-state safe', async () => {
  const g = JSON.parse(await read('release/phase14-release-governance.json'));
  const forbidden = new Set(g.forbiddenRuntimeMutations);
  for (const item of ['genesis','validator-keys','private-keys','balances','transactions','dns','rpc-write-methods','wallet-signing','wallet-broadcasting','token-state']) assert.equal(forbidden.has(item), true, item);
});
