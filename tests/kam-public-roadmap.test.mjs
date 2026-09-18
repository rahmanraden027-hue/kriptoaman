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
  assert.match(app, /KAM Global Roadmap/);
  assert.match(app, /Technology · Transparency · Governance · Verifiable Progress/);
  assert.doesNotMatch(app, /fixed bottom-5 right-4/);
});

test('KAM roadmap keeps market data unavailable without verified trading', async () => {
  const page = await read('src/pages/KAMGlobalRoadmap.jsx');
  assert.doesNotMatch(page, /29\.37/);
  assert.match(page, /Market Data Status/);
  assert.match(page, /Belum Diperdagangkan/);
  assert.match(page, /Not Yet Trading/);
  assert.match(page, /market price is unavailable/);
});

test('KAM roadmap is polished for mobile and does not link the obsolete scenario PDF', async () => {
  const page = await read('src/pages/KAMGlobalRoadmap.jsx');
  assert.doesNotMatch(page, /PDF_URL/);
  assert.match(page, /md:hidden/);
  assert.match(page, /hidden overflow-x-auto[\s\S]*md:block/);
  assert.match(page, /focus-visible:ring-2/);
});
