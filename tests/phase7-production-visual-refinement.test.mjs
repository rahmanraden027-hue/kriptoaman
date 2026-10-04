import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('phase 7 live block flow adds depth only on the existing verified data contract', async () => {
  const source = await read('src/components/home/LiveBlockFlow3D.jsx');

  assert.equal(source.includes('data-phase7-visual="live-block-flow"'), true);
  assert.equal(source.includes('zvq-flow-depth-fog'), true);
  assert.equal(source.includes('zvq-event-beam'), true);
  assert.equal(source.includes('VERIFIED HEAD · #'), true);
  assert.equal(source.includes("const ENDPOINT = '/api/zvq-live-blocks';"), true);
  assert.equal((source.match(/fetch\(/g) || []).length, 1);
  assert.equal(source.includes('Math.random'), false);
  assert.equal(source.includes('No synthetic blocks or invented propagation metrics are shown.'), true);
  assert.equal(source.includes('@media(prefers-reduced-motion:reduce)'), true);
});

test('phase 7 node master motion remains evidence-gated and explicitly illustrative', async () => {
  const source = await read('src/components/home/NodePropagation3D.jsx');

  assert.equal(source.includes('data-phase7-visual="node-master"'), true);
  assert.equal(source.includes("live ? 'is-live' : ''"), true);
  assert.equal(source.includes('VERIFIED EVENT · #'), true);
  assert.equal(source.includes('zvq-node-depth'), true);
  assert.equal(source.includes('zvq-node-orbit third'), true);
  assert.equal(source.includes('Node positions and propagation paths are illustrative.'), true);
  assert.equal(source.includes('No claim of measured peer propagation'), true);
  assert.equal(source.includes('fetch('), false);
  assert.equal(source.includes('Math.random'), false);
  assert.equal(source.includes('@media(prefers-reduced-motion:reduce)'), true);
});

test('phase 7 does not alter network identity or add write methods', async () => {
  const [flow, node] = await Promise.all([
    read('src/components/home/LiveBlockFlow3D.jsx'),
    read('src/components/home/NodePropagation3D.jsx'),
  ]);
  const combined = `${flow}\n${node}`;

  assert.equal(combined.includes('CHAIN ID 22028 · 0x560c'), true);
  assert.equal(/eth_sendTransaction|eth_sendRawTransaction|privateKey|mnemonic|seed phrase/i.test(combined), false);
});
