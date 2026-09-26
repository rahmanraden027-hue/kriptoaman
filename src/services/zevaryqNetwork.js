import { ZEVARYQ } from '@/theme/zevaryqWallet';

const TIMEOUT_MS = 8_000;
const PUBLIC_STATUS_PATH = '/api/kam/network-status';
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

async function timedFetch(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' }); }
  finally { window.clearTimeout(timer); }
}

// Direct RPC remains a fallback for browsers where the public gateway permits
// the JSON-RPC OPTIONS preflight. The verified same-origin status is primary
// because edge rules can block cross-origin preflight even when POST works.
async function rpc(method, params = []) {
  const started = performance.now();
  const response = await timedFetch(ZEVARYQ.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  }, 4_000);
  if (!response.ok) throw new Error('RPC HTTP ' + response.status);
  const data = await response.json();
  if (data.error || typeof data.result === 'undefined') throw new Error(data.error?.message || 'Invalid RPC response');
  return { result: data.result, latency: Math.round(performance.now() - started) };
}

async function verifiedSameOriginStatus(address = null) {
  const path = PUBLIC_STATUS_PATH + (address ? '?address=' + encodeURIComponent(address) : '');
  const response = await timedFetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Network status HTTP ' + response.status);
  const data = await response.json();
  if (data?.live !== true || data?.verified !== true ||
      String(data.chainIdHex).toLowerCase() !== ZEVARYQ.chainIdHex ||
      !Number.isSafeInteger(data.blockNumber) || data.blockNumber < 0) {
    throw new Error('Public network status is not currently verified');
  }
  return data;
}

async function verifiedExplorerBlocks() {
  const response = await timedFetch(ZEVARYQ.explorer + '/api/v2/blocks', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Explorer API HTTP ' + response.status);
  const data = await response.json();
  if (!Array.isArray(data?.items) || data.items.length === 0) {
    throw new Error('Explorer returned no verified blocks');
  }
  return data;
}

export async function fetchZevaryqNetworkStatus() {
  const checkedAt = new Date();
  const started = performance.now();
  const base = { checkedAt, rpc: 'error', explorer: 'error', sync: 'unknown', blockNumber: null, latency: null, error: '' };

  // An Explorer success must remain visible when only browser RPC fails.
  const [server, explorer] = await Promise.allSettled([
    verifiedSameOriginStatus(),
    verifiedExplorerBlocks(),
  ]);
  const explorerStatus = explorer.status === 'fulfilled' ? 'connected' : 'error';
  const explorerError = explorerStatus === 'error' ? 'Explorer API unavailable from this device' : '';

  if (server.status === 'fulfilled') {
    return {
      ...base,
      rpc: 'connected',
      explorer: explorerStatus,
      sync: 'unknown', // The server verifies chain identity and block, not eth_syncing.
      blockNumber: server.value.blockNumber,
      latency: Math.round(performance.now() - started),
      error: explorerError,
    };
  }

  // Fail closed if the same-origin server is degraded. A direct RPC fallback
  // only reports "connected" after independently verifying identity and head.
  const [chain, head, syncing] = await Promise.allSettled([
    rpc('eth_chainId'),
    rpc('eth_blockNumber'),
    rpc('eth_syncing'),
  ]);
  const chainOK = chain.status === 'fulfilled' &&
    String(chain.value.result).toLowerCase() === ZEVARYQ.chainIdHex;
  const blockNumber = head.status === 'fulfilled' ? Number.parseInt(head.value.result, 16) : NaN;
  const rpcOK = chainOK && Number.isSafeInteger(blockNumber) && blockNumber >= 0;

  return {
    ...base,
    rpc: rpcOK ? 'connected' : 'error',
    explorer: explorerStatus,
    sync: rpcOK && syncing.status === 'fulfilled'
      ? (syncing.value.result === false ? 'synced' : 'syncing')
      : 'unknown',
    blockNumber: rpcOK ? blockNumber : null,
    latency: rpcOK ? chain.value.latency : null,
    error: rpcOK ? explorerError : (server.reason?.message || 'Network could not be independently verified'),
  };
}

export async function fetchZvqBalance(address) {
  if (!address) return null;
  if (!EVM_ADDRESS.test(address)) throw new Error('Invalid EVM address');
  try {
    const status = await verifiedSameOriginStatus(address);
    if (status.wallet?.address?.toLowerCase() !== address.toLowerCase() ||
        !/^\d+(?:\.\d+)?$/.test(String((status.wallet.balanceZVQ ?? status.wallet.balanceKAM)))) {
      throw new Error('Balance could not be verified');
    }
    return String((status.wallet.balanceZVQ ?? status.wallet.balanceKAM));
  } catch {
    // Never present a balance from a browser fallback without checking chain identity.
    const chain = await rpc('eth_chainId');
    if (String(chain.result).toLowerCase() !== ZEVARYQ.chainIdHex) {
      throw new Error('Balance unavailable: RPC chain ID mismatch');
    }
    const { result } = await rpc('eth_getBalance', [address, 'latest']);
    if (typeof result !== 'string' || !/^0x[0-9a-fA-F]+$/.test(result)) {
      throw new Error('Balance unavailable: malformed RPC balance');
    }
    const wei = BigInt(result);
    const whole = wei / 10n ** 18n;
    const fraction = (wei % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '');
    return fraction ? String(whole) + '.' + fraction : String(whole);
  }
}
