import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('landing consumes the stable platform status contract', async () => {
  const landing = await read('src/pages/KriptoAmanGlobalLanding.jsx');
  assert.match(landing, /\/api\/platform-status/);
  assert.match(landing, /platformPayload\.components\.market/);
  assert.match(landing, /platformPayload\.components\.networks/);
  assert.match(landing, /platformPayload\.components\.kam/);
  assert.doesNotMatch(landing, /Math\.random/);
});

test('SystemStatus combines first-party and platform health without fabricated values', async () => {
  const page = await read('src/pages/SystemStatus.jsx');
  assert.match(page, /\/api\/health/);
  assert.match(page, /\/api\/platform-status/);
  assert.match(page, /KAM Mainnet RPC/);
  assert.match(page, /Verified Public Networks/);
  assert.match(page, /componentState/);
  assert.doesNotMatch(page, /Math\.random/);
});
