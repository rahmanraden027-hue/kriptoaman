import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const original = await readFile(new URL('../src/services/zevaryqNetwork.js', import.meta.url), 'utf8');
const wallet = await readFile(new URL('../src/pages/Wallet.jsx', import.meta.url), 'utf8');

function loadService(mockFetch) {
  const source = original
    .replace("import { ZEVARYQ } from '@/theme/zevaryqWallet';",
      "const ZEVARYQ = { chainId: 22028, chainIdHex: '0x560c', rpc: 'https://rpc.kriptoaman.com', explorer: 'https://explorer.kriptoaman.com' };")
    .replaceAll('export async function', 'async function') +
    '\nglobalThis.service = { fetchZevaryqNetworkStatus, fetchZvqBalance };';
  const context = {
    fetch: mockFetch,
    window: { setTimeout, clearTimeout },
    AbortController,
    performance,
  };
  vm.runInNewContext(source, context, { filename: 'zevaryqNetwork.js' });
  return context.service;
}

const goodStatus = (wallet = undefined) => ({
  live: true, verified: true, chainIdHex: '0x560c', blockNumber: 147343, wallet,
});

const json = (payload, status = 200) => Response.json(payload, { status });

test('Wallet uses verified same-origin status when browser RPC preflight is blocked', async () => {
  const requests = [];
  const api = loadService(async (url, options) => {
    requests.push([url, options.method || 'GET']);
    if (url === '/api/kam/network-status') return json(goodStatus());
    if (url === 'https://explorer.kriptoaman.com/api/v2/blocks') return json({ items: [{ height: 147343 }] });
    throw new Error('Unexpected cross-origin JSON-RPC call');
  });
  const state = await api.fetchZevaryqNetworkStatus();
  assert.equal(state.rpc, 'connected');
  assert.equal(state.explorer, 'connected');
  assert.equal(state.blockNumber, 147343);
  assert.equal(state.sync, 'unknown'); // Do not invent sync status.
  assert.equal(requests.some(([url]) => url === 'https://rpc.kriptoaman.com'), false);
});

test('Explorer can be connected when both browser RPC and same-origin status fail', async () => {
  const api = loadService(async (url) => {
    if (url === 'https://explorer.kriptoaman.com/api/v2/blocks') return json({ items: [{ height: 147343 }] });
    if (url === '/api/kam/network-status') return json({ live: false, verified: false, blockNumber: null });
    throw new TypeError('Failed to fetch: preflight forbidden');
  });
  const state = await api.fetchZevaryqNetworkStatus();
  assert.equal(state.rpc, 'error');
  assert.equal(state.explorer, 'connected');
  assert.equal(state.blockNumber, null);
  assert.equal(state.latency, null);
});

test('Unverified chain identity never becomes connected through direct RPC fallback', async () => {
  const api = loadService(async (url, options = {}) => {
    if (url === '/api/kam/network-status') return json({ live: false, verified: false });
    if (url === 'https://explorer.kriptoaman.com/api/v2/blocks') return json({ items: [{ height: 147343 }] });
    if (url === 'https://rpc.kriptoaman.com') {
      const method = JSON.parse(options.body).method;
      return json({ jsonrpc: '2.0', result: method === 'eth_chainId' ? '0x1' : method === 'eth_blockNumber' ? '0x23f8f' : false });
    }
    throw new Error('Unexpected URL');
  });
  const state = await api.fetchZevaryqNetworkStatus();
  assert.equal(state.rpc, 'error');
  assert.equal(state.blockNumber, null);
  assert.equal(state.explorer, 'connected');
});

test('Verified server status with Explorer outage is degraded, not a false total outage', async () => {
  const api = loadService(async (url) => {
    if (url === '/api/kam/network-status') return json(goodStatus());
    throw new Error('Explorer unavailable');
  });
  const state = await api.fetchZevaryqNetworkStatus();
  assert.equal(state.rpc, 'connected');
  assert.equal(state.explorer, 'error');
  assert.match(state.error, /Explorer API/);
});

test('Balance uses verified address-specific same-origin status; failed probes reject', async () => {
  const address = '0x1234567890123456789012345678901234567890';
  const api = loadService(async (url) => {
    if (url.startsWith('/api/kam/network-status?address=')) {
      return json(goodStatus({ address, balanceKAM: '0' }));
    }
    throw new Error('Unexpected direct RPC request');
  });
  assert.equal(await api.fetchZvqBalance(address), '0');
  await assert.rejects(() => api.fetchZvqBalance('0xinvalid'), /Invalid EVM address/);

  const offline = loadService(async () => { throw new Error('Unavailable'); });
  await assert.rejects(() => offline.fetchZvqBalance(address), /Unavailable/);
});

test('Failed wallet balance probe cannot display stale previous wallet assets', () => {
  assert.match(wallet, /setBalance\('0'\);setBalancePhase\('loading'\)/);
  assert.match(wallet, /balancePhase === 'error'\) \? '—' :/);
});
