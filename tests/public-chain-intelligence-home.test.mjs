import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing promotes verified Live Block Flow instead of placeholder-heavy Chain Intelligence', async () => {
  const [page, deferred, surface] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingDeferredContent.jsx'),
    read('src/components/landing/PublicChainIntelligence.jsx'),
  ]);
  assert.match(page, /<GLandingHero stats=\{stats\} visualReady=\{heroVisualReady\} \/>/);
  assert.match(page, /<GLandingDeferredContent stats=\{stats\} \/>/);
  assert.match(deferred, /<LiveBlockFlow3D/);
  assert.match(deferred, /compactLanding/);
  assert.doesNotMatch(page, /<PublicChainIntelligence \/>/);
  assert.doesNotMatch(deferred, /<PublicChainIntelligence \/>/);
  assert.match(surface, /CHAIN INTELLIGENCE OS/);
  assert.match(surface, /Universal Intelligence Search/);
  assert.match(surface, /GENESIS RADAR/);
  assert.match(surface, /INTELLIGENCE GRAPH/);
  assert.match(surface, /PROOF ENGINE/);
});

test('public intelligence uses only first-party evidence-gated endpoints and fails closed', async () => {
  const surface = await read('src/components/landing/PublicChainIntelligence.jsx');
  assert.match(surface, /\/api\/intelligence-graph/);
  assert.match(surface, /\/api\/zvq-first-party-discovery/);
  assert.match(surface, /Number\(p\?\.chainId\) === 22028/);
  assert.match(surface, /UNAVAILABLE/);
  assert.match(surface, /INTELLIGENCE GRAPH/);
  assert.match(surface, /TRUTH POLICY/);
  assert.match(surface, /Unavailable is never converted to zero/);
  assert.match(surface, /graph\?\.graph\?\.nodes/);
  assert.match(surface, /graph\?\.graph\?\.edges/);
  assert.match(surface, /const graphLines = useMemo/);
  assert.match(surface, /dot\.ids\.includes\(edge\?\.from\)/);
  assert.match(surface, /dot\.ids\.includes\(edge\?\.to\)/);
  assert.doesNotMatch(surface, /graphDots\.slice\(i\+1\)/);
  assert.match(surface, /discovery\?\.observation\?\.contractCreations/);
  assert.match(surface, /\/asset-passport\/\$\{value\}/);
  assert.doesNotMatch(surface, /coingecko|coinmarketcap|dexscreener|birdeye/i);
  assert.doesNotMatch(surface, /eth_sendTransaction|eth_sendRawTransaction|privateKey|mnemonic|seed phrase/i);
});

test('final public hero presents the evidence-first intelligence identity', async () => {
  const [hero, console] = await Promise.all([
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
  ]);
  assert.match(hero, /KRIPTOAMAN INTELLIGENCE · VERIFIED DATA/);
  assert.match(hero, /ka-command-hero/);
  assert.match(hero, /Data produksi, langsung terlihat/);
  assert.match(hero, /Market · On-chain · Network · Evidence/);
  assert.match(hero, /Open Workspace/);
  assert.doesNotMatch(hero, /MARKET ASSETS/);
  assert.doesNotMatch(hero, /ZVQ BLOCK/);
  assert.doesNotMatch(hero, /VERIFIED NETWORKS/);
  assert.doesNotMatch(hero, /CHAIN \/ RPC/);
  assert.doesNotMatch(hero, /const PURPOSE/);
  assert.match(console, /PRODUCTION COMMAND CENTER/);
  assert.match(console, /PROOF OF FRESHNESS/);
  assert.match(console, /assetCount/);
  assert.match(console, /zvqBlockNumber/);
});

test('Intelligence Graph 2.0 exposes only selectable proven nodes and edges through Evidence Drawer', async () => {
  const surface = await read('src/components/landing/PublicChainIntelligence.jsx');
  assert.match(surface, /BLOCK:\[50,14\]/);
  assert.match(surface, /Evidence Drawer/);
  assert.match(surface, /selectNode/);
  assert.match(surface, /selectEdge/);
  assert.match(surface, /Only API-proven evidence is shown/);
  assert.match(surface, /Missing fields remain UNAVAILABLE/);
  assert.match(surface, /line\.edge/);
  assert.match(surface, /graphLines\.map\(line/);
  assert.doesNotMatch(surface, /graphDots\.slice\(i\+1\)/);
});

test('Live Intelligence Stream is first-party, complete-proof gated, and never synthetic', async () => {
  const surface = await read('src/components/landing/PublicChainIntelligence.jsx');
  assert.match(surface, /LIVE INTELLIGENCE STREAM/);
  assert.match(surface, /\['TRANSACTION', 'CONTRACT', 'TOKEN'\]\.includes/);
  assert.match(surface, /node\?\.evidence\?\.source === 'first-party'/);
  assert.match(surface, /Number\.isSafeInteger\(Number\(node\?\.evidence\?\.blockNumber\)\)/);
  assert.match(surface, /node\?\.evidence\?\.blockHash/);
  assert.match(surface, /node\?\.evidence\?\.transactionHash/);
  assert.match(surface, /No API-proven stream evidence is available\. No synthetic activity is generated\./);
  assert.match(surface, /const evidenceObservedAt = evidence\?\.observedAt \?\? null/);
  assert.match(surface, /evidence\.observationId \? short\(evidence\.observationId\) : unavailable/);
  assert.doesNotMatch(surface, /evidence\?\.observedAt \?\? graph\?\.observedAt/);
  assert.doesNotMatch(surface, /evidence\.observationId \|\| graph\?\.observationId/);
  assert.doesNotMatch(surface, /Math\.random\(/);
});

test('mobile Chain Intelligence keeps pulse compact and graph legible', async () => {
  const surface = await read('src/components/landing/PublicChainIntelligence.jsx');
  assert.match(surface, /ka-intel-engine-pulse/);
  assert.match(surface, /ka-intel-engine-graph/);
  assert.match(surface, /max-width: 639px/);
  assert.match(surface, /ka-production-pulse/);
  assert.match(surface, /headHistory/);
  assert.match(surface, /pulsePoints/);
  assert.match(surface, /Verified block head progression/);
  assert.doesNotMatch(surface, /Math\.random\(/);
  assert.match(surface, /ka-graph-map/);
});
