import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../explorer-dashboard/zevaryq-production.html', import.meta.url), 'utf8');
const main = html.split('<main>')[1]?.split('</main>')[0] || '';

test('reference visual matches approved midnight navy, illuminated blue and champagne gold palette', () => {
  assert.match(html, /data-zvq-reference-visual="blue-gold-orbital-20260924"/);
  for (const color of ['#020915', '#127bfa', '#f8c86a', '#42d9ff', '#34e6b8']) {
    assert.ok(html.includes(color), 'missing approved color ' + color);
  }
  assert.match(html, /VISUAL REFERENCE: midnight navy/);
  assert.match(html, /class="reference-orbit-art"/);
  assert.match(html, /class="reference-worldmap"/);
  assert.match(html, /class="scene-title"/);
});

test('all reference dashboard sections retain accessible live data mounting points', () => {
  for (const id of ['metrics', 'consensus', 'performance', 'mesh', 'immune', 'satstats', 'infra',
    'security', 'fees', 'tokens', 'validators', 'stream', 'blocks', 'trust', 'probeTitle', 'q']) {
    assert.match(main, new RegExp('id="' + id + '"'), 'missing on-chain mount point: ' + id);
  }
  for (const cls of ['network-panel', 'triad', 'satellite-row', 'triad-secondary']) {
    assert.match(main, new RegExp('class="[^"]*' + cls + '[^"]*"'));
  }
  assert.equal((main.match(/class="earth-brandmark"/g) || []).length, 2);
  assert.equal((main.match(/<section\b/g) || []).length, (main.match(/<\/section>/g) || []).length,
    'semantic sections must be balanced');
  assert.equal((main.match(/<div\b/g) || []).length, (main.match(/<\/div>/g) || []).length,
    'dashboard containers must be balanced');
});

test('satellite and world map graphics cannot be mistaken for live physical telemetry', () => {
  assert.match(html, /Illustrative network architecture · not live satellite telemetry/);
  assert.match(html, /No claim of owned physical satellites or ground infrastructure/);
  assert.match(html, /topology not verified|node locations are not independently verified/);
  assert.match(html, /unavailable values are never simulated/);
  assert.match(html, /const EXPECTED_CHAIN='0x560c'/);
  assert.match(html, /setInterval\(probe,12000\)/);
  assert.doesNotMatch(html, /(?:21\s*\/\s*21|128\+ nodes|1,236 pending|3\.4 TPS|100% Secure)/i);
});

test('reference dashboard remains usable on mobile, keyboard and reduced motion', () => {
  assert.match(html, /@media\(max-width:850px\)/);
  assert.match(html, /@media\(max-width:560px\)/);
  assert.match(html, /@media\(max-width:355px\)/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html, /:focus-visible/);
  assert.match(main, /aria-label="Satellite-inspired Earth illustration/);
  assert.match(main, /aria-label="Illustrative global connectivity map/);
});
