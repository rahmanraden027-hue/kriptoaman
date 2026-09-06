import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('network health probes a broad multi-chain set and reports live status only', async () => {
  const health = await read('functions/api/network-health.js');
  for (const network of [
    'Bitcoin', 'Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum', 'Optimism', 'Base',
    'Avalanche', 'Gnosis', 'Celo', 'Linea', 'Scroll', 'Mantle', 'Fantom', 'Solana', 'TRON',
    'XRP Ledger', 'Polkadot', 'Cardano', 'Litecoin', 'Dogecoin',
  ]) {
    assert.match(health, new RegExp(`name: '${network.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
  assert.match(health, /status: 'online'/);
  assert.match(health, /status: hasRecentLastGood \? 'degraded' : 'offline'/);
  assert.match(health, /const MIN_ACTIVE_TARGET = 12/);
  assert.match(health, /minimum_active_target: MIN_ACTIVE_TARGET/);
  assert.match(health, /meets_minimum_active_target: online >= MIN_ACTIVE_TARGET/);
  assert.doesNotMatch(health, /Math\.random/);
});

test('multi-chain probes tolerate normal public-RPC latency without fabricating online status', async () => {
  const health = await read('functions/api/network-health.js');
  assert.match(health, /const DEFAULT_PROVIDER_TIMEOUT_MS = 2500/);
  assert.match(health, /const SLOW_PROVIDER_TIMEOUT_MS = 3500/);
  assert.match(health, /const EXTENDED_PROVIDER_TIMEOUT_MS = 5000/);
  assert.match(health, /const SNAPSHOT_TTL_MS = 45_000/);
  assert.match(health, /const STALE_SNAPSHOT_MAX_AGE_MS = 5 \* 60 \* 1000/);
  assert.match(health, /const LAST_GOOD_TTL_MS = 10 \* 60 \* 1000/);
  assert.match(health, /let refreshInFlight = null/);
  assert.match(health, /const lastGoodByNetwork = new Map\(\)/);
  assert.match(health, /lastKnownGoodNeverCountsAsOnline: true/);
  assert.match(health, /liveOnlineRequiresSuccessfulCurrentProbe: true/);
  assert.match(health, /publicRequestsMayUseRecentVerifiedSnapshot: true/);
  assert.match(health, /refreshParameterAlwaysForcesFreshProbe: true/);
  assert.match(health, /globalThis\.caches\?\.default/);
  assert.match(health, /searchParams\.get\('refresh'\) === '1'/);
});

test('network health has a short cross-POP durable verified snapshot without weakening fresh probes', async () => {
  const health = await read('functions/api/network-health.js');
  assert.match(health, /import \{ primarySession, readSession \} from '\.\.\/_shared\/d1-session\.js'/);
  assert.match(health, /CREATE TABLE IF NOT EXISTS network_health_snapshots/);
  assert.match(health, /SELECT captured_at, payload FROM network_health_snapshots WHERE id = \?/);
  assert.match(health, /ageMs >= SNAPSHOT_TTL_MS/);
  assert.match(health, /snapshot\.networks\.length === NETWORKS\.length/);
  assert.match(health, /total === NETWORKS\.length/);
  assert.match(health, /target === MIN_ACTIVE_TARGET/);
  assert.match(health, /const db = primarySession\(env\.AUTH_DB\)/);
  assert.match(health, /INSERT INTO network_health_snapshots/);
  assert.match(health, /deliveryMode: 'd1-recent-verified'/);
  assert.match(health, /startRefresh\(\)\.then\(\(snapshot\) => persistDurableSnapshot\(env, snapshot\)\)/);
  assert.match(health, /forceRefresh[\s\S]*startRefresh\(\)/);
  assert.match(health, /refreshParameterAlwaysForcesFreshProbe: true/);
  assert.match(health, /durableRecentSnapshotMaxAgeMs: SNAPSHOT_TTL_MS/);
  assert.match(health, /durableSnapshotCrossPop: true/);
});

test('only current fresh probes may seed the network edge cache', async () => {
  const health = await read('functions/api/network-health.js');
  assert.match(health, /deliveryMode === 'fresh-probe'/);
  assert.match(health, /edgeCacheEligible: !forceRefresh && deliveryMode === 'fresh-probe'/);
  assert.match(health, /!forceRefresh && edgeCache && status === 200 && deliveryMode === 'fresh-probe'/);
  assert.doesNotMatch(health, /deliveryMode === 'd1-recent-verified'[\s\S]{0,180}edgeCache\.put/);
});

test('Base health check has an independent third provider for rate-limit recovery', async () => {
  const health = await read('functions/api/network-health.js');
  assert.ok(health.includes("'https://mainnet.base.org'"));
  assert.ok(health.includes("'https://base-rpc.publicnode.com'"));
  assert.ok(health.includes("'https://base-mainnet.public.blastapi.io'"));
});

test('remaining public chains have resilient provider coverage', async () => {
  const health = await read('functions/api/network-health.js');
  assert.ok(health.includes("'https://tron-evm-rpc.publicnode.com'"));
  assert.ok(health.includes("'https://honeycluster.io/'"));
  assert.ok(health.includes("'https://s2.ripple.com:51234/'"));
  assert.ok(health.includes("'https://api.koios.rest/api/v1/tip?select=block_no'"));
  assert.ok(health.includes("'https://litecoinspace.org/api/blocks/tip/height'"));
  assert.ok(health.includes("'https://ltc1.trezor.io/api/v2'"));
  assert.ok(health.includes("'https://doge1.trezor.io/api/v2'"));
  assert.ok(health.includes("'https://dogecoin.atomicwallet.io/api/v2'"));
  assert.match(health, /payload\?\.blockbook\?\.bestHeight/);
  assert.match(health, /payload\?\.backend\?\.blocks/);
});

test('live capacity gate retries fresh probes but never lowers the 12-network standard', async () => {
  const workflow = await read('.github/workflows/live-capacity-network-smoke.yml');
  assert.match(workflow, /for attempt in 1 2 3 4; do/);
  assert.match(workflow, /network-health\?refresh=1&attempt=\$\{attempt\}/);
  assert.match(workflow, /if \(target !== 12\)/);
  assert.match(workflow, /if \(online < 12\) process\.exit\(2\)/);
  assert.match(workflow, /remained below 12 verified networks after four fresh probes/);
  assert.doesNotMatch(workflow, /online < (?:[0-9]|1[01])\b/);
});

test('platform status enforces the 12-network minimum under a bounded aggregate latency budget', async () => {
  const platform = await read('functions/api/platform-status.js');
  assert.match(platform, /const COMPONENT_STATUS_TIMEOUT_MS = 700/);
  assert.match(platform, /readJson\(`\$\{origin\}\/api\/network-health`\)/);
  assert.match(platform, /networkOnline >= networkMinimumTarget/);
  assert.match(platform, /networkHealthyRequiresMinimumTarget: true/);
  assert.match(platform, /componentTimeoutDegradesRatherThanFabricates: true/);
  assert.match(platform, /readError: networks\.ok \? null : networks\.error/);
});

test('public landing uses the stable platform health contract for asset and network counts', async () => {
  const [page, body, platform] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingBody.jsx'),
    read('functions/api/platform-status.js'),
  ]);
  assert.match(page, /\/api\/platform-status/);
  assert.match(page, /\/api\/network-health/);
  assert.match(page, /platformPayload\.components\.market/);
  assert.match(page, /platformPayload\.components\.networks/);
  assert.match(page, /platformPayload\.components\.kam/);
  assert.match(page, /Number\(kam\.chainId\) === 22028/);
  assert.match(page, /name: 'KAM Network'/);
  assert.match(page, /verification: 'platform-status'/);
  assert.match(page, /kam\?\.status === 'operational'/);
  assert.match(page, /assetCount/);
  assert.match(page, /networkActiveCount/);
  assert.match(platform, /\/api\/market-snapshot\?health=1/);
  assert.match(platform, /\/api\/network-health/);
  assert.match(platform, /\/api\/kam\/network-status/);
  assert.match(platform, /fabricatedMetrics: false/);
  assert.match(body, /Cakupan Aset Pasar/);
  assert.match(body, /assetCountValue/);
  assert.match(body, /Jaringan Terverifikasi Live/);
  assert.match(body, /Aktif · Live/);
  assert.doesNotMatch(body, /value: '2\.000\+'/);
});
