import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/landing/GLandingBody.jsx', import.meta.url), 'utf8');

test('public landing distinguishes live verification from delayed and limited data', () => {
  assert.match(source, /stats\.loading[\s\S]*Memeriksa data live/);
  assert.match(source, /marketDisplayStatus === 'checking'[\s\S]*'Memeriksa'/);
  assert.match(source, /stats\.loading \? 'bg-\[var\(--ka-blue\)\]'/);
  assert.match(source, /Pembaruan tertunda/);
  assert.doesNotMatch(source, /lastUpdated \|\| 'Data belum tersedia'/);
});

test('public landing retains factual fail-closed wording after verification', () => {
  assert.match(source, /Layanan data terbatas/);
  assert.match(source, /KriptoAman tidak mengganti data yang tidak tersedia dengan angka buatan/);
  assert.match(source, /Memeriksa jaringan live/);
  assert.match(source, /Status freshness dibedakan/);
});
