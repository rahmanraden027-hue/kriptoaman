import { json } from '../../../server/auth/http.js';

const EXPECTED_CHAIN_ID = 22028;
const EXPECTED_CHAIN_ID_HEX = '0x560c';
const RPC_URL = 'https://rpc.kriptoaman.com';
const EXPLORER_URL = 'https://explorer.kriptoaman.com';
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

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
    commercialLaunchEnabled: false,
    checkedAt: new Date().toISOString(),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const [chainIdHex, blockHex] = await Promise.all([
      rpc('eth_chainId', [], controller.signal),
      rpc('eth_blockNumber', [], controller.signal),
    ]);
    const verified = chainIdHex.toLowerCase() === EXPECTED_CHAIN_ID_HEX;
    if (!verified) throw new Error('RPC chain ID mismatch');

    const walletBalance = address
      ? await rpc('eth_getBalance', [address, 'latest'], controller.signal)
      : null;

    return json({
      ...base,
      live: true,
      verified: true,
      status: 'mainnet-candidate-rpc-verified',
      blockNumber: Number(BigInt(blockHex)),
      wallet: address ? { address, balanceKAM: formatKam(walletBalance) } : null,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return json({
      ...base,
      live: false,
      verified: false,
      blockNumber: null,
      wallet: address ? { address, balanceKAM: null } : null,
      reason: error?.name === 'AbortError' ? 'rpc-timeout' : 'rpc-unavailable-or-unverified',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } finally {
    clearTimeout(timeout);
  }
}
