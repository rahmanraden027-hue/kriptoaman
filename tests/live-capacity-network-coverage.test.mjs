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

test('public landing uses internal live health results for asset and network counts', async () => {
  const [page, body] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingBody.jsx'),
  ]);
  assert.match(page, /\/api\/market-snapshot\?health=1/);
  assert.match(page, /\/api\/network-health/);
  assert.match(page, /assetCount/);
  assert.match(page, /networkActiveCount/);
  assert.match(body, /Cakupan Aset Pasar/);
  assert.match(body, /assetCountValue/);
  assert.match(body, /Jaringan Terverifikasi Live/);
  assert.match(body, /Aktif · Live/);
  assert.doesNotMatch(body, /value: '2\.000\+'/);
});
