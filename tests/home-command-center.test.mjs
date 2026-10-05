import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('HomeV3 presents a personal workspace instead of repeating the public command center', async () => {
  const source = await read('src/pages/HomeV3.jsx');
  assert.match(source, /MY KRIPTOAMAN/);
  assert.match(source, /Your market\. Your evidence\./);
  assert.match(source, /MY WORKSPACE/);
  assert.doesNotMatch(source, /CRYPTO COMMAND CENTER/);
  assert.doesNotMatch(source, /CommandCenterHeroVisual/);
  assert.doesNotMatch(source, /<LiveBlockFlow3D\/>/);
});

test('HomeV3 removes placeholder-heavy prototype modules from the production landing surface', async () => {
  const source = await read('src/pages/HomeV3.jsx');
  assert.doesNotMatch(source, /KRIPTOAMAN SIGNAL DNA/);
  assert.doesNotMatch(source, /MARKET HEATMAP/);
  assert.doesNotMatch(source, /DIGITAL IMMUNE/);
  assert.doesNotMatch(source, /EVIDENCE DRAWER/);
  assert.doesNotMatch(source, /SignalDNA/);
});

test('HomeV3 keeps compact status source-aware and fail-closed', async () => {
  const source = await read('src/pages/HomeV3.jsx');
  assert.match(source, /Verified chain head/);
  assert.match(source, /Verified RPC required/);
  assert.match(source, /UNAVAILABLE/);
  assert.match(source, /Successful live probes/);
  assert.match(source, /LIVE EVIDENCE/);
});

test('technical diagnostics are routed away from Home instead of repeated inline', async () => {
  const source = await read('src/pages/HomeV3.jsx');
  assert.match(source, /System Evidence/);
  assert.match(source, /FULL DIAGNOSTICS/);
  assert.match(source, /ZEVARYQ Explorer/);
  assert.doesNotMatch(source, /Network Operations Console/);
  assert.doesNotMatch(source, /Block Event → Node Pulse → Explorer Index/);
});
