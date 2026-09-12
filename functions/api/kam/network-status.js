import { json } from '../../../server/auth/http.js';

const EXPECTED_CHAIN_ID = 22028;
const EXPECTED_CHAIN_ID_HEX = '0x560c';
const RPC_URL = 'https://rpc.kriptoaman.com';
const EXPLORER_URL = 'https://explorer.kriptoaman.com';
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const NETWORK_PROBE_TIMEOUT_MS = 1100;
const WALLET_PROBE_TIMEOUT_MS = 1800;
const VERIFIED_PUBLIC_STATUS_CACHE = 'public, max-age=5, s-maxage=20, stale-while-revalidate=40';
const DEGRADED_PUBLIC_STATUS_CACHE = 'public, max-age=10, s-maxage=60, stale-while-revalidate=120';

const KAM_INDICATIVE_LISTING_REFERENCE = Object.freeze({
  value: 29.37,
  currency: 'USD',
  type: 'internal-scenario-estimate',
  label: 'Indicative Scenario Reference',
  isLiveMarketPrice: false,
  disclaimer: 'Internal scenario reference only. Not a live market price, official listing price, guaranteed value, offer, target return, or valuation. Any future market price must come from actual trading and liquidity.',
});

async function rpc(method, params = [], signal) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
    signal,
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.error || payload?.result == null) throw new Error(payload?.error?.message || 'Invalid RPC response');
  return payload.result;
}

async function rpcWithTimeout(method, params = [], timeoutMs = NETWORK_PROBE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await rpc(method, params, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

function formatKam(hexValue) {
  const value = BigInt(hexValue);
  const whole = value / 10n ** 18n;
  const fraction = (value % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 8);
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address')?.trim() || '';
  if (address && !ADDRESS_PATTERN.test(address)) {
    return json({ error: 'Invalid public EVM address' }, { status: 400 });
  }

  const probeStartedAt = Date.now();
  const base = {
    networkName: 'KriptoAman Mainnet',
    symbol: 'KAM',
    decimals: 18,
    status: 'mainnet-candidate-not-public',
    chainId: EXPECTED_CHAIN_ID,
    chainIdHex: EXPECTED_CHAIN_ID_HEX,
    consensus: 'QBFT',
    validatorTarget: 4,
    rpcUrl: RPC_URL,
    explorerUrl: EXPLORER_URL,
    marketPrice: null,
    marketPriceSource: null,
    marketPriceStatus: 'not-yet-trading',
    indicativeListingReference: KAM_INDICATIVE_LISTING_REFERENCE,
    commercialLaunchEnabled: false,
  };

  try {
    // Chain identity and current block are probed concurrently and independently.
    // A non-responsive public RPC fails closed quickly instead of consuming the
    // historical ~4.5s request budget on every status check.
    const [chainIdHex, blockHex] = await Promise.all([
      rpcWithTimeout('eth_chainId'),
      rpcWithTimeout('eth_blockNumber'),
    ]);
    const verified = chainIdHex.toLowerCase() === EXPECTED_CHAIN_ID_HEX;
    if (!verified) throw new Error('RPC chain ID mismatch');

    const blockNumber = Number(BigInt(blockHex));
    if (!Number.isSafeInteger(blockNumber) || blockNumber < 0) {
      throw new Error('RPC block number is invalid');
    }

    const walletBalance = address
      ? await rpcWithTimeout('eth_getBalance', [address, 'latest'], WALLET_PROBE_TIMEOUT_MS)
      : null;

    return json({
      ...base,
      live: true,
      verified: true,
      status: 'mainnet-candidate-rpc-verified',
      blockNumber,
      wallet: address ? { address, balanceKAM: formatKam(walletBalance) } : null,
      checkedAt: new Date().toISOString(),
      probeDurationMs: Date.now() - probeStartedAt,
    }, {
      headers: {
        'Cache-Control': address ? 'no-store' : VERIFIED_PUBLIC_STATUS_CACHE,
      },
    });
  } catch (error) {
    return json({
      ...base,
      live: false,
      verified: false,
      blockNumber: null,
      wallet: address ? { address, balanceKAM: null } : null,
      reason: error?.name === 'AbortError' ? 'rpc-timeout' : 'rpc-unavailable-or-unverified',
      checkedAt: new Date().toISOString(),
      probeDurationMs: Date.now() - probeStartedAt,
    }, {
      headers: {
        // Degraded public status is cached longer at the edge so an unavailable
        // RPC cannot be hammered by repeated anonymous health checks. Wallet
        // lookups remain strictly uncached.
        'Cache-Control': address ? 'no-store' : DEGRADED_PUBLIC_STATUS_CACHE,
      },
    });
  }
}
