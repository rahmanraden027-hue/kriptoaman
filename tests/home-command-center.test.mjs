import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('HomeV3 presents the production crypto command center first', async () => {
  const source = await read('src/pages/HomeV3.jsx');
  assert.match(source, /CRYPTO COMMAND CENTER/);
  assert.match(source, /LIVE PRODUCTION INTELLIGENCE/);
  assert.match(source, /CommandCenterHeroVisual/);
  assert.match(source, /<LiveBlockFlow3D\/>/);
});

test('HomeV3 removes placeholder-heavy prototype modules from the production landing surface', async () => {
  const source = await read('src/pages/HomeV3.jsx');
  assert.doesNotMatch(source, /KRIPTOAMAN SIGNAL DNA/);
  assert.doesNotMatch(source, /MARKET HEATMAP/);
  assert.doesNotMatch(source, /DIGITAL IMMUNE/);
  assert.doesNotMatch(source, /EVIDENCE DRAWER/);
  assert.doesNotMatch(source, /SignalDNA/);
});

test('command-center hero remains source aware and fail-closed', async () => {
  const source = await read('src/components/home/CommandCenterHeroVisual.jsx');
  assert.match(source, /MAINNET VERIFIED/);
  assert.match(source, /VERIFYING NETWORK/);
  assert.match(source, /UNAVAILABLE/);
  assert.match(source, /Verified ZEVARYQ RPC/);
  assert.match(source, /Current successful network probes/);
  assert.match(source, /First-party on-chain evidence/);
});

test('command-center hero keeps metrics in normal document flow for mobile safety', async () => {
  const source = await read('src/components/home/CommandCenterHeroVisual.jsx');
  assert.match(source, /relative z-10 mt-\[235px\]/);
  assert.doesNotMatch(source, /absolute inset-x-4 bottom-4 grid grid-cols-2/);
});
