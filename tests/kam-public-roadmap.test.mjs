import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KAM global roadmap is registered as a public page', async () => {
  const pages = await read('src/pages.config.js');
  const app = await read('src/App.jsx');
  assert.match(pages, /'KAMGlobalRoadmap'/);
  assert.match(app, /'KAMGlobalRoadmap'/);
  assert.match(app, /href="\/KAMGlobalRoadmap"/);
  assert.match(app, /Baca KAM Global Roadmap/);
});

test('KAM roadmap keeps US$29.37 classified as an indicative scenario', async () => {
  const page = await read('src/pages/KAMGlobalRoadmap.jsx');
  assert.match(page, /US\$29\.37/);
  assert.match(page, /Indicative Scenario Reference/);
  assert.match(page, /Belum Diperdagangkan/);
  assert.match(page, /Not Yet Trading/);
  assert.match(page, /Market price becomes active when real trading and liquidity data are available/);
});
