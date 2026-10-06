import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 16E continuity guardian is hourly and self-heals only when evidence is stale', async () => {
  const workflow = await read('.github/workflows/phase16e-observation-continuity.yml');
  assert.match(workflow, /cron: '53 \* \* \* \*'/);
  assert.match(workflow, /MAX_AGE_SECONDS=5400/);
  assert.match(workflow, /gh run list/);
  assert.match(workflow, /phase16e-production-observation\.yml/);
  assert.match(workflow, /gh workflow run phase16e-production-observation\.yml --ref main/);
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /kriptoaman\/phase16e-observation-continuity/);
});

test('continuity guardian treats queued, in-progress, or successful recent observations as healthy', async () => {
  const workflow = await read('.github/workflows/phase16e-observation-continuity.yml');
  assert.match(workflow, /\.status == "queued"/);
  assert.match(workflow, /\.status == "in_progress"/);
  assert.match(workflow, /\.conclusion == "success"/);
  assert.match(workflow, /recent_count/);
});

test('continuity guardian remains observation-only', async () => {
  const workflow = await read('.github/workflows/phase16e-observation-continuity.yml');
  assert.doesNotMatch(workflow, /eth_sendTransaction|eth_sendRawTransaction|wallet_requestPermissions|private.?key|genesis|validator|balance mutation|token supply mutation/i);
});
