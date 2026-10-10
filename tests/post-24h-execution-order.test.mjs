import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('post-24H order preserves one production baseline through the 72H gate', async () => {
  const plan = JSON.parse(await read('release/post-24h-execution-order.json'));
  assert.equal(plan.status, 'prepared-not-executed');
  assert.equal(plan.principle, 'preserve one unchanged production baseline through the 72H stability window');
  assert.equal(plan.releaseRule.doNotMixProductionChangesIntoActive72hWindow, true);
  assert.equal(plan.releaseRule.deviceGateAfter24hDoesNotRequireRuntimeMutation, true);
  assert.equal(plan.prerequisites.minimum24hSpanHours, 23);
  assert.equal(plan.prerequisites.minimum24hHourlyBuckets, 20);
});

test('72H proof is required before runtime and public identity transitions', async () => {
  const plan = JSON.parse(await read('release/post-24h-execution-order.json'));
  const byId = Object.fromEntries(plan.sequence.map(step => [step.id, step]));
  assert.equal(byId['continue-72h-same-baseline'].required72hSpanHours, 70);
  assert.equal(byId['continue-72h-same-baseline'].required72hHourlyBuckets, 60);
  assert.ok(byId['verify-72h-pass'].order < byId['canonical-zvq-alias'].order);
  assert.ok(byId['verify-72h-pass'].order < byId['governed-runtime-transition'].order);
  assert.ok(byId['verify-72h-pass'].order < byId['public-identity-cleanup'].order);
});

test('prepared PRs are explicitly inputs rather than proof of production acceptance', async () => {
  const plan = JSON.parse(await read('release/post-24h-execution-order.json'));
  assert.equal(plan.preparedPullRequests['1042'].purpose, 'ZVQ network-status compatibility preparation');
  assert.equal(plan.preparedPullRequests['1043'].purpose, 'Public Identity Cleanup Pack');
  assert.equal(plan.preparedPullRequests['1044'].purpose, 'Device Acceptance Pack');
  for (const pr of Object.values(plan.preparedPullRequests)) {
    assert.equal(pr.mustRemainDraftUntil24hPass, true);
  }
});

test('protected runtime transition remains governance-gated and excludes chain-state mutations', async () => {
  const plan = JSON.parse(await read('release/post-24h-execution-order.json'));
  const transition = plan.sequence.find(step => step.id === 'governed-runtime-transition');
  assert.equal(transition.governanceRequired, true);
  for (const forbidden of ['genesis','validator keys','private keys','balances','token supply','liquidity','custody','DNS','consensus','wallet signing','wallet broadcasting','RPC write methods']) {
    assert.ok(transition.forbidden.includes(forbidden), 'missing forbidden mutation: ' + forbidden);
  }
  assert.equal(plan.releaseRule.legacyEndpointDeprecationIsOutOfScope, true);
});
