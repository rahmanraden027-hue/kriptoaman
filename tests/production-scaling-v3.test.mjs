import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('D1 read paths use Sessions API when available without fabricating account replication state', async () => {
  const [helper, page, hot, readiness] = await Promise.all([
    read('functions/_shared/d1-session.js'),
    read('functions/api/market-snapshot-page.js'),
    read('functions/api/market-hot.js'),
    read('functions/api/scaling-readiness.js'),
  ]);
  assert.match(helper, /withSession\('first-unconstrained'\)/);
  assert.match(helper, /withSession\('first-primary'\)/);
  assert.match(helper, /readReplicationAccountState: 'requires-account-verification'/);
  assert.match(page, /readSession\(env\.AUTH_DB\)/);
  assert.match(hot, /readSession\(env\.AUTH_DB\)/);
  assert.match(readiness, /readReplicationRequiresCloudflareAccountEnablement: true/);
  assert.match(readiness, /queueRequiredOnlyAfterMeasuredContention: true/);
});

test('production SLO proof measures critical read paths on a recurring schedule', async () => {
  const [workflow, probe] = await Promise.all([
    read('.github/workflows/production-slo-proof.yml'),
    read('scripts/probe-production-slo.mjs'),
  ]);
  assert.match(workflow, /cron: '4,19,34,49 \* \* \* \*'/);
  assert.match(workflow, /retention-days: 14/);
  for (const endpoint of ['market-hot', 'market-page', 'platform-status', 'network-health', 'kam-network-status', 'scaling-readiness']) {
    assert.ok(probe.includes(`name: '${endpoint}'`));
  }
  assert.match(probe, /availabilityTarget: '>=99\.9% rolling objective'/);
  assert.match(probe, /cachedPublicApiP95TargetMs: 500/);
});

test('disaster recovery proof is local deterministic simulation plus read-only production verification', async () => {
  const workflow = await read('.github/workflows/disaster-recovery-proof.yml');
  const simulation = await read('tests/disaster-recovery-simulation.test.mjs');
  assert.match(workflow, /node --test tests\/disaster-recovery-simulation\.test\.mjs/);
  assert.match(workflow, /Live read-only check failed/);
  assert.match(simulation, /simulated upstream outage/);
  assert.match(simulation, /simulated RPC outage/);
  assert.match(simulation, /deterministic risk and anomaly intelligence/);
});
