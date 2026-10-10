import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('missing and failed D1 snapshots are explicitly diagnosed without leaking query details', async () => {
  const source = await read('functions/api/network-health.js');
  for (const reason of [
    'd1_binding_unavailable',
    'd1_snapshot_missing',
    'd1_snapshot_expired',
    'd1_snapshot_invalid',
    'd1_read_error',
    'd1_read_budget_exceeded',
  ]) assert.ok(source.includes(reason), `missing bounded diagnostic ${reason}`);
  assert.match(source, /if \(durable\?\.snapshot\)/);
  assert.match(source, /availability: \{[\s\S]*diagnostics: diagnostics \?\? null/);
  assert.match(source, /verified_snapshot_unavailable_within_response_budget/);
  assert.match(source, /return json\(warmingPayload\(deliveryMode, diagnostics\), \{ status: 503 \}/);
});

test('missing network coverage is unknown, never fabricated as zero chains', async () => {
  const source = await read('scripts/probe-production-slo.mjs');
  assert.match(source, /networkOnline: Number\.isFinite\(network\?\.summary\?\.online\) \? network\.summary\.online : null/);
  assert.match(source, /networkTotal: Number\.isFinite\(network\?\.summary\?\.total\) \? network\.summary\.total : null/);
  assert.doesNotMatch(source, /networkOnline: Number\(network\?\.summary\?\.online \|\| 0\)/);
  assert.match(source, /networkOnline \?\? 'unknown'/);
});
