import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Final UI Unification keeps canonical primary navigation and makes the cross-surface rail secondary-only', async () => {
  const [rail, primary] = await Promise.all([
    read('src/components/command/CrossSurfaceRail.jsx'),
    read('src/lib/primaryNavigation.js'),
  ]);

  for (const id of ['home', 'markets', 'intelligence', 'onchain', 'ecosystem']) {
    assert.match(primary, new RegExp("id: '" + id + "'"), id);
  }

  assert.match(rail, /SECONDARY_SURFACE_IDS/);
  assert.match(rail, /\['portfolio', 'security', 'wallet'\]/);
  assert.match(rail, /visibleItems = CROSS_SURFACE_ITEMS\.filter/);
  assert.match(rail, /data-primary-navigation-owner="canonical-shell"/);
  assert.match(rail, /data-secondary-tools-only="true"/);
  assert.match(rail, /useLanguage/);
  assert.match(rail, /ZEVARYQ Wallet/);
});

test('Final UI Unification hides unverifiable intelligence metrics instead of rendering a wall of unavailable cards', async () => {
  const intelligence = await read('src/pages/IntelligenceHub.jsx');

  assert.match(intelligence, /verifiedMetrics = metrics\.filter/);
  assert.match(intelligence, /verifiedMetrics\.length \? \(/);
  assert.match(intelligence, /Menunggu data terverifikasi/);
  assert.match(intelligence, /Awaiting verified data/);
  assert.match(intelligence, /Metrik belum ditampilkan sampai sumber produksi memberikan nilai yang dapat diverifikasi/);
  assert.match(intelligence, /Metrics remain hidden until production sources provide verifiable values/);
  assert.doesNotMatch(intelligence, /Market, jaringan, risiko, dan evidence live/);
  assert.doesNotMatch(intelligence, /Risk & Security/);
  assert.doesNotMatch(intelligence, /Network Intelligence/);
});

test('Final UI Unification remains presentation-only', async () => {
  const source = [
    await read('src/components/command/CrossSurfaceRail.jsx'),
    await read('src/pages/IntelligenceHub.jsx'),
  ].join('\n');

  assert.doesNotMatch(source, /eth_sendRawTransaction|eth_sendTransaction|private.?key|validator.?key|genesis|transaction broadcast/i);
  assert.doesNotMatch(source, /fetch\([^)]*rpc\.kriptoaman\.com/i);
});
