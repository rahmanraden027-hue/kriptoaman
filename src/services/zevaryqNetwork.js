import { ZEVARYQ } from '@/theme/zevaryqWallet';

const TIMEOUT_MS = 8_000;
const AUX_TIMEOUT_MS = 6_000;
const PUBLIC_STATUS_PATH = '/api/kam/network-status';
const FIRST_PARTY_DISCOVERY_PATH = '/api/zvq-first-party-discovery';
const TOKEN_INTELLIGENCE_PATH = '/api/zvq-token-intelligence';
const PLATFORM_STATUS_PATH = '/api/platform-status';
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

async function timedFetch(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' }); }
  finally { window.clearTimeout(timer); }
}

async function readJson(url, label, timeoutMs = AUX_TIMEOUT_MS) {
  const response = await timedFetch(url, { headers: { Accept: 'application/json' } }, timeoutMs);
  if (!response.ok) throw new Error(label + ' HTTP ' + response.status);
  return response.json();
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

async function verifiedFirstPartyDiscovery() {
  const data = await readJson(FIRST_PARTY_DISCOVERY_PATH, 'First-party discovery');
  const head = Number(data?.head?.number);
  if (data?.status !== 'live' || Number(data?.chainId) !== ZEVARYQ.chainId ||
      !Number.isSafeInteger(head) || head < 0) {
    throw new Error('First-party discovery is not currently verified');
  }
  return data;
}

async function verifiedTokenIntelligence() {
  const data = await readJson(TOKEN_INTELLIGENCE_PATH, 'Token intelligence');
  const head = Number(data?.head?.number);
  if (data?.status !== 'live' || Number(data?.chainId) !== ZEVARYQ.chainId ||
      !Number.isSafeInteger(head) || head < 0) {
    throw new Error('Token intelligence is not currently verified');
  }
  return data;
}

async function verifiedPlatformStatus() {
  const data = await readJson(PLATFORM_STATUS_PATH, 'Platform status');
  if (!['operational', 'degraded'].includes(data?.overall) ||
      Number(data?.components?.kam?.chainId) !== ZEVARYQ.chainId) {
    throw new Error('Platform status is not currently verified');
  }
  return data;
}

function settledReason(result, fallback) {
  if (result.status === 'fulfilled') return '';
  const message = result.reason?.message;
  return message && typeof message === 'string' ? message : fallback;
}

function buildSourceTelemetry(discovery, intelligence, platform) {
  const discoveryValue = discovery.status === 'fulfilled' ? discovery.value : null;
  const intelligenceValue = intelligence.status === 'fulfilled' ? intelligence.value : null;
  const platformValue = platform.status === 'fulfilled' ? platform.value : null;
  const sourceMode = String(intelligenceValue?.sourceMode || '').toLowerCase();
  const streamState = sourceMode.includes('websocket')
    ? 'connected'
    : sourceMode.includes('json-rpc') || sourceMode.includes('poll')
      ? 'fallback'
      : intelligenceValue
        ? 'unknown'
        : 'error';

  return {
    discovery: {
      state: discoveryValue ? 'connected' : 'error',
      head: Number.isSafeInteger(Number(discoveryValue?.head?.number)) ? Number(discoveryValue.head.number) : null,
      transport: discoveryValue?.provenance?.transport || null,
      latencyMs: Number.isFinite(Number(discoveryValue?.latencyMs)) ? Number(discoveryValue.latencyMs) : null,
      error: settledReason(discovery, 'First-party discovery unavailable'),
    },
    tokenIntelligence: {
      state: intelligenceValue ? 'connected' : 'error',
      head: Number.isSafeInteger(Number(intelligenceValue?.head?.number)) ? Number(intelligenceValue.head.number) : null,
      sourceMode: intelligenceValue?.sourceMode || null,
      streamState,
      scannedBlocks: Number.isFinite(Number(intelligenceValue?.radar?.scannedBlocks)) ? Number(intelligenceValue.radar.scannedBlocks) : null,
      tokenMetadataProven: Number.isFinite(Number(intelligenceValue?.radar?.tokenMetadataProven)) ? Number(intelligenceValue.radar.tokenMetadataProven) : null,
      latencyMs: Number.isFinite(Number(intelligenceValue?.latencyMs)) ? Number(intelligenceValue.latencyMs) : null,
      error: settledReason(intelligence, 'Token intelligence unavailable'),
    },
    platform: {
      state: platformValue?.overall || 'error',
      networksOnline: Number.isFinite(Number(platformValue?.components?.networks?.online)) ? Number(platformValue.components.networks.online) : null,
      networksTotal: Number.isFinite(Number(platformValue?.components?.networks?.total)) ? Number(platformValue.components.networks.total) : null,
      checkedAt: platformValue?.generatedAt || null,
      error: settledReason(platform, 'Platform status unavailable'),
    },
  };
}

export async function fetchZevaryqNetworkStatus() {
  const checkedAt = new Date();
  const started = performance.now();
  const base = {
    checkedAt,
    rpc: 'error',
    explorer: 'error',
    sync: 'unknown',
    blockNumber: null,
    latency: null,
    error: '',
    sources: {
      discovery: { state: 'error', head: null, transport: null, latencyMs: null, error: '' },
      tokenIntelligence: { state: 'error', head: null, sourceMode: null, streamState: 'error', scannedBlocks: null, tokenMetadataProven: null, latencyMs: null, error: '' },
      platform: { state: 'error', networksOnline: null, networksTotal: null, checkedAt: null, error: '' },
    },
  };

  // The wallet reads only public/read-only service surfaces. Validator, admin,
  // signer and private-key interfaces are intentionally never connected here.
  const [server, explorer, discovery, intelligence, platform] = await Promise.allSettled([
    verifiedSameOriginStatus(),
    verifiedExplorerBlocks(),
    verifiedFirstPartyDiscovery(),
    verifiedTokenIntelligence(),
    verifiedPlatformStatus(),
  ]);

  const sources = buildSourceTelemetry(discovery, intelligence, platform);
  const explorerStatus = explorer.status === 'fulfilled' ? 'connected' : 'error';
  const errors = [
    explorerStatus === 'error' ? 'Explorer API unavailable from this device' : '',
    sources.discovery.error,
    sources.tokenIntelligence.error,
    sources.platform.error,
  ].filter(Boolean);

  if (server.status === 'fulfilled') {
    return {
      ...base,
      sources,
      rpc: 'connected',
      explorer: explorerStatus,
      sync: server.value.syncStatus === 'synced' || server.value.syncStatus === 'syncing'
        ? server.value.syncStatus
        : 'unknown',
      blockNumber: server.value.blockNumber,
      latency: Math.round(performance.now() - started),
      error: errors.join('; '),
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
  const rpcError = rpcOK ? '' : (server.reason?.message || 'Network could not be independently verified');

  return {
    ...base,
    sources,
    rpc: rpcOK ? 'connected' : 'error',
    explorer: explorerStatus,
    sync: rpcOK && syncing.status === 'fulfilled'
      ? (syncing.value.result === false ? 'synced' : 'syncing')
      : 'unknown',
    blockNumber: rpcOK ? blockNumber : null,
    latency: rpcOK ? chain.value.latency : null,
    error: [rpcError, ...errors].filter(Boolean).join('; '),
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
