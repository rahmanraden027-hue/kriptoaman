import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('network health watchdog cadence matches the bounded durable snapshot horizon', async () => {
  const [workflow, endpoint] = await Promise.all([
    read('.github/workflows/network-health-warm.yml'),
    read('functions/api/network-health.js'),
  ]);
  assert.match(endpoint, /const STALE_SNAPSHOT_MAX_AGE_MS = 5 \* 60 \* 1000/);
  assert.match(workflow, /cron: '1-59\/5 \* \* \* \*'/);
  assert.doesNotMatch(workflow, /cron: '6,21,36,51 \* \* \* \*'/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('scheduled warming still requires an actual fresh multi-provider proof', async () => {
  const source = await read('.github/workflows/network-health-warm.yml');
  assert.match(source, /network-health\?refresh=1&watchdog=/);
  assert.match(source, /total !== 21/);
  assert.match(source, /online < minimum/);
  assert.match(source, /freshProbe !== true/);
  assert.match(source, /Network health watchdog could not establish a verified fresh snapshot/);
});
