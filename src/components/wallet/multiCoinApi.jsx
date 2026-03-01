// Multi-coin blockchain API integration
// BTC/LTC/DOGE: BlockCypher | ETH/BNB/MATIC/ARB/OP/AVAX/FTM/BASE: EVM RPC/Etherscan-compatible | SOL: Solana RPC

export const COINS = {
  BTC: {
    id: 'BTC', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', decimals: 8,
    coingeckoId: 'bitcoin', platform: 'Bitcoin',
    explorerTx: 'https://blockchair.com/bitcoin/transaction/',
    explorerAddr: 'https://blockchair.com/bitcoin/address/',
    derivationPath: "m/44'/0'/0'/0/0",
  },
  ETH: {
    id: 'ETH', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', decimals: 18,
    coingeckoId: 'ethereum', platform: 'Ethereum',
    explorerTx: 'https://etherscan.io/tx/',
    explorerAddr: 'https://etherscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    layer: 'L1',
  },
  BNB: {
    id: 'BNB', name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', decimals: 18,
    coingeckoId: 'binancecoin', platform: 'BNB Chain',
    explorerTx: 'https://bscscan.com/tx/',
    explorerAddr: 'https://bscscan.com/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'bsc', layer: 'L1',
  },
  SOL: {
    id: 'SOL', name: 'Solana', symbol: 'SOL', color: '#9945FF', decimals: 9,
    coingeckoId: 'solana', platform: 'Solana',
    explorerTx: 'https://solscan.io/tx/',
    explorerAddr: 'https://solscan.io/account/',
    derivationPath: "m/44'/501'/0'/0'",
    layer: 'L1',
  },
  DOGE: {
    id: 'DOGE', name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633', decimals: 8,
    coingeckoId: 'dogecoin', platform: 'Dogecoin',
    explorerTx: 'https://blockchair.com/dogecoin/transaction/',
    explorerAddr: 'https://blockchair.com/dogecoin/address/',
    derivationPath: "m/44'/3'/0'/0/0",
    bcyChain: 'doge/main',
  },
  MATIC: {
    id: 'MATIC', name: 'Polygon', symbol: 'POL', color: '#8247E5', decimals: 18,
    coingeckoId: 'matic-network', platform: 'Polygon',
    explorerTx: 'https://polygonscan.com/tx/',
    explorerAddr: 'https://polygonscan.com/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'polygon', layer: 'L1',
  },
  LTC: {
    id: 'LTC', name: 'Litecoin', symbol: 'LTC', color: '#A0A0A0', decimals: 8,
    coingeckoId: 'litecoin', platform: 'Litecoin',
    explorerTx: 'https://blockchair.com/litecoin/transaction/',
    explorerAddr: 'https://blockchair.com/litecoin/address/',
    derivationPath: "m/44'/2'/0'/0/0",
  },
  ARB: {
    id: 'ARB', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0', decimals: 18,
    coingeckoId: 'ethereum', platform: 'Arbitrum One',
    explorerTx: 'https://arbiscan.io/tx/',
    explorerAddr: 'https://arbiscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'arbitrum', layer: 'L2', parentChain: 'ETH',
    badge: 'L2', bridgeUrl: 'https://bridge.arbitrum.io', nativeToken: 'ETH',
  },
  OP: {
    id: 'OP', name: 'Optimism', symbol: 'ETH', color: '#FF0420', decimals: 18,
    coingeckoId: 'ethereum', platform: 'OP Mainnet',
    explorerTx: 'https://optimistic.etherscan.io/tx/',
    explorerAddr: 'https://optimistic.etherscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'optimism', layer: 'L2', parentChain: 'ETH',
    badge: 'L2', bridgeUrl: 'https://app.optimism.io/bridge', nativeToken: 'ETH',
  },
  BASE: {
    id: 'BASE', name: 'Base', symbol: 'ETH', color: '#0052FF', decimals: 18,
    coingeckoId: 'ethereum', platform: 'Base',
    explorerTx: 'https://basescan.org/tx/',
    explorerAddr: 'https://basescan.org/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'base', layer: 'L2', parentChain: 'ETH',
    badge: 'L2', bridgeUrl: 'https://bridge.base.org', nativeToken: 'ETH',
  },
  AVAX: {
    id: 'AVAX', name: 'Avalanche', symbol: 'AVAX', color: '#E84142', decimals: 18,
    coingeckoId: 'avalanche-2', platform: 'Avalanche C-Chain',
    explorerTx: 'https://snowtrace.io/tx/',
    explorerAddr: 'https://snowtrace.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'avalanche', layer: 'L1', nativeToken: 'AVAX',
  },
  FTM: {
    id: 'FTM', name: 'Fantom', symbol: 'FTM', color: '#1969FF', decimals: 18,
    coingeckoId: 'fantom', platform: 'Fantom Opera',
    explorerTx: 'https://ftmscan.com/tx/',
    explorerAddr: 'https://ftmscan.com/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'fantom', layer: 'L1', nativeToken: 'FTM',
  },
  // ── New coins ──────────────────────────────────────────────
  XRP: {
    id: 'XRP', name: 'XRP', symbol: 'XRP', color: '#00AAE4', decimals: 6,
    coingeckoId: 'ripple', platform: 'XRP Ledger',
    explorerTx: 'https://xrpscan.com/tx/',
    explorerAddr: 'https://xrpscan.com/account/',
    derivationPath: "m/44'/144'/0'/0/0",
    layer: 'L1',
  },
  ADA: {
    id: 'ADA', name: 'Cardano', symbol: 'ADA', color: '#0033AD', decimals: 6,
    coingeckoId: 'cardano', platform: 'Cardano',
    explorerTx: 'https://cardanoscan.io/transaction/',
    explorerAddr: 'https://cardanoscan.io/address/',
    derivationPath: "m/1852'/1815'/0'/0/0",
    layer: 'L1',
  },
  DOT: {
    id: 'DOT', name: 'Polkadot', symbol: 'DOT', color: '#E6007A', decimals: 10,
    coingeckoId: 'polkadot', platform: 'Polkadot',
    explorerTx: 'https://polkascan.io/polkadot/transaction/',
    explorerAddr: 'https://polkascan.io/polkadot/account/',
    derivationPath: "m/44'/354'/0'/0/0",
    layer: 'L1',
  },
  TRX: {
    id: 'TRX', name: 'TRON', symbol: 'TRX', color: '#FF0013', decimals: 6,
    coingeckoId: 'tron', platform: 'TRON',
    explorerTx: 'https://tronscan.org/#/transaction/',
    explorerAddr: 'https://tronscan.org/#/address/',
    derivationPath: "m/44'/195'/0'/0/0",
    layer: 'L1',
  },
  ATOM: {
    id: 'ATOM', name: 'Cosmos', symbol: 'ATOM', color: '#2E3148', decimals: 6,
    coingeckoId: 'cosmos', platform: 'Cosmos Hub',
    explorerTx: 'https://mintscan.io/cosmos/txs/',
    explorerAddr: 'https://mintscan.io/cosmos/accounts/',
    derivationPath: "m/44'/118'/0'/0/0",
    layer: 'L1',
  },
  LINK: {
    id: 'LINK', name: 'Chainlink', symbol: 'LINK', color: '#375BD2', decimals: 18,
    coingeckoId: 'chainlink', platform: 'Ethereum',
    explorerTx: 'https://etherscan.io/tx/',
    explorerAddr: 'https://etherscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'ethereum', layer: 'Token',
  },
  UNI: {
    id: 'UNI', name: 'Uniswap', symbol: 'UNI', color: '#FF007A', decimals: 18,
    coingeckoId: 'uniswap', platform: 'Ethereum',
    explorerTx: 'https://etherscan.io/tx/',
    explorerAddr: 'https://etherscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'ethereum', layer: 'Token',
  },
  NEAR: {
    id: 'NEAR', name: 'NEAR Protocol', symbol: 'NEAR', color: '#00C08B', decimals: 24,
    coingeckoId: 'near', platform: 'NEAR Protocol',
    explorerTx: 'https://explorer.near.org/transactions/',
    explorerAddr: 'https://explorer.near.org/accounts/',
    derivationPath: "m/44'/397'/0'/0/0",
    layer: 'L1',
  },
  APT: {
    id: 'APT', name: 'Aptos', symbol: 'APT', color: '#00D4B4', decimals: 8,
    coingeckoId: 'aptos', platform: 'Aptos',
    explorerTx: 'https://explorer.aptoslabs.com/txn/',
    explorerAddr: 'https://explorer.aptoslabs.com/account/',
    derivationPath: "m/44'/637'/0'/0/0",
    layer: 'L1',
  },
  SUI: {
    id: 'SUI', name: 'Sui', symbol: 'SUI', color: '#4DA2FF', decimals: 9,
    coingeckoId: 'sui', platform: 'Sui Network',
    explorerTx: 'https://suiexplorer.com/txblock/',
    explorerAddr: 'https://suiexplorer.com/address/',
    derivationPath: "m/44'/784'/0'/0/0",
    layer: 'L1',
  },
  OP_TOKEN: {
    id: 'OP_TOKEN', name: 'Optimism Token', symbol: 'OP', color: '#FF0420', decimals: 18,
    coingeckoId: 'optimism', platform: 'OP Mainnet',
    explorerTx: 'https://optimistic.etherscan.io/tx/',
    explorerAddr: 'https://optimistic.etherscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'optimism', layer: 'Token',
  },
  ARB_TOKEN: {
    id: 'ARB_TOKEN', name: 'Arbitrum Token', symbol: 'ARB', color: '#28A0F0', decimals: 18,
    coingeckoId: 'arbitrum', platform: 'Arbitrum One',
    explorerTx: 'https://arbiscan.io/tx/',
    explorerAddr: 'https://arbiscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
    evmChain: 'arbitrum', layer: 'Token',
  },
};

// ─── Price API (CoinGecko) ─────────────────────────────────
const COINGECKO_IDS = 'bitcoin,ethereum,binancecoin,solana,dogecoin,matic-network,litecoin,avalanche-2,fantom,ripple,cardano,polkadot,tron,cosmos,chainlink,uniswap,near,aptos,sui,optimism,arbitrum';
const COIN_ID_MAP = {
  bitcoin: 'BTC', ethereum: 'ETH', binancecoin: 'BNB',
  solana: 'SOL', dogecoin: 'DOGE', 'matic-network': 'MATIC', litecoin: 'LTC',
  'avalanche-2': 'AVAX', fantom: 'FTM',
  ripple: 'XRP', cardano: 'ADA', polkadot: 'DOT', tron: 'TRX',
  cosmos: 'ATOM', chainlink: 'LINK', uniswap: 'UNI', near: 'NEAR',
  aptos: 'APT', sui: 'SUI', optimism: 'OP_TOKEN', arbitrum: 'ARB_TOKEN',
};

// Coins with separate price tokens (L2s use ETH price)
const PRICE_ALIASES = { ARB: 'ETH', OP: 'ETH', BASE: 'ETH' };

export async function getPrices() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) return {};
    const data = await res.json();
    const result = {};
    Object.entries(COIN_ID_MAP).forEach(([geckoId, coinId]) => {
      if (data[geckoId]) {
        result[coinId] = { price: data[geckoId].usd, change24h: data[geckoId].usd_24h_change };
      }
    });
    // Propagate prices to L2 aliases
    Object.entries(PRICE_ALIASES).forEach(([coinId, sourceId]) => {
      if (result[sourceId]) result[coinId] = result[sourceId];
    });
    return result;
  } catch {
    return {};
  }
}

// ─── BlockCypher (BTC, LTC, DOGE) ─────────────────────────
const BCY_BASE = {
  BTC: 'https://api.blockcypher.com/v1/btc/main',
  LTC: 'https://api.blockcypher.com/v1/ltc/main',
  DOGE: 'https://api.blockcypher.com/v1/doge/main',
};

async function bcyGetBalance(coin, address) {
  const res = await fetch(`${BCY_BASE[coin]}/addrs/${address}/balance`);
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data = await res.json();
  return { balance: data.balance || 0, unconfirmed: data.unconfirmed_balance || 0, txCount: data.n_tx || 0 };
}

async function bcyGetTransactions(coin, address) {
  const res = await fetch(`${BCY_BASE[coin]}/addrs/${address}/full?limit=20`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.txs || []).map(tx => {
    const isSent = tx.inputs.some(i => i.addresses?.includes(address));
    let amount = 0, counterparty = '';
    if (isSent) {
      amount = -tx.outputs.filter(o => !o.addresses?.includes(address)).reduce((s, o) => s + o.value, 0);
      counterparty = tx.outputs.find(o => !o.addresses?.includes(address))?.addresses?.[0] || '';
    } else {
      amount = tx.outputs.filter(o => o.addresses?.includes(address)).reduce((s, o) => s + o.value, 0);
      counterparty = tx.inputs[0]?.addresses?.[0] || '';
    }
    return { hash: tx.hash, amount, type: amount >= 0 ? 'received' : 'sent', confirmations: tx.confirmations || 0, date: tx.confirmed || tx.received, counterparty, fee: tx.fees || 0 };
  });
}

// ─── EVM chains ─────────────────────────────────────────────
const EVM_API = {
  ETH:   { url: 'https://api.etherscan.io/api',               key: '' },
  BNB:   { url: 'https://api.bscscan.com/api',                key: '' },
  MATIC: { url: 'https://api.polygonscan.com/api',            key: '' },
  ARB:   { url: 'https://api.arbiscan.io/api',                key: '' },
  OP:    { url: 'https://api-optimistic.etherscan.io/api',    key: '' },
  BASE:  { url: 'https://api.basescan.org/api',               key: '' },
  AVAX:  { url: 'https://api.snowtrace.io/api',               key: '' },
  FTM:   { url: 'https://api.ftmscan.com/api',                key: '' },
};

async function evmGetBalance(coin, address) {
  const api = EVM_API[coin];
  const res = await fetch(`${api.url}?module=account&action=balance&address=${address}&tag=latest`);
  if (!res.ok) throw new Error('EVM balance fetch failed');
  const data = await res.json();
  const wei = BigInt(data.result || '0');
  return { balance: Number(wei), unconfirmed: 0, txCount: 0 };
}

async function evmGetTransactions(coin, address) {
  const api = EVM_API[coin];
  const res = await fetch(
    `${api.url}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc`
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data.result)) return [];
  return data.result.map(tx => {
    const isSent = tx.from?.toLowerCase() === address.toLowerCase();
    const valueWei = Number(BigInt(tx.value || '0'));
    const gasUsed = parseInt(tx.gasUsed || tx.gas || 21000);
    const gasPrice = parseInt(tx.gasPrice || 0);
    return {
      hash: tx.hash,
      amount: isSent ? -valueWei : valueWei,
      type: isSent ? 'sent' : 'received',
      confirmations: parseInt(tx.confirmations) || 0,
      date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      counterparty: isSent ? tx.to : tx.from,
      fee: gasUsed * gasPrice,
      gasUsed,
    };
  });
}

// ─── Solana RPC ────────────────────────────────────────────
const SOL_RPC = 'https://api.mainnet-beta.solana.com';

async function solGetBalance(address) {
  const res = await fetch(SOL_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
  });
  if (!res.ok) throw new Error('SOL balance fetch failed');
  const data = await res.json();
  return { balance: data.result?.value || 0, unconfirmed: 0, txCount: 0 };
}

async function solGetTransactions(address) {
  const sigRes = await fetch(SOL_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit: 20 }] }),
  });
  if (!sigRes.ok) return [];
  const sigData = await sigRes.json();
  const sigs = sigData.result || [];
  return sigs.map(s => ({
    hash: s.signature,
    amount: 0,
    type: 'received',
    confirmations: s.confirmationStatus === 'finalized' ? 32 : 0,
    date: s.blockTime ? new Date(s.blockTime * 1000).toISOString() : null,
    counterparty: '',
    fee: s.fee || 0,
  }));
}

// ─── Unified API ───────────────────────────────────────────
const EVM_COINS = ['ETH', 'BNB', 'MATIC', 'ARB', 'OP', 'BASE', 'AVAX', 'FTM'];

export async function getBalance(coinId, address) {
  if (EVM_COINS.includes(coinId)) return evmGetBalance(coinId, address);
  if (coinId === 'SOL') return solGetBalance(address);
  return bcyGetBalance(coinId, address);
}

export async function getTransactionsByCoin(coinId, address) {
  if (EVM_COINS.includes(coinId)) return evmGetTransactions(coinId, address);
  if (coinId === 'SOL') return solGetTransactions(address);
  return bcyGetTransactions(coinId, address);
}

export async function getRecommendedFeesByCoin(coinId) {
  if (EVM_COINS.includes(coinId)) {
    return { low: 21000 * 10e9, medium: 21000 * 30e9, high: 21000 * 60e9 };
  }
  if (coinId === 'SOL') return { low: 5000, medium: 5000, high: 5000 };
  try {
    const res = await fetch(BCY_BASE[coinId]);
    if (!res.ok) return { low: 1, medium: 5, high: 10 };
    const data = await res.json();
    return {
      low: Math.floor((data.low_fee_per_kb || 1000) / 1000),
      medium: Math.floor((data.medium_fee_per_kb || 5000) / 1000),
      high: Math.floor((data.high_fee_per_kb || 10000) / 1000),
    };
  } catch {
    return { low: 1, medium: 5, high: 10 };
  }
}

export function formatAmount(coinId, rawAmount) {
  const decimals = COINS[coinId]?.decimals || 8;
  const abs = Math.abs(rawAmount);
  const val = abs / Math.pow(10, decimals);
  return val.toFixed(decimals === 18 ? 6 : decimals === 9 ? 6 : 8);
}