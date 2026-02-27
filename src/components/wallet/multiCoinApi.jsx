// Multi-coin blockchain API integration
// BTC: BlockCypher | ETH: Etherscan public | LTC: BlockCypher

export const COINS = {
  BTC: {
    id: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTC',
    color: '#F7931A',
    decimals: 8,
    coingeckoId: 'bitcoin',
    explorerTx: 'https://blockchair.com/bitcoin/transaction/',
    explorerAddr: 'https://blockchair.com/bitcoin/address/',
    derivationPath: "m/44'/0'/0'/0/0",
  },
  ETH: {
    id: 'ETH',
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    decimals: 18,
    coingeckoId: 'ethereum',
    explorerTx: 'https://etherscan.io/tx/',
    explorerAddr: 'https://etherscan.io/address/',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  LTC: {
    id: 'LTC',
    name: 'Litecoin',
    symbol: 'LTC',
    color: '#A0A0A0',
    decimals: 8,
    coingeckoId: 'litecoin',
    explorerTx: 'https://blockchair.com/litecoin/transaction/',
    explorerAddr: 'https://blockchair.com/litecoin/address/',
    derivationPath: "m/44'/2'/0'/0/0",
  },
};

// ─── Price API ─────────────────────────────────────────────
export async function getPrices() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin&vs_currencies=usd&include_24hr_change=true'
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      BTC: { price: data.bitcoin?.usd, change24h: data.bitcoin?.usd_24h_change },
      ETH: { price: data.ethereum?.usd, change24h: data.ethereum?.usd_24h_change },
      LTC: { price: data.litecoin?.usd, change24h: data.litecoin?.usd_24h_change },
    };
  } catch {
    return {};
  }
}

// ─── BTC & LTC via BlockCypher ─────────────────────────────
const BLOCKCYPHER = {
  BTC: 'https://api.blockcypher.com/v1/btc/main',
  LTC: 'https://api.blockcypher.com/v1/ltc/main',
};

async function bcyGetBalance(coin, address) {
  const res = await fetch(`${BLOCKCYPHER[coin]}/addrs/${address}/balance`);
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data = await res.json();
  return {
    balance: data.balance || 0,
    unconfirmed: data.unconfirmed_balance || 0,
    txCount: data.n_tx || 0,
  };
}

async function bcyGetTransactions(coin, address) {
  const res = await fetch(`${BLOCKCYPHER[coin]}/addrs/${address}/full?limit=20`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.txs || []).map(tx => {
    const isSent = tx.inputs.some(i => i.addresses?.includes(address));
    const isReceived = tx.outputs.some(o => o.addresses?.includes(address));
    let amount = 0;
    let counterparty = '';
    if (isSent && isReceived) {
      const sent = tx.inputs.filter(i => i.addresses?.includes(address)).reduce((s, i) => s + i.output_value, 0);
      const received = tx.outputs.filter(o => o.addresses?.includes(address)).reduce((s, o) => s + o.value, 0);
      amount = received - sent;
      counterparty = tx.outputs.find(o => !o.addresses?.includes(address))?.addresses?.[0] || '';
    } else if (isSent) {
      amount = -tx.outputs.filter(o => !o.addresses?.includes(address)).reduce((s, o) => s + o.value, 0);
      counterparty = tx.outputs.find(o => !o.addresses?.includes(address))?.addresses?.[0] || '';
    } else {
      amount = tx.outputs.filter(o => o.addresses?.includes(address)).reduce((s, o) => s + o.value, 0);
      counterparty = tx.inputs[0]?.addresses?.[0] || '';
    }
    return {
      hash: tx.hash,
      amount,
      type: amount >= 0 ? 'received' : 'sent',
      confirmations: tx.confirmations || 0,
      date: tx.confirmed || tx.received,
      counterparty,
      fee: tx.fees || 0, // in satoshis
    };
  });
}

// ─── ETH via Etherscan (public, no key for basic) ──────────
const ETHERSCAN = 'https://api.etherscan.io/api';

async function ethGetBalance(address) {
  const res = await fetch(`${ETHERSCAN}?module=account&action=balance&address=${address}&tag=latest`);
  if (!res.ok) throw new Error('ETH balance fetch failed');
  const data = await res.json();
  const wei = BigInt(data.result || '0');
  return {
    balance: Number(wei),       // raw wei stored as number (for display we divide by 1e18)
    unconfirmed: 0,
    txCount: 0,
  };
}

async function ethGetTransactions(address) {
  const res = await fetch(
    `${ETHERSCAN}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc`
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data.result)) return [];
  return data.result.map(tx => {
    const isSent = tx.from?.toLowerCase() === address.toLowerCase();
    const valueWei = Number(BigInt(tx.value || '0'));
    const gasUsed = parseInt(tx.gasUsed || tx.gas || 21000);
    const gasPrice = parseInt(tx.gasPrice || 0);
    const feeWei = gasUsed * gasPrice;
    return {
      hash: tx.hash,
      amount: isSent ? -valueWei : valueWei,
      type: isSent ? 'sent' : 'received',
      confirmations: parseInt(tx.confirmations) || 0,
      date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      counterparty: isSent ? tx.to : tx.from,
      fee: feeWei, // in wei
      gasUsed,
      gasPrice,
    };
  });
}

// ─── Unified API ───────────────────────────────────────────
export async function getBalance(coinId, address) {
  if (coinId === 'ETH') return ethGetBalance(address);
  return bcyGetBalance(coinId, address);
}

export async function getTransactionsByCoin(coinId, address) {
  if (coinId === 'ETH') return ethGetTransactions(address);
  return bcyGetTransactions(coinId, address);
}

export async function getRecommendedFeesByCoin(coinId) {
  if (coinId === 'ETH') {
    // Estimate from gas price ~30 gwei, 21000 gas for simple transfer
    return { low: 21000 * 10e9, medium: 21000 * 30e9, high: 21000 * 60e9 };
  }
  try {
    const res = await fetch(`${BLOCKCYPHER[coinId]}`);
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

// Format amount from raw unit to display
export function formatAmount(coinId, rawAmount) {
  const decimals = COINS[coinId]?.decimals || 8;
  const abs = Math.abs(rawAmount);
  const val = abs / Math.pow(10, decimals);
  return val.toFixed(decimals === 18 ? 6 : 8);
}