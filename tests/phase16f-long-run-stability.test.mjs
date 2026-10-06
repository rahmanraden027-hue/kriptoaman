import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 16F defines honest 24H and 72H evidence windows', async () => {
  const manifest = JSON.parse(await read('release/phase16f-long-run-stability.json'));
  assert.equal(manifest.phase, '16F');
  assert.equal(manifest.sourcePhase, '16E');
  assert.equal(manifest.architectureFrozen, true);
  assert.equal(manifest.visualBaseline, 'phase16c-final-command-center-v1');
  assert.equal(manifest.windows['24h'].durationMs, 86_400_000);
  assert.equal(manifest.windows['24h'].minimumSpanMs, 82_800_000);
  assert.equal(manifest.windows['24h'].minimumHourlyBuckets, 20);
  assert.equal(manifest.windows['72h'].durationMs, 259_200_000);
  assert.equal(manifest.windows['72h'].minimumSpanMs, 252_000_000);
  assert.equal(manifest.windows['72h'].minimumHourlyBuckets, 60);
  assert.equal(manifest.mutationPolicy.readOnly, true);
  assert.equal(manifest.mutationPolicy.uiRedesignAllowed, false);
});

test('Phase 16F aggregates persisted Phase 16E evidence instead of inventing elapsed stability', async () => {
  const script = await read('scripts/aggregate-phase16f-stability.mjs');
  assert.match(script, /sourcePhase: manifest\.sourcePhase/);
  assert.match(script, /minimumSpanMs/);
  assert.match(script, /minimumHourlyBuckets/);
  assert.match(script, /status: 'PENDING'/);
  assert.match(script, /LONG_RUN_STABLE/);
  assert.match(script, /24H_STABLE/);
  assert.match(script, /STABLE_WITH_WARNINGS/);
  assert.match(script, /failedRunConclusions/);
  assert.match(script, /missingArtifacts/);
  assert.doesNotMatch(script, /setTimeout\([^,]+,\s*86_400_000|setTimeout\([^,]+,\s*259_200_000/);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|wallet_requestPermissions|private.?key/i);
});

test('Phase 16F reads only main-branch Phase 16E workflow evidence and runs every six hours', async () => {
  const workflow = await read('.github/workflows/phase16f-long-run-stability.yml');
  assert.match(workflow, /cron: '41 \*\/6 \* \* \*'/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /--workflow phase16e-production-observation\.yml/);
  assert.match(workflow, /--branch main/);
  assert.match(workflow, /gh run download/);
  assert.match(workflow, /phase16e-production-observation/);
  assert.match(workflow, /node scripts\/aggregate-phase16f-stability\.mjs/);
  assert.match(workflow, /retention-days: 90/);
  assert.match(workflow, /kriptoaman\/phase16f-long-run-stability/);
  assert.match(workflow, /if: github\.event_name != 'pull_request'/);
});
