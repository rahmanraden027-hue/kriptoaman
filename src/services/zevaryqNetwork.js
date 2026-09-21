import { ZEVARYQ } from '@/theme/zevaryqWallet';

const TIMEOUT_MS = 8_000;

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try { return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' }); }
  finally { window.clearTimeout(timer); }
}

async function rpc(method, params = []) {
  const started = performance.now();
  const response = await timedFetch(ZEVARYQ.rpc, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'RPC request failed');
  return { result: data.result, latency: Math.round(performance.now() - started) };
}

export async function fetchZevaryqNetworkStatus() {
  const checkedAt = new Date();
  const base = { checkedAt, rpc: 'error', explorer: 'error', sync: 'unknown', blockNumber: null, latency: null, error: '' };
  const [chain, block, syncing, explorer] = await Promise.allSettled([
    rpc('eth_chainId'), rpc('eth_blockNumber'), rpc('eth_syncing'),
    timedFetch(`${ZEVARYQ.explorer}/api/v2/blocks`, { headers: { Accept: 'application/json' } }),
  ]);
  if (chain.status !== 'fulfilled' || Number.parseInt(chain.value.result, 16) !== ZEVARYQ.chainId) {
    return { ...base, error: chain.status === 'rejected' ? chain.reason.message : 'Unexpected chain ID' };
  }
  return {
    ...base,
    rpc: block.status === 'fulfilled' ? 'connected' : 'degraded',
    explorer: explorer.status === 'fulfilled' && explorer.value.ok ? 'connected' : 'error',
    sync: syncing.status === 'fulfilled' ? (syncing.value.result === false ? 'synced' : 'syncing') : 'unknown',
    blockNumber: block.status === 'fulfilled' ? Number.parseInt(block.value.result, 16) : null,
    latency: chain.value.latency,
    error: block.status === 'rejected' ? block.reason.message : '',
  };
}

export async function fetchZvqBalance(address) {
  if (!address) return null;
  const { result } = await rpc('eth_getBalance', [address, 'latest']);
  return (BigInt(result) / 10n ** 10n).toString().replace(/(\d{8})$/, '.$1').replace(/\.?0+$/, '');
}
