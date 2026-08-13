import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('Market page has a visible in-app back control to dashboard', () => {
  assert.match(app, /MarketPageWithBack/);
  assert.match(app, /href="\/dashboard"/);
  assert.match(app, />Kembali</);
  assert.match(app, /path === 'Market'/);
});
