import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('network health probes a broad multi-chain set and reports live status only', async () => {
  const health = await read('functions/api/network-health.js');
  for (const network of [
    'Bitcoin', 'Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum', 'Optimism', 'Base',
    'Avalanche', 'Gnosis', 'Celo', 'Linea', 'Scroll', 'Mantle', 'Solana', 'TRON',
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
  assert.match(health, /const SNAPSHOT_TTL_MS = 45_000/);
  assert.match(health, /const LAST_GOOD_TTL_MS = 10 \* 60 \* 1000/);
  assert.match(health, /let refreshInFlight = null/);
  assert.match(health, /const lastGoodByNetwork = new Map\(\)/);
  assert.match(health, /lastKnownGoodNeverCountsAsOnline: true/);
  assert.match(health, /liveOnlineRequiresSuccessfulCurrentProbe: true/);
  assert.match(health, /globalThis\.caches\?\.default/);
  assert.match(health, /searchParams\.get\('refresh'\) === '1'/);
});

test('Base health check has an independent third provider for rate-limit recovery', async () => {
  const health = await read('functions/api/network-health.js');
  const baseConfig = health.match(/name: 'Base'[\s\S]*?\n\s*},/i)?.[0] || '';
  assert.ok(baseConfig.includes("'https://mainnet.base.org'"));
  assert.ok(baseConfig.includes("'https://base-rpc.publicnode.com'"));
  assert.ok(baseConfig.includes("'https://base-mainnet.public.blastapi.io'"));
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

test('platform status gives the network probe enough time and enforces its published minimum', async () => {
  const platform = await read('functions/api/platform-status.js');
  assert.match(platform, /const NETWORK_HEALTH_TIMEOUT_MS = 5000/);
  assert.match(platform, /readJson\(`\$\{origin\}\/api\/network-health`, NETWORK_HEALTH_TIMEOUT_MS\)/);
  assert.match(platform, /networkOnline >= networkMinimumTarget/);
  assert.match(platform, /networkHealthyRequiresMinimumTarget: true/);
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
