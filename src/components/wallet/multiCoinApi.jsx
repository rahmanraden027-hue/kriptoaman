// Multi-coin blockchain API integration
// BTC/LTC/DOGE: BlockCypher | ETH/BNB/MATIC: EVM RPC/Etherscan-compatible | SOL: Solana RPC

export const COINS = {
  BTC: {
    id: 'BTC', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', decimals: 8,
    coingeckoId: 'bitcoin',
    explorerTx: 'https://blockchair.com/bitcoin/transaction/',
    explorerAddr: 'https://blockchair.com/bitcoin/address/',
    derivationPath: "m/44'/0'/0'/0/0",
  },
  ETH: {
    id: 'ETH', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', decimals: 18,
    coingeckoId: 'ethereum',
    explorerTx: 'https://etherscan.io/tx/',
    explorerAddr: 'https://etherscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  BNB: {
    id: 'BNB', name: 'BNB', symbol: 'BNB', color: '#F0B90B', decimals: 18,
    coingeckoId: 'binancecoin',
    explorerTx: 'https://bscscan.com/tx/',
    explorerAddr: 'https://bscscan.com/address/',
    derivationPath: "m/44'/60'/0'/0/0", // BNB uses same path as ETH (EVM)
    evmChain: 'bsc',
  },
  SOL: {
    id: 'SOL', name: 'Solana', symbol: 'SOL', color: '#9945FF', decimals: 9,
    coingeckoId: 'solana',
    explorerTx: 'https://solscan.io/tx/',
    explorerAddr: 'https://solscan.io/account/',
    derivationPath: "m/44'/501'/0'/0'",
  },
  DOGE: {
    id: 'DOGE', name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633', decimals: 8,
    coingeckoId: 'dogecoin',
    explorerTx: 'https://blockchair.com/dogecoin/transaction/',
    explorerAddr: 'https://blockchair.com/dogecoin/address/',
    derivationPath: "m/44'/3'/0'/0/0",
    bcyChain: 'doge/main',
  },
  MATIC: {
    id: 'MATIC', name: 'Polygon', symbol: 'POL', color: '#8247E5', decimals: 18,
    coingeckoId: 'matic-network',
    explorerTx: 'https://polygonscan.com/tx/',
    explorerAddr: 'https://polygonscan.com/address/',
    derivationPath: "m/44'/60'/0'/0/0", // EVM
    evmChain: 'polygon',
  },
  LTC: {
    id: 'LTC', name: 'Litecoin', symbol: 'LTC', color: '#A0A0A0', decimals: 8,
    coingeckoId: 'litecoin',
    explorerTx: 'https://blockchair.com/litecoin/transaction/',
    explorerAddr: 'https://blockchair.com/litecoin/address/',
    derivationPath: "m/44'/2'/0'/0/0",
  },
};

// ─── Price API (CoinGecko) ─────────────────────────────────
const COINGECKO_IDS = 'bitcoin,ethereum,binancecoin,solana,dogecoin,matic-network,litecoin';
const COIN_ID_MAP = {
  bitcoin: 'BTC', ethereum: 'ETH', binancecoin: 'BNB',
  solana: 'SOL', dogecoin: 'DOGE', 'matic-network': 'MATIC', litecoin: 'LTC',
};

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

// ─── EVM chains (ETH, BNB, MATIC) ─────────────────────────
const EVM_API = {
  ETH:  { url: 'https://api.etherscan.io/api',       key: '' },
  BNB:  { url: 'https://api.bscscan.com/api',        key: '' },
  MATIC:{ url: 'https://api.polygonscan.com/api',    key: '' },
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
  // Get recent signatures
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
export async function getBalance(coinId, address) {
  if (['ETH', 'BNB', 'MATIC'].includes(coinId)) return evmGetBalance(coinId, address);
  if (coinId === 'SOL') return solGetBalance(address);
  return bcyGetBalance(coinId, address); // BTC, LTC, DOGE
}

export async function getTransactionsByCoin(coinId, address) {
  if (['ETH', 'BNB', 'MATIC'].includes(coinId)) return evmGetTransactions(coinId, address);
  if (coinId === 'SOL') return solGetTransactions(address);
  return bcyGetTransactions(coinId, address);
}

export async function getRecommendedFeesByCoin(coinId) {
  if (['ETH', 'BNB', 'MATIC'].includes(coinId)) {
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