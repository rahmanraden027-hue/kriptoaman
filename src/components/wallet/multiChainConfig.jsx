/**
 * Multi-Chain & Multi-Coin Configuration
 * Comprehensive support untuk 15+ networks & 30+ coins
 */

export const NETWORKS = {
  // Ethereum Layer 1
  ethereum: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.public.blastapi.io',
    explorer: 'https://etherscan.io',
    currency: 'ETH',
    decimals: 18,
    type: 'evm',
    category: 'mainnet',
  },
  // Layer 2 Solutions
  polygon: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    currency: 'MATIC',
    decimals: 18,
    type: 'evm',
    category: 'layer2',
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ARB',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    currency: 'ETH',
    decimals: 18,
    type: 'evm',
    category: 'layer2',
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    symbol: 'OP',
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    currency: 'ETH',
    decimals: 18,
    type: 'evm',
    category: 'layer2',
  },
  base: {
    id: 8453,
    name: 'Base',
    symbol: 'BASE',
    rpcUrl: 'https://developer-access-mainnet.base.org',
    explorer: 'https://basescan.org',
    currency: 'ETH',
    decimals: 18,
    type: 'evm',
    category: 'layer2',
  },
  zksync: {
    id: 324,
    name: 'zkSync Era',
    symbol: 'ZK',
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorer: 'https://explorer.zksync.io',
    currency: 'ETH',
    decimals: 18,
    type: 'evm',
    category: 'layer2',
  },
  // BNB Chain
  bsc: {
    id: 56,
    name: 'BNB Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorer: 'https://bscscan.com',
    currency: 'BNB',
    decimals: 18,
    type: 'evm',
    category: 'mainnet',
  },
  // Other EVMs
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
    currency: 'AVAX',
    decimals: 18,
    type: 'evm',
    category: 'mainnet',
  },
  fantom: {
    id: 250,
    name: 'Fantom',
    symbol: 'FTM',
    rpcUrl: 'https://rpc.ftm.tools',
    explorer: 'https://ftmscan.com',
    currency: 'FTM',
    decimals: 18,
    type: 'evm',
    category: 'mainnet',
  },
  harmony: {
    id: 1666600000,
    name: 'Harmony',
    symbol: 'ONE',
    rpcUrl: 'https://api.harmony.one',
    explorer: 'https://explorer.harmony.one',
    currency: 'ONE',
    decimals: 18,
    type: 'evm',
    category: 'mainnet',
  },
  celo: {
    id: 42220,
    name: 'Celo',
    symbol: 'CELO',
    rpcUrl: 'https://forno.celo.org',
    explorer: 'https://celoscan.io',
    currency: 'CELO',
    decimals: 18,
    type: 'evm',
    category: 'mainnet',
  },
  // Non-EVM
  solana: {
    id: null,
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorer: 'https://solscan.io',
    currency: 'SOL',
    decimals: 9,
    type: 'solana',
    category: 'mainnet',
  },
  bitcoin: {
    id: null,
    name: 'Bitcoin',
    symbol: 'BTC',
    rpcUrl: 'https://blockstream.info/api',
    explorer: 'https://blockstream.info',
    currency: 'BTC',
    decimals: 8,
    type: 'bitcoin',
    category: 'mainnet',
  },
  cardano: {
    id: null,
    name: 'Cardano',
    symbol: 'ADA',
    rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorer: 'https://cardanoscan.io',
    currency: 'ADA',
    decimals: 6,
    type: 'cardano',
    category: 'mainnet',
  },
  polkadot: {
    id: null,
    name: 'Polkadot',
    symbol: 'DOT',
    rpcUrl: 'wss://rpc.polkadot.io',
    explorer: 'https://polkascan.io',
    currency: 'DOT',
    decimals: 10,
    type: 'substrate',
    category: 'mainnet',
  },
};

export const COINS = {
  // Stablecoins
  usdt: { symbol: 'USDT', name: 'Tether', decimals: 6, icon: '💵', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base', 'solana', 'cardano', 'avalanche'] },
  usdc: { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: '🪙', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base', 'solana', 'cardano'] },
  busd: { symbol: 'BUSD', name: 'Binance USD', decimals: 18, icon: '🏦', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum'] },
  dai: { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, icon: '🔮', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism'] },
  
  // Major Layer 1s
  eth: { symbol: 'ETH', name: 'Ethereum', decimals: 18, icon: '⟠', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'solana'] },
  btc: { symbol: 'BTC', name: 'Bitcoin', decimals: 8, icon: '₿', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'solana', 'bitcoin'] },
  sol: { symbol: 'SOL', name: 'Solana', decimals: 9, icon: '◎', networks: ['solana', 'ethereum', 'polygon'] },
  ada: { symbol: 'ADA', name: 'Cardano', decimals: 6, icon: '₳', networks: ['cardano', 'ethereum', 'polygon'] },
  dot: { symbol: 'DOT', name: 'Polkadot', decimals: 10, icon: '●', networks: ['polkadot', 'ethereum', 'polygon'] },
  
  // Layer 2 Tokens
  matic: { symbol: 'MATIC', name: 'Polygon', decimals: 18, icon: '🔷', networks: ['polygon', 'ethereum', 'bsc'] },
  arb: { symbol: 'ARB', name: 'Arbitrum', decimals: 18, icon: '🔴', networks: ['arbitrum', 'ethereum'] },
  op: { symbol: 'OP', name: 'Optimism', decimals: 18, icon: '🔴', networks: ['optimism', 'ethereum'] },
  base: { symbol: 'BASE', name: 'Base', decimals: 18, icon: '🔵', networks: ['base', 'ethereum'] },
  
  // Other Mainnets
  bnb: { symbol: 'BNB', name: 'Binance Coin', decimals: 18, icon: '🟡', networks: ['bsc', 'ethereum', 'polygon'] },
  avax: { symbol: 'AVAX', name: 'Avalanche', decimals: 18, icon: '🏔️', networks: ['avalanche', 'ethereum'] },
  ftm: { symbol: 'FTM', name: 'Fantom', decimals: 18, icon: '👻', networks: ['fantom', 'ethereum'] },
  one: { symbol: 'ONE', name: 'Harmony', decimals: 18, icon: '☯️', networks: ['harmony', 'ethereum'] },
  celo: { symbol: 'CELO', name: 'Celo', decimals: 18, icon: '🌱', networks: ['celo', 'ethereum'] },
  
  // DeFi Tokens
  link: { symbol: 'LINK', name: 'Chainlink', decimals: 18, icon: '🔗', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base'] },
  aave: { symbol: 'AAVE', name: 'Aave', decimals: 18, icon: '👻', networks: ['ethereum', 'polygon', 'arbitrum'] },
  uni: { symbol: 'UNI', name: 'Uniswap', decimals: 18, icon: '🦄', networks: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'] },
  sushi: { symbol: 'SUSHI', name: 'SushiSwap', decimals: 18, icon: '🍣', networks: ['ethereum', 'bsc', 'polygon', 'arbitrum'] },
  curve: { symbol: 'CRV', name: 'Curve', decimals: 18, icon: '📈', networks: ['ethereum', 'polygon', 'arbitrum'] },
  lido: { symbol: 'LDO', name: 'Lido', decimals: 18, icon: '🔷', networks: ['ethereum', 'polygon'] },
  
  // Additional Alts
  xrp: { symbol: 'XRP', name: 'Ripple', decimals: 6, icon: '💎', networks: ['ethereum', 'polygon'] },
  doge: { symbol: 'DOGE', name: 'Dogecoin', decimals: 8, icon: '🐕', networks: ['ethereum', 'polygon', 'bsc'] },
  shib: { symbol: 'SHIB', name: 'Shiba Inu', decimals: 18, icon: '🐕', networks: ['ethereum', 'polygon'] },
  pepe: { symbol: 'PEPE', name: 'Pepe', decimals: 18, icon: '🐸', networks: ['ethereum', 'bsc'] },
};

export const COIN_NETWORKS = Object.entries(COINS).reduce((acc, [key, coin]) => {
  acc[coin.symbol] = coin.networks;
  return acc;
}, {});

export const NETWORK_COINS = Object.keys(NETWORKS).reduce((acc, networkKey) => {
  const coins = Object.values(COINS).filter(coin => coin.networks.includes(networkKey));
  acc[networkKey] = coins.map(c => c.symbol);
  return acc;
}, {});

export const getNetworkByChainId = (chainId) => {
  return Object.values(NETWORKS).find(n => n.id === chainId);
};

export const getNetworkBySymbol = (symbol) => {
  return NETWORKS[Object.keys(NETWORKS).find(k => NETWORKS[k].symbol === symbol)];
};

export const getCoinBySymbol = (symbol) => {
  return COINS[Object.keys(COINS).find(k => COINS[k].symbol === symbol)];
};

export const getCoinsForNetwork = (networkKey) => {
  return NETWORK_COINS[networkKey] || [];
};

export const getNetworksForCoin = (coinSymbol) => {
  return COIN_NETWORKS[coinSymbol] || [];
};

export const POPULAR_PAIRS = [
  'ETH/USDT', 'BTC/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT',
  'MATIC/USDT', 'ARB/USDT', 'OP/USDT', 'BNB/USDT', 'AVAX/USDT',
  'ETH/USDC', 'BTC/USDC', 'SOL/USDC',
];

export const NETWORKS_LIST = Object.entries(NETWORKS).map(([key, val]) => ({
  key,
  ...val,
}));

export const COINS_LIST = Object.entries(COINS).map(([key, val]) => ({
  key,
  ...val,
}));