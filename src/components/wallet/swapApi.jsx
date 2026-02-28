// Cross-chain Swap API using THORChain aggregator
// Docs: https://dev.thorchain.org/

const THORCHAIN_API = 'https://thornode.ninerealms.com/thorchain';

// All supported swap tokens with chain info
export const SWAP_COINS = {
  BTC:  { asset: 'BTC.BTC',   decimals: 8,  name: 'Bitcoin',   symbol: 'BTC',  color: '#F7931A', icon: '₿',  chain: 'BTC',  chainName: 'Bitcoin' },
  ETH:  { asset: 'ETH.ETH',   decimals: 18, name: 'Ethereum',  symbol: 'ETH',  color: '#627EEA', icon: 'Ξ',  chain: 'ETH',  chainName: 'Ethereum' },
  LTC:  { asset: 'LTC.LTC',   decimals: 8,  name: 'Litecoin',  symbol: 'LTC',  color: '#A0A0A0', icon: 'Ł',  chain: 'LTC',  chainName: 'Litecoin' },
  BNB:  { asset: 'BNB.BNB',   decimals: 18, name: 'BNB Chain', symbol: 'BNB',  color: '#F0B90B', icon: 'B',  chain: 'BNB',  chainName: 'BNB Chain' },
  AVAX: { asset: 'AVAX.AVAX', decimals: 18, name: 'Avalanche', symbol: 'AVAX', color: '#E84142', icon: '🔺', chain: 'AVAX', chainName: 'Avalanche C-Chain' },
  DOGE: { asset: 'DOGE.DOGE', decimals: 8,  name: 'Dogecoin',  symbol: 'DOGE', color: '#C2A633', icon: 'Ð',  chain: 'DOGE', chainName: 'Dogecoin' },
  SOL:  { asset: 'SOL.SOL',   decimals: 9,  name: 'Solana',    symbol: 'SOL',  color: '#9945FF', icon: '◎',  chain: 'SOL',  chainName: 'Solana' },
};

function toBaseAmount(amount) {
  return Math.floor(parseFloat(amount) * 1e8);
}

function fromBaseAmount(amount) {
  return amount / 1e8;
}

export async function getSwapQuote({ fromCoin, toCoin, amount, destinationAddress }) {
  if (!amount || parseFloat(amount) <= 0) return null;
  const fromAsset = SWAP_COINS[fromCoin]?.asset;
  const toAsset   = SWAP_COINS[toCoin]?.asset;
  if (!fromAsset || !toAsset) return null;

  const amountBase = toBaseAmount(amount);
  const dest = destinationAddress || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  const url = `${THORCHAIN_API}/quote/swap?from_asset=${fromAsset}&to_asset=${toAsset}&amount=${amountBase}&destination=${dest}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mendapatkan quote swap');
  const data = await res.json();

  const expectedOut     = fromBaseAmount(data.expected_amount_out || 0);
  const fees            = fromBaseAmount(data.fees?.total || 0);
  const slippage        = parseFloat(data.slippage_bps || 0) / 100;
  const outboundDelay   = data.outbound_delay_seconds || 0;
  const inboundConfirms = data.inbound_confirmation_seconds || 0;
  const totalTime       = outboundDelay + inboundConfirms;

  return {
    expectedOut,
    fees,
    slippage,
    outboundDelay,
    totalTime,
    inboundAddress: data.inbound_address,
    memo: data.memo,
    minOut: fromBaseAmount(data.recommended_min_amount_in || 0),
    router: data.router || null,
    warning: data.warning || null,
  };
}

export async function getInboundAddress(chain) {
  const res = await fetch(`${THORCHAIN_API}/inbound_addresses`);
  if (!res.ok) throw new Error('Gagal mendapatkan inbound address');
  const data = await res.json();
  const entry = data.find(d => d.chain === chain);
  return entry?.address || null;
}

export function buildSwapMemo(toAsset, destinationAddress, slippageBps = 300) {
  return `=:${toAsset}:${destinationAddress}:0/${slippageBps}`;
}