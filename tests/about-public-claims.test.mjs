import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('About page avoids unverified scale, trading, regulatory, and trust claims', async () => {
  const [about, badges] = await Promise.all([
    read('src/pages/AboutUs.jsx'),
    read('src/components/trust/TrustBadges.jsx'),
  ]);

  for (const claim of [
    /terpercaya/i,
    /350\s*(aset)?/i,
    /20\+\s*(jaringan|chain)?/i,
    /18\+\s*(protokol)?/i,
    /24\/7/i,
    /memperdagangkan/i,
    /Regulasi\s*&\s*Keamanan/i,
    /Data belum diverifikasi/i,
  ]) {
    assert.doesNotMatch(about + badges, claim);
  }

  assert.match(about, /Platform pemantauan dan analitik aset kripto/);
  assert.match(about, /EVM atau Solana/);
  assert.match(about, /Mode Read-Only/);
  assert.match(about, /Transparansi & Keamanan/);
  assert.match(badges, /Status data dan fallback ditampilkan/);
});
