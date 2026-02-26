// DEX API - Real prices from CoinGecko, simulated swap execution

export const TOKENS = {
  ETH: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum', color: '#627EEA', logo: 'Ξ', chain: 'ETH' },
  USDC: { symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin', color: '#2775CA', logo: '$', chain: 'ETH' },
  USDT: { symbol: 'USDT', name: 'Tether', decimals: 6, coingeckoId: 'tether', color: '#26A17B', logo: '₮', chain: 'ETH' },
  DAI: { symbol: 'DAI', name: 'DAI Stablecoin', decimals: 18, coingeckoId: 'dai', color: '#F5AC37', logo: '◈', chain: 'ETH' },
  WBTC: { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, coingeckoId: 'wrapped-bitcoin', color: '#F7931A', logo: '₿', chain: 'ETH' },
  BTC: { symbol: 'BTC', name: 'Bitcoin', decimals: 8, coingeckoId: 'bitcoin', color: '#F7931A', logo: '₿', chain: 'BTC' },
  LTC: { symbol: 'LTC', name: 'Litecoin', decimals: 8, coingeckoId: 'litecoin', color: '#A0A0A0', logo: 'Ł', chain: 'LTC' },
};

const COINGECKO_IDS = Object.values(TOKENS).map(t => t.coingeckoId).join(',');

let priceCache = {};
let priceCacheTime = 0;

export async function fetchTokenPrices() {
  if (Date.now() - priceCacheTime < 30000) return priceCache;
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd`
  );
  if (!res.ok) return priceCache;
  const data = await res.json();
  const prices = {};
  Object.entries(TOKENS).forEach(([sym, token]) => {
    prices[sym] = data[token.coingeckoId]?.usd || 0;
  });
  priceCache = prices;
  priceCacheTime = Date.now();
  return prices;
}

export function getSwapQuote(fromSymbol, toSymbol, fromAmount, prices) {
  const fromPrice = prices[fromSymbol] || 0;
  const toPrice = prices[toSymbol] || 1;
  if (!fromAmount || !fromPrice || !toPrice) return null;

  const usdValue = fromAmount * fromPrice;
  const slippage = 0.005; // 0.5%
  const toAmount = (usdValue / toPrice) * (1 - slippage);

  // Gas fee estimate
  const isEthChain = TOKENS[fromSymbol]?.chain === 'ETH' || TOKENS[toSymbol]?.chain === 'ETH';
  const isCrossChain = TOKENS[fromSymbol]?.chain !== TOKENS[toSymbol]?.chain;
  const gasFeeUSD = isCrossChain ? 2.5 : isEthChain ? 8.5 : 0.5;

  return {
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount: parseFloat(toAmount.toFixed(8)),
    fromUSD: usdValue,
    toUSD: usdValue * (1 - slippage),
    slippage: 0.5,
    gasFeeUSD,
    priceImpact: fromAmount * fromPrice > 10000 ? 0.3 : 0.05,
    protocol: isCrossChain ? 'THORChain' : 'Uniswap v3',
    rate: fromPrice / toPrice,
  };
}

export function getDexDeepLink(fromSymbol, toSymbol, fromAmount) {
  const isCrossChain = TOKENS[fromSymbol]?.chain !== TOKENS[toSymbol]?.chain;
  if (isCrossChain) {
    return `https://app.thorswap.finance/swap/${fromSymbol}.${fromSymbol}/${toSymbol}.${toSymbol}`;
  }
  // Uniswap token addresses (mainnet)
  const ADDRESSES = {
    ETH: 'ETH',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  };
  const inputCurrency = ADDRESSES[fromSymbol] || fromSymbol;
  const outputCurrency = ADDRESSES[toSymbol] || toSymbol;
  return `https://app.uniswap.org/swap?inputCurrency=${inputCurrency}&outputCurrency=${outputCurrency}&exactAmount=${fromAmount}`;
}

// Local swap history
export function loadSwapHistory() {
  try { return JSON.parse(localStorage.getItem('dex_swap_history') || '[]'); } catch { return []; }
}

export function saveSwapToHistory(swap) {
  const history = loadSwapHistory();
  history.unshift({ ...swap, id: Date.now(), timestamp: new Date().toISOString() });
  localStorage.setItem('dex_swap_history', JSON.stringify(history.slice(0, 50)));
}