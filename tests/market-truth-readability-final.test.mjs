import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('market snapshot sources never masquerade as a live market feed', async () => {
  const [state, surface, ticker, marketPage] = await Promise.all([
    read('src/lib/dataState.js'),
    read('src/hooks/useMarketSurface.js'),
    read('src/components/home-v10/LiveMarketTicker.jsx'),
    read('src/pages/Market.jsx'),
  ]);

  assert.match(state, /export function marketSnapshotState/);
  assert.match(state, /if \(isStale\) return DATA_STATE\.DELAYED/);
  assert.match(state, /return DATA_STATE\.SNAPSHOT/);

  assert.match(surface, /marketSnapshotState/);
  assert.match(surface, /truthMode: 'snapshot'/);
  assert.match(surface, /KriptoAman Market DB · Snapshot/);
  assert.doesNotMatch(surface, /raw\.source === 'kriptoaman-market-db'[^\n]+DATA_STATE\.LIVE/);

  assert.match(ticker, /aria-label="Market ticker"/);
  assert.match(ticker, /data-market-truth-state=\{state\}/);
  assert.doesNotMatch(ticker, /aria-label="Live market ticker"/);

  assert.match(marketPage, /data-market-snapshot-state=\{marketState\}/);
  assert.match(marketPage, /data-market-hot-feed-state=\{hotFeedState\}/);
  assert.match(marketPage, /data-market-truth-mode="snapshot-plus-scoped-hot-feed-v1"/);
  assert.match(marketPage, /KriptoAman Market DB · Snapshot/);
  assert.match(marketPage, /Hot Feed · LIVE/);
  assert.match(marketPage, /connected \? 'HYBRID' : marketState/);
});

test('asset catalog state is separated from market price freshness', async () => {
  const [surface, stats] = await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/components/home-v10/CommandStats.jsx'),
  ]);

  assert.match(surface, /const catalogState = trackedAssetCount > 0/);
  assert.match(surface, /DATA_STATE\.INDEXED/);
  assert.match(surface, /catalogState,/);
  assert.match(surface, /priceState: state/);

  assert.match(stats, /const catalogState = market\?\.catalogState/);
  assert.match(stats, /CATALOG ·/);
  assert.match(stats, /data-kpi-source-mode="truth-scoped-v2"/);
  assert.match(stats, /data-market-catalog-state=\{catalogState\}/);
  assert.match(stats, /data-market-price-state=\{marketState\}/);
});

test('market intelligence labels reflect snapshot freshness instead of moving-now copy', async () => {
  const grid = await read('src/components/home-v10/MarketCommandGrid.jsx');

  assert.match(grid, /marketState === DATA_STATE\.LIVE/);
  assert.match(grid, /'MOVING NOW'/);
  assert.match(grid, /marketState === DATA_STATE\.SNAPSHOT/);
  assert.match(grid, /'MARKET SNAPSHOT'/);
  assert.match(grid, /marketState === DATA_STATE\.DELAYED/);
  assert.match(grid, /'DELAYED MARKET VIEW'/);
  assert.match(grid, /kicker=\{featured \? featuredKicker/);
});

test('micro readability polish is locked without changing the globe signature', async () => {
  const [home, provenance, network, hero] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/DataProvenanceBar.jsx'),
    read('src/pages/ZEVARYQ.jsx'),
    read('src/components/home-v10/CommandCenterHero.jsx'),
  ]);

  assert.match(home, /data-market-truth-unification="snapshot-scoped-v1"/);
  assert.match(home, /data-readability-polish="micro-v2"/);

  assert.match(provenance, /data-trust-signal="readable-v2"/);
  assert.match(provenance, /data-readability-polish="micro-v2"/);
  assert.match(provenance, /text-\[10px\]/);
  assert.match(provenance, /sm:text-\[9px\]/);

  assert.match(network, /data-readability-polish="micro-v2"/);
  assert.match(network, /data-network-inspection-globe="signature-v1"/);

  assert.match(hero, /data-visual-master-globe="signature-v1"/);
  assert.match(hero, /Lihat Pasar\. Pahami Jaringan\./);
  assert.match(hero, /provenance dan freshness yang jelas/);
});

test('production browser proof explicitly rejects LIVE for the snapshot-backed homepage ticker', async () => {
  const [proof, provenanceWorkflow] = await Promise.all([
    read('scripts/verify-home-v10-production.mjs'),
    read('.github/workflows/production-presentation-provenance.yml'),
  ]);

  assert.match(proof, /section\[aria-label="Market ticker"\]/);
  assert.match(proof, /SNAPSHOT\|DELAYED/);
  assert.match(proof, /snapshot-backed market ticker must not claim LIVE/);
  assert.match(proof, /MARKET_TRUTH_MARKER = 'snapshot-scoped-v1'/);
  assert.match(proof, /READABILITY_MARKER = 'micro-v2'/);

  assert.match(provenanceWorkflow, /data-market-truth-unification/);
  assert.match(provenanceWorkflow, /snapshot-scoped-v1/);
  assert.match(provenanceWorkflow, /data-readability-polish/);
  assert.match(provenanceWorkflow, /micro-v2/);
  assert.match(provenanceWorkflow, /MARKET SNAPSHOT/);
});

test('final market truth polish remains presentation-only', async () => {
  const source = [
    await read('src/hooks/useMarketSurface.js'),
    await read('src/components/home-v10/CommandStats.jsx'),
    await read('src/components/home-v10/LiveMarketTicker.jsx'),
    await read('src/components/home-v10/DataProvenanceBar.jsx'),
    await read('src/components/home-v10/MarketCommandGrid.jsx'),
    await read('src/components/home-v10/CommandCenterHero.jsx'),
    await read('src/pages/Market.jsx'),
    await read('src/pages/ZEVARYQ.jsx'),
  ].join('\n');

  assert.doesNotMatch(source, /eth_sendRawTransaction|eth_sendTransaction|personal_|private.?key|validator.?key|genesis/i);
});
