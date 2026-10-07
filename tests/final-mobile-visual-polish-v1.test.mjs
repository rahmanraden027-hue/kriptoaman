import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('final mobile polish anchors the hero orbit to recognizable verified market assets plus one live mover', async () => {
  const hero = await read('src/components/home-v10/CommandCenterHero.jsx');

  assert.match(hero, /ANCHOR_ORBIT_SYMBOLS = Object\.freeze\(\['BTC', 'ETH', 'SOL', 'BNB', 'XRP'\]\)/);
  assert.match(hero, /selectOrbitAssets/);
  assert.match(hero, /Math\.abs\(Number\(b\.change24h\)\)/);
  assert.match(hero, /data-orbit-mode="anchor-plus-live-mover-v1"/);
  assert.match(hero, /<NetworkGlobe assets=\{market\?\.assets \|\| \[\]\}/);
  assert.doesNotMatch(hero, /const nodes = assets\.slice\(0, ORBIT_POSITIONS\.length\)/);
  assert.match(hero, /hidden text-\[8px\].*sm:inline/);
  assert.match(hero, /grid grid-cols-2 gap-2 sm:grid-cols-3/);
});

test('final mobile polish makes provenance trust signals readable without weakening machine-readable evidence', async () => {
  const provenance = await read('src/components/home-v10/DataProvenanceBar.jsx');

  assert.match(provenance, /data-trust-signal="readable-v2"/);
  assert.match(provenance, /data-readability-polish="micro-v2"/);
  assert.match(provenance, /text-\[10px\]/);
  assert.match(provenance, /sm:text-\[9px\]/);
  assert.match(provenance, /min-h-10 flex-wrap/);
  assert.match(provenance, /order-3 w-full/);
  assert.match(provenance, /data-data-state=/);
  assert.match(provenance, /data-data-source=/);
  assert.match(provenance, /data-data-timestamp=/);
  assert.match(provenance, /data-data-age-ms=/);
});

test('market unavailable sparkline stays truthful but visually compact', async () => {
  const market = await read('src/pages/Market.jsx');

  assert.match(market, /chartUnavailable: '—'/);
  assert.match(market, /chartUnavailableLabel: 'Grafik belum tersedia untuk aset ini'/);
  assert.match(market, /chartUnavailableLabel: 'Chart unavailable for this asset'/);
  assert.match(market, /aria-label=\{text\.chartUnavailableLabel\}/);
  assert.match(market, /title=\{text\.chartUnavailableLabel\}/);
  assert.doesNotMatch(market, /fallbackSparkline|Math\.random/);
});
