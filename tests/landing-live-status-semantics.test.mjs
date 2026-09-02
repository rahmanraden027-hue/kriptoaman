import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/landing/GLandingBody.jsx', import.meta.url), 'utf8');

test('public landing distinguishes live verification from degraded data', () => {
  assert.match(source, /stats\.loading \? 'Memeriksa data live'/);
  assert.match(source, /stats\.loading \? 'Memeriksa'/);
  assert.match(source, /stats\.loading \? 'bg-\[var\(--ka-blue\)\]'/);
  assert.doesNotMatch(source, /lastUpdated \|\| 'Data belum tersedia'/);
});

test('public landing retains factual degraded wording after verification', () => {
  assert.match(source, /Layanan data terbatas/);
  assert.match(source, /Belum terverifikasi/);
});
