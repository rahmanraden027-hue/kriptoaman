import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('scheduled stability proof is read-only and keeps the 12-network hard gate', async () => {
  const workflow = await read('.github/workflows/multichain-stability-proof.yml');
  assert.ok(workflow.includes("cron: '11,41 * * * *'"));
  assert.ok(workflow.includes('permissions:\n  contents: read'));
  assert.ok(workflow.includes('network-health?refresh=1&stability=${GITHUB_RUN_ID}-${attempt}'));
  assert.ok(workflow.includes('scripts/summarize-network-health.mjs'));
  assert.ok(workflow.includes('retention-days: 14'));
  assert.ok(workflow.includes('cancel-in-progress: false'));
  assert.doesNotMatch(workflow, /issues:\s*write/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
});

test('stability summarizer distinguishes full coverage from minimum operational coverage', async () => {
  const script = await read('scripts/summarize-network-health.mjs');
  assert.ok(script.includes("target !== 12"));
  assert.ok(script.includes("online >= target"));
  assert.ok(script.includes("online === total"));
  assert.ok(script.includes("lastKnownGoodCountsAsOnline: false"));
  assert.ok(script.includes("fullCoverageRequiresAllNetworksOnline: true"));
  assert.ok(script.includes("providerFingerprint"));
  assert.ok(script.includes("p95: percentile(latencies, 95)"));
  assert.ok(script.includes("process.exit(2)"));
  assert.doesNotMatch(script, /Math\.random/);
});
