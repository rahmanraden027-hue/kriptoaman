/**
 * KriptoAman — Network Connector
 * Real-time connection hub untuk semua jaringan blockchain publik & perbankan Indonesia
 * 
 * Endpoints: /  (POST dengan action param)
 * Actions:
 *   - status        → ping semua network, return latency & status
 *   - blockchain    → ambil balance dari blockchain tertentu
 *   - txhistory     → ambil history tx dari blockchain
 *   - bankrates     → kurs IDR real-time (BI + multiple sources)
 *   - gasprice      → gas price semua EVM chains
 *   - tokenbalance  → ERC-20/BEP-20/SPL token balance
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ── Network Configurations ─────────────────────────────────────────────────
const NETWORKS = {
  // ── EVM Networks ──────────────────────────────────────────────────────────
  ethereum:  { name: 'Ethereum',      rpc: 'https://eth.llamarpc.com',              explorer: 'https://api.etherscan.io/api',                chain_id: 1    },
  bsc:       { name: 'BNB Chain',     rpc: 'https://bsc-dataseed.binance.org',       explorer: 'https://api.bscscan.com/api',                  chain_id: 56   },
  polygon:   { name: 'Polygon',       rpc: 'https://polygon-rpc.com',               explorer: 'https://api.polygonscan.com/api',              chain_id: 137  },
  arbitrum:  { name: 'Arbitrum One',  rpc: 'https://arb1.arbitrum.io/rpc',          explorer: 'https://api.arbiscan.io/api',                  chain_id: 42161},
  optimism:  { name: 'Optimism',      rpc: 'https://mainnet.optimism.io',           explorer: 'https://api-optimistic.etherscan.io/api',      chain_id: 10   },
  base:      { name: 'Base',          rpc: 'https://mainnet.base.org',              explorer: 'https://api.basescan.org/api',                 chain_id: 8453 },
  avalanche: { name: 'Avalanche C',   rpc: 'https://api.avax.network/ext/bc/C/rpc', explorer: 'https://api.snowtrace.io/api',                 chain_id: 43114},
  fantom:    { name: 'Fantom Opera',  rpc: 'https://rpc.ftm.tools',                 explorer: 'https://api.ftmscan.com/api',                  chain_id: 250  },
  // ── Non-EVM ───────────────────────────────────────────────────────────────
  solana:    { name: 'Solana',        rpc: 'https://api.mainnet-beta.solana.com',    explorer: 'https://api.mainnet-beta.solana.com',          type: 'solana' },
  bitcoin:   { name: 'Bitcoin',       rpc: 'https://api.blockcypher.com/v1/btc/main',explorer: 'https://blockchair.com/bitcoin',               type: 'utxo'   },
  litecoin:  { name: 'Litecoin',      rpc: 'https://api.blockcypher.com/v1/ltc/main',explorer: 'https://blockchair.com/litecoin',              type: 'utxo'   },
  dogecoin:  { name: 'Dogecoin',      rpc: 'https://api.blockcypher.com/v1/doge/main',explorer:'https://blockchair.com/dogecoin',              type: 'utxo'   },
  tron:      { name: 'TRON',          rpc: 'https://api.trongrid.io',               explorer: 'https://apilist.tronscanapi.com/api',          type: 'tron'   },
  xrp:       { name: 'XRP Ledger',    rpc: 'https://s1.ripple.com:51234',           explorer: 'https://data.ripple.com/v2',                   type: 'xrp'    },
};

// ── Banking / IDR Rate Sources ─────────────────────────────────────────────
const IDR_SOURCES = [
  { name: 'ExchangeRate-API', url: 'https://api.exchangerate-api.com/v4/latest/USD' },
  { name: 'Open Exchange Rates', url: 'https://open.er-api.com/v6/latest/USD' },
  { name: 'Frankfurter', url: 'https://api.frankfurter.app/latest?to=IDR' },
];

// Indonesian Bank Transfer Fees (static, updated periodically)
const BANK_FEES = {
  BCA:    { transfer_onus: 0, transfer_bi_fast: 2500, transfer_rtgs: 25000, transfer_skn: 5000 },
  BRI:    { transfer_onus: 0, transfer_bi_fast: 2500, transfer_rtgs: 25000, transfer_skn: 5000 },
  BNI:    { transfer_onus: 0, transfer_bi_fast: 2500, transfer_rtgs: 25000, transfer_skn: 5000 },
  Mandiri:{ transfer_onus: 0, transfer_bi_fast: 2500, transfer_rtgs: 25000, transfer_skn: 5000 },
  CIMB:   { transfer_onus: 0, transfer_bi_fast: 2500, transfer_rtgs: 25000, transfer_skn: 5000 },
  BSI:    { transfer_onus: 0, transfer_bi_fast: 2500, transfer_rtgs: 25000, transfer_skn: 5000 },
};

// ── Helpers ────────────────────────────────────────────────────────────────
async function pingNetwork(name, url, timeout = 5000) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    return { name, status: 'online', latency: Date.now() - start, code: res.status };
  } catch {
    return { name, status: 'offline', latency: Date.now() - start, code: 0 };
  }
}

async function evmGetBalance(rpc, address) {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
  });
  const data = await res.json();
  const wei = BigInt(data.result || '0x0');
  return Number(wei) / 1e18;
}

async function evmGetGasPrice(rpc) {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }),
  });
  const data = await res.json();
  const gwei = Number(BigInt(data.result || '0x0')) / 1e9;
  return Math.round(gwei * 100) / 100;
}

async function solGetBalance(address) {
  const res = await fetch('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
  });
  const data = await res.json();
  return (data.result?.value || 0) / 1e9;
}

async function tronGetBalance(address) {
  const res = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
  const data = await res.json();
  const bal = data.data?.[0]?.balance || 0;
  return bal / 1e6;
}

async function xrpGetBalance(address) {
  const res = await fetch('https://s1.ripple.com:51234', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'account_info', params: [{ account: address, ledger_index: 'validated' }] }),
  });
  const data = await res.json();
  const drops = parseInt(data.result?.account_data?.Balance || '0');
  return drops / 1e6;
}

async function utxoGetBalance(apiBase, address) {
  const res = await fetch(`${apiBase}/addrs/${address}/balance`);
  const data = await res.json();
  return (data.balance || 0) / 1e8;
}

async function fetchIDRRate() {
  for (const src of IDR_SOURCES) {
    try {
      const res = await fetch(src.url);
      if (!res.ok) continue;
      const data = await res.json();
      const idr = data.rates?.IDR || data.conversion_rates?.IDR;
      if (idr) return { rate: idr, source: src.name, timestamp: new Date().toISOString() };
    } catch { continue; }
  }
  // BI hardcoded fallback
  return { rate: 16350, source: 'fallback', timestamp: new Date().toISOString() };
}

async function fetchBinancePrice(symbol) {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
  if (!res.ok) return null;
  return await res.json();
}

// ── Main Handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body = {};
  try { body = await req.json(); } catch { }

  const action = body.action || 'status';

  // ── ACTION: status — ping semua network ──────────────────────────────────
  if (action === 'status') {
    const checks = await Promise.allSettled([
      // Blockchain nodes
      pingNetwork('Ethereum RPC',    'https://eth.llamarpc.com'),
      pingNetwork('BNB Chain RPC',   'https://bsc-dataseed.binance.org'),
      pingNetwork('Polygon RPC',     'https://polygon-rpc.com'),
      pingNetwork('Arbitrum RPC',    'https://arb1.arbitrum.io/rpc'),
      pingNetwork('Optimism RPC',    'https://mainnet.optimism.io'),
      pingNetwork('Base RPC',        'https://mainnet.base.org'),
      pingNetwork('Avalanche RPC',   'https://api.avax.network/ext/bc/C/rpc'),
      pingNetwork('Solana RPC',      'https://api.mainnet-beta.solana.com'),
      pingNetwork('BlockCypher BTC', 'https://api.blockcypher.com/v1/btc/main'),
      pingNetwork('TRON Grid',       'https://api.trongrid.io'),
      pingNetwork('Binance WS',      'https://api.binance.com/api/v3/time'),
      pingNetwork('CoinGecko',       'https://api.coingecko.com/api/v3/ping'),
      // Banking / IDR
      pingNetwork('ExchangeRate API','https://api.exchangerate-api.com/v4/latest/USD'),
      pingNetwork('Open ER API',     'https://open.er-api.com/v6/latest/USD'),
      pingNetwork('Frankfurter',     'https://api.frankfurter.app/latest?to=IDR'),
    ]);

    const results = checks.map(c => c.status === 'fulfilled' ? c.value : { name: 'unknown', status: 'error' });
    const online = results.filter(r => r.status === 'online').length;

    return Response.json({
      summary: { total: results.length, online, offline: results.length - online, health_pct: Math.round(online / results.length * 100) },
      networks: results,
      timestamp: new Date().toISOString(),
    });
  }

  // ── ACTION: blockchain — ambil balance ────────────────────────────────────
  if (action === 'blockchain') {
    const { network, address } = body;
    if (!network || !address) return Response.json({ error: 'network & address required' }, { status: 400 });

    try {
      let balance = 0;
      const evmNetworks = ['ethereum','bsc','polygon','arbitrum','optimism','base','avalanche','fantom'];

      if (evmNetworks.includes(network)) {
        const cfg = NETWORKS[network];
        balance = await evmGetBalance(cfg.rpc, address);
      } else if (network === 'solana') {
        balance = await solGetBalance(address);
      } else if (network === 'tron') {
        balance = await tronGetBalance(address);
      } else if (network === 'xrp') {
        balance = await xrpGetBalance(address);
      } else if (['bitcoin','litecoin','dogecoin'].includes(network)) {
        const cfg = NETWORKS[network];
        balance = await utxoGetBalance(cfg.rpc, address);
      } else {
        return Response.json({ error: 'Unsupported network' }, { status: 400 });
      }

      return Response.json({ network, address, balance, timestamp: new Date().toISOString() });
    } catch (err) {
      return Response.json({ error: err.message, network, address }, { status: 500 });
    }
  }

  // ── ACTION: gasprice — gas semua EVM chains real-time ────────────────────
  if (action === 'gasprice') {
    const evmChains = ['ethereum','bsc','polygon','arbitrum','optimism','base','avalanche','fantom'];
    const results = await Promise.allSettled(
      evmChains.map(async (chain) => {
        const gwei = await evmGetGasPrice(NETWORKS[chain].rpc);
        return { chain, name: NETWORKS[chain].name, gwei, timestamp: new Date().toISOString() };
      })
    );
    return Response.json({
      gas_prices: results.map((r, i) => r.status === 'fulfilled' ? r.value : { chain: evmChains[i], name: NETWORKS[evmChains[i]]?.name || evmChains[i], gwei: 0, error: true }),
      timestamp: new Date().toISOString(),
    });
  }

  // ── ACTION: bankrates — kurs IDR + info bank Indonesia ──────────────────
  if (action === 'bankrates') {
    const [idrData, btcTicker, ethTicker, solTicker, bnbTicker] = await Promise.allSettled([
      fetchIDRRate(),
      fetchBinancePrice('BTCUSDT'),
      fetchBinancePrice('ETHUSDT'),
      fetchBinancePrice('SOLUSDT'),
      fetchBinancePrice('BNBUSDT'),
    ]);

    const idr = idrData.status === 'fulfilled' ? idrData.value : { rate: 16350, source: 'fallback' };

    const mkIDR = (tickerData) => {
      const t = tickerData.status === 'fulfilled' ? tickerData.value : null;
      if (!t?.lastPrice && !t?.price) return null;
      const price = parseFloat(t.lastPrice || t.price || 0);
      return {
        price_usd: price,
        price_idr: Math.round(price * idr.rate),
        change_24h: parseFloat(t.priceChangePercent || 0),
        volume_24h: parseFloat(t.quoteVolume || 0),
      };
    };

    return Response.json({
      idr_rate: idr,
      bank_fees: BANK_FEES,
      bi_fast: { available: true, fee_idr: 2500, max_amount: 250_000_000, hours: '24/7', description: 'BI-FAST transfer antar bank' },
      crypto_idr: {
        BTC:  mkIDR(btcTicker) || null,
        ETH:  mkIDR(ethTicker) || null,
        USDT: { price_usd: 1, price_idr: Math.round(idr.rate), change_24h: 0 },
        SOL:  mkIDR(solTicker) || null,
        BNB:  mkIDR(bnbTicker) || null,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // ── ACTION: txhistory ────────────────────────────────────────────────────
  if (action === 'txhistory') {
    const { network, address, limit = 20 } = body;
    if (!network || !address) return Response.json({ error: 'network & address required' }, { status: 400 });

    try {
      let txs = [];

      if (network === 'solana') {
        const res = await fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit }] }),
        });
        const data = await res.json();
        txs = (data.result || []).map(s => ({
          hash: s.signature, status: s.err ? 'failed' : 'success',
          date: s.blockTime ? new Date(s.blockTime * 1000).toISOString() : null,
          confirmations: s.confirmationStatus === 'finalized' ? 32 : 0,
        }));
      } else if (['bitcoin','litecoin','dogecoin'].includes(network)) {
        const cfg = NETWORKS[network];
        const res = await fetch(`${cfg.rpc}/addrs/${address}/full?limit=${limit}`);
        const data = await res.json();
        txs = (data.txs || []).map(tx => ({
          hash: tx.hash, status: tx.confirmations > 0 ? 'success' : 'pending',
          date: tx.confirmed || tx.received,
          confirmations: tx.confirmations || 0,
          amount: tx.total / 1e8,
        }));
      } else if (network === 'tron') {
        const res = await fetch(`https://apilist.tronscanapi.com/api/transaction?address=${address}&limit=${limit}&sort=-timestamp`);
        const data = await res.json();
        txs = (data.data || []).map(tx => ({
          hash: tx.hash, status: tx.contractRet === 'SUCCESS' ? 'success' : 'failed',
          date: new Date(tx.timestamp).toISOString(),
          amount: (tx.amount || 0) / 1e6,
          type: tx.toAddress === address ? 'received' : 'sent',
        }));
      } else {
        // EVM fallback
        const cfg = NETWORKS[network];
        if (cfg?.explorer) {
          const res = await fetch(`${cfg.explorer}?module=account&action=txlist&address=${address}&sort=desc&offset=${limit}`);
          const data = await res.json();
          if (Array.isArray(data.result)) {
            txs = data.result.map(tx => ({
              hash: tx.hash,
              status: tx.txreceipt_status === '1' ? 'success' : (tx.txreceipt_status === '0' ? 'failed' : 'pending'),
              date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
              amount: Number(BigInt(tx.value || '0')) / 1e18,
              type: tx.from?.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
              from: tx.from, to: tx.to,
            }));
          }
        }
      }

      return Response.json({ network, address, transactions: txs, count: txs.length, timestamp: new Date().toISOString() });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});