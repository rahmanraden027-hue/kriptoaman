import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/landing/GLandingBody.jsx', import.meta.url), 'utf8');

test('public landing distinguishes live verification from degraded data', () => {
  assert.match(source, /stats\.loading[\s\S]*Memeriksa data live/);
  assert.match(source, /systemOk \? 'Operational · verified sources' : 'Data services limited'/);
  assert.match(source, /statusTimestampLabel/);
  assert.doesNotMatch(source, /lastUpdated \|\| 'Data belum tersedia'/);
});

test('public landing retains factual degraded wording after verification', () => {
  assert.match(source, /Data services limited/);
  assert.match(source, /Belum terverifikasi/);
  assert.match(source, /NETWORK EVIDENCE/);
});
