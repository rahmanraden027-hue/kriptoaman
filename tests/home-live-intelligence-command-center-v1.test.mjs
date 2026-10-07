import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('homepage command center composes verified production surfaces without replacing canonical navigation or release locks', async () => {
  const home = await read('src/pages/HomeV10.jsx');

  for (const component of [
    'CommandCenterHero',
    'CommandStats',
    'CommandShortcutRail',
    'MarketCommandGrid',
    'ZevaryqLiveStrip',
    'NetworkPulse',
    'OnChainNow',
    'VerifyAnything',
    'EcosystemRail',
    'ProductFlowRail',
  ]) {
    assert.match(home, new RegExp(component));
  }

  assert.match(home, /PRIMARY_NAV_ITEMS/);
  assert.match(home, /primaryNavTo/);
  assert.match(home, /data-command-release="phase15d"/);
  assert.match(home, /data-visual-integration="phase16c-final-command-center-v1"/);
  assert.match(home, /data-home-composition="home-live-intelligence-command-center-v1"/);
  assert.match(home, /env\(safe-area-inset-bottom/);

  const layers = [...home.matchAll(/data-command-layer="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(layers, ['market', 'intelligence', 'network', 'evidence']);
});

test('command center hero uses KriptoAman identity and verified ZEVARYQ evidence while preserving Phase 16C proof markers', async () => {
  const hero = await read('src/components/home-v10/CommandCenterHero.jsx');

  assert.match(hero, /Blockchain bergerak setiap detik/);
  assert.match(hero, /Lihat\. Pahami\. Verifikasi\./);
  assert.match(hero, /kriptoaman-mark-premium\.webp/);
  assert.match(hero, /zevaryq-mark\.svg/);
  assert.match(hero, /ZEVARYQ NETWORK · LIVE EVIDENCE/);
  assert.match(hero, /Buka Network Intelligence/);
  assert.match(hero, /DataProvenanceBar/);
  assert.match(hero, /data-phase16c-command-center="true"/);
  assert.match(hero, /Visual topology · verified core data only/);
  assert.doesNotMatch(hero, /12,845,330|342 active nodes|21 validators/i);
});

test('market and network command surfaces fail closed instead of inventing unavailable data', async () => {
  const [grid, pulse, stats] = await Promise.all([
    read('src/components/home-v10/MarketCommandGrid.jsx'),
    read('src/components/home-v10/NetworkPulse.jsx'),
    read('src/components/home-v10/CommandStats.jsx'),
  ]);

  assert.match(grid, /Tidak ada whale\/DEX event sintetis/);
  assert.match(grid, /Verified market data unavailable/);
  assert.match(grid, /text-\[8px\] font-black text-slate-300/);
  assert.doesNotMatch(grid, /text-\[8px\] font-black text-slate-500/);
  assert.match(pulse, /Mempool source/);
  assert.match(pulse, />UNAVAILABLE</);
  assert.match(pulse, /no synthetic transaction counts/);
  assert.match(stats, /data-master-kpi-count="4"/);
  assert.match(stats, /data-kpi-source-mode="verified-live-only"/);
  assert.match(stats, /ZEVARYQ head/);
  assert.match(stats, /RPC probe/);
  assert.doesNotMatch(stats, /ZVQ market/);
  assert.match(stats, /data-assets-tracked=\{metrics\.tracked/);

  const source = [grid, pulse, stats].join('\n');
  assert.doesNotMatch(source, /Whale Transfer\s+1,250|Smart Money Buy\s+420|12,845,330|99\.99%|6,825|1\.57 MB/i);
  assert.doesNotMatch(source, /fetch\s*\(/);
});

test('homepage command center remains presentation-only', async () => {
  const source = [
    await read('src/pages/HomeV10.jsx'),
    await read('src/components/home-v10/CommandCenterHero.jsx'),
    await read('src/components/home-v10/CommandStats.jsx'),
    await read('src/components/home-v10/CommandShortcutRail.jsx'),
    await read('src/components/home-v10/MarketCommandGrid.jsx'),
    await read('src/components/home-v10/NetworkPulse.jsx'),
    await read('src/components/home-v10/EcosystemRail.jsx'),
  ].join('\n');

  assert.doesNotMatch(source, /eth_sendRawTransaction|eth_sendTransaction|private.?key|validator.?key|genesis|transaction broadcast|wallet broadcasting/i);
  assert.doesNotMatch(source, /rpc\.kriptoaman\.com[^'"]*fetch|fetch\([^)]*rpc\.kriptoaman\.com/i);
});


test('mobile header search and alert controls cannot shrink below 44px targets', async () => {
  const home = await read('src/pages/HomeV10.jsx');
  assert.match(home, /h-11 min-h-11 w-11 min-w-11 shrink-0[^"]+lg:hidden/);
  assert.match(home, /h-11 min-h-11 w-11 min-w-11 shrink-0[^"]+text-slate-400/);
});
