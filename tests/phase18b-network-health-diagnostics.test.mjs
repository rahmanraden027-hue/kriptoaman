import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('SLO report treats missing network coverage as unknown, not zero chains', async () => {
  const source = await read('scripts/probe-production-slo.mjs');
  assert.match(source, /networkOnline: Number\.isFinite\(network\?\.summary\?\.online\) \? network\.summary\.online : null/);
  assert.match(source, /networkTotal: Number\.isFinite\(network\?\.summary\?\.total\) \? network\.summary\.total : null/);
  assert.match(source, /networkDegraded: Number\.isFinite\(network\?\.summary\?\.degraded\) \? network\.summary\.degraded : null/);
  assert.doesNotMatch(source, /networkOnline: Number\(network\?\.summary\?\.online \|\| 0\)/);
  assert.match(source, /networkOnline \?\? 'unknown'/);
  assert.match(source, /networkTotal \?\? 'unknown'/);
});

test('failed SLO evidence records bounded network availability reason and still fails the hard gate', async () => {
  const source = await read('scripts/probe-production-slo.mjs');
  assert.match(source, /availability: body\.availability \?/);
  assert.match(source, /state: body\.availability\?\.state \?\? null/);
  assert.match(source, /reason: body\.availability\?\.reason \?\? null/);
  assert.match(source, /hardFailures: hardFailures\.map/);
  assert.match(source, /if \(hardFailures\.length\) process\.exit\(2\)/);
});
