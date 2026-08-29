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
  assert.match(health, /status: 'offline'/);
  assert.match(health, /minimum_active_target: 12/);
  assert.doesNotMatch(health, /Math\.random/);
});

test('Base health check has an independent third provider for rate-limit recovery', async () => {
  const health = await read('functions/api/network-health.js');
  const baseConfig = health.match(/name: 'Base'[\s\S]*?\n\s*},/i)?.[0] || '';
  assert.ok(baseConfig.includes("'https://mainnet.base.org'"));
  assert.ok(baseConfig.includes("'https://base-rpc.publicnode.com'"));
  assert.ok(baseConfig.includes("'https://base-mainnet.public.blastapi.io'"));
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
