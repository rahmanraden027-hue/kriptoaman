// Swap API using THORChain for cross-chain swaps
// Docs: https://dev.thorchain.org/

const THORCHAIN_API = 'https://thornode.ninerealms.com/thorchain';
const THORCHAIN_MIDGARD = 'https://midgard.ninerealms.com/v2';

// Coin mapping to THORChain asset format
export const SWAP_COINS = {
  BTC: { asset: 'BTC.BTC', decimals: 8, name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', icon: '₿' },
  ETH: { asset: 'ETH.ETH', decimals: 18, name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'Ξ' },
  LTC: { asset: 'LTC.LTC', decimals: 8, name: 'Litecoin', symbol: 'LTC', color: '#A0A0A0', icon: 'Ł' },
};

// Convert amount to THORChain base units (1e8)
function toBaseAmount(amount, decimals) {
  return Math.floor(parseFloat(amount) * 1e8);
}

// Convert from THORChain base units
function fromBaseAmount(amount, decimals) {
  return amount / 1e8;
}

// Get a swap quote from THORChain
export async function getSwapQuote({ fromCoin, toCoin, amount, destinationAddress }) {
  if (!amount || parseFloat(amount) <= 0) return null;

  const fromAsset = SWAP_COINS[fromCoin]?.asset;
  const toAsset = SWAP_COINS[toCoin]?.asset;
  if (!fromAsset || !toAsset) return null;

  const amountBase = toBaseAmount(amount, SWAP_COINS[fromCoin].decimals);

  const url = `${THORCHAIN_API}/quote/swap?from_asset=${fromAsset}&to_asset=${toAsset}&amount=${amountBase}&destination=${destinationAddress || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mendapatkan quote swap');
  const data = await res.json();

  const expectedOut = fromBaseAmount(data.expected_amount_out || 0);
  const fees = fromBaseAmount(data.fees?.total || 0);
  const slippage = parseFloat(data.slippage_bps || 0) / 100; // convert bps to %
  const inboundAddress = data.inbound_address;
  const memo = data.memo;

  return {
    expectedOut,
    fees,
    slippage,
    inboundAddress,
    memo,
    minOut: fromBaseAmount(data.recommended_min_amount_in || 0),
    totalFeeUSD: parseFloat(data.fees?.total_bps || 0) / 100,
    outboundDelay: data.outbound_delay_seconds || 0,
  };
}

// Get THORChain inbound address for a chain
export async function getInboundAddress(chain) {
  const res = await fetch(`${THORCHAIN_API}/inbound_addresses`);
  if (!res.ok) throw new Error('Gagal mendapatkan inbound address');
  const data = await res.json();
  const entry = data.find(d => d.chain === chain);
  return entry?.address || null;
}

// Get pool stats from Midgard
export async function getPoolStats(asset) {
  const res = await fetch(`${THORCHAIN_MIDGARD}/pool/${asset}`);
  if (!res.ok) return null;
  return res.json();
}

// Build THORChain swap memo
export function buildSwapMemo(toAsset, destinationAddress, slippageBps = 300) {
  // Format: SWAP:ASSET:DEST:LIMIT
  return `=:${toAsset}:${destinationAddress}:0/${slippageBps}`;
}