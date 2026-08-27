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

test('public landing uses internal live health results for asset and network counts', async () => {
  const [page, body] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingBody.jsx'),
  ]);
  assert.match(page, /\/api\/market-snapshot\?health=1/);
  assert.match(page, /\/api\/network-health/);
  assert.match(page, /\/api\/kam\/network-status/);
  assert.match(page, /payload\?\.verified === true/);
  assert.match(page, /Number\(payload\?\.chainId\) === 22028/);
  assert.match(page, /name: 'KAM Network'/);
  assert.match(page, /verification: 'rpc-chain-id'/);
  assert.match(page, /KAM is additive only/);
  assert.match(page, /assetCount/);
  assert.match(page, /networkActiveCount/);
  assert.match(body, /Cakupan Aset Pasar/);
  assert.match(body, /assetCountValue/);
  assert.match(body, /Jaringan Terverifikasi Live/);
  assert.match(body, /Aktif · Live/);
  assert.doesNotMatch(body, /value: '2\.000\+'/);
});
