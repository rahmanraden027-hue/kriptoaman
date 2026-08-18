const NETWORKS = [
  { name: 'Ethereum RPC', type: 'evm', url: 'https://eth.llamarpc.com' },
  { name: 'BNB Chain RPC', type: 'evm', url: 'https://bsc-dataseed.binance.org' },
  { name: 'Polygon RPC', type: 'evm', url: 'https://polygon-rpc.com' },
  { name: 'Arbitrum RPC', type: 'evm', url: 'https://arb1.arbitrum.io/rpc' },
  { name: 'Optimism RPC', type: 'evm', url: 'https://mainnet.optimism.io' },
  { name: 'Base RPC', type: 'evm', url: 'https://mainnet.base.org' },
  { name: 'Avalanche RPC', type: 'evm', url: 'https://api.avax.network/ext/bc/C/rpc' },
  { name: 'Fantom RPC', type: 'evm', url: 'https://rpc.ftm.tools' },
  { name: 'Solana RPC', type: 'solana', url: 'https://api.mainnet-beta.solana.com' },
  { name: 'BlockCypher BTC', type: 'get', url: 'https://api.blockcypher.com/v1/btc/main' },
  { name: 'BlockCypher LTC', type: 'get', url: 'https://api.blockcypher.com/v1/ltc/main' },
  { name: 'BlockCypher DOGE', type: 'get', url: 'https://api.blockcypher.com/v1/doge/main' },
  { name: 'TRON Grid', type: 'get', url: 'https://api.trongrid.io' },
  { name: 'XRP Ledger', type: 'xrp', url: 'https://s1.ripple.com:51234' },
  { name: 'Binance Market Data', type: 'get', url: 'https://api.binance.com/api/v3/time' },
  { name: 'CoinGecko', type: 'get', url: 'https://api.coingecko.com/api/v3/ping' },
  { name: 'ExchangeRate API', type: 'get', url: 'https://api.exchangerate-api.com/v4/latest/USD' },
  { name: 'Open ER API', type: 'get', url: 'https://open.er-api.com/v6/latest/USD' },
  { name: 'Frankfurter', type: 'get', url: 'https://api.frankfurter.app/latest?to=IDR' },
];

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function probe(item) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  const started = Date.now();
  try {
    let response;
    if (item.type === 'evm') {
      response = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
        signal: controller.signal,
      });
    } else if (item.type === 'solana') {
      response = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
        signal: controller.signal,
      });
    } else if (item.type === 'xrp') {
      response = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'server_info', params: [{}] }),
        signal: controller.signal,
      });
    } else {
      response = await fetch(item.url, { method: 'GET', signal: controller.signal });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json().catch(() => null);
    if (item.type === 'evm' && !payload?.result) throw new Error('Invalid EVM RPC response');
    if (item.type === 'solana' && payload?.result !== 'ok') throw new Error('Invalid Solana health response');
    if (item.type === 'xrp' && !payload?.result?.info) throw new Error('Invalid XRP response');

    return { name: item.name, status: 'online', latency: Date.now() - started, checked_at: new Date().toISOString() };
  } catch (error) {
    return { name: item.name, status: 'offline', latency: null, error: error?.name === 'AbortError' ? 'timeout' : 'unavailable', checked_at: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestGet() {
  const networks = await Promise.all(NETWORKS.map(probe));
  const online = networks.filter((item) => item.status === 'online').length;
  const total = networks.length;
  return json({ summary: { total, online, offline: total - online, health_pct: total ? Math.round((online / total) * 100) : 0 }, networks, checked_at: new Date().toISOString() });
}
