const NETWORKS = [
  { name: 'Ethereum RPC', type: 'evm', urls: ['https://eth.llamarpc.com', 'https://ethereum-rpc.publicnode.com'] },
  { name: 'BNB Chain RPC', type: 'evm', urls: ['https://bsc-dataseed.binance.org', 'https://bsc-rpc.publicnode.com'] },
  { name: 'Polygon RPC', type: 'evm', urls: ['https://polygon.drpc.org', 'https://polygon.publicnode.com'] },
  { name: 'Arbitrum RPC', type: 'evm', urls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'] },
  { name: 'Optimism RPC', type: 'evm', urls: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'] },
  { name: 'Base RPC', type: 'evm', urls: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'] },
  { name: 'Avalanche RPC', type: 'evm', urls: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain-rpc.publicnode.com'] },
  { name: 'Fantom RPC', type: 'evm', urls: ['https://rpcapi.fantom.network', 'https://fantom.publicnode.com'] },
  { name: 'Solana RPC', type: 'solana', urls: ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'] },
  { name: 'Bitcoin Network', type: 'bitcoin', urls: ['https://blockstream.info/api/blocks/tip/height', 'https://api.blockcypher.com/v1/btc/main'] },
  { name: 'Litecoin Network', type: 'get', urls: ['https://api.blockchair.com/litecoin/stats', 'https://api.blockcypher.com/v1/ltc/main'] },
  { name: 'Dogecoin Network', type: 'get', urls: ['https://api.blockchair.com/dogecoin/stats', 'https://api.blockcypher.com/v1/doge/main'] },
  { name: 'TRON Grid', type: 'get', urls: ['https://api.trongrid.io', 'https://apilist.tronscanapi.com/api/system/status'] },
  { name: 'XRP Ledger', type: 'xrp', urls: ['https://s1.ripple.com:51234', 'https://xrplcluster.com'] },
  { name: 'Binance Market Data', type: 'get', urls: ['https://data-api.binance.vision/api/v3/time', 'https://api.binance.com/api/v3/time'] },
  { name: 'CoinGecko', type: 'get', urls: ['https://api.coingecko.com/api/v3/ping'] },
  { name: 'ExchangeRate API', type: 'get', urls: ['https://api.exchangerate-api.com/v4/latest/USD'] },
  { name: 'Open ER API', type: 'get', urls: ['https://open.er-api.com/v6/latest/USD'] },
  { name: 'Frankfurter', type: 'get', urls: ['https://api.frankfurter.app/latest?to=IDR'] },
];

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeUrl(item, url) {
  const started = Date.now();
  let response;

  if (item.type === 'evm') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    });
  } else if (item.type === 'solana') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getVersion' }),
    });
  } else if (item.type === 'xrp') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'server_info', params: [{}] }),
    });
  } else {
    response = await fetchWithTimeout(url, { method: 'GET' });
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (item.type === 'bitcoin') {
    const height = Number((await response.text()).trim());
    if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid Bitcoin response');
  } else {
    const payload = await response.json().catch(() => null);
    if (item.type === 'evm' && !payload?.result) throw new Error('Invalid EVM RPC response');
    if (item.type === 'solana' && !payload?.result?.['solana-core']) throw new Error('Invalid Solana response');
    if (item.type === 'xrp' && !payload?.result?.info) throw new Error('Invalid XRP response');
  }

  return {
    name: item.name,
    status: 'online',
    latency: Date.now() - started,
    provider: new URL(url).hostname,
    checked_at: new Date().toISOString(),
  };
}

async function probe(item) {
  const errors = [];
  for (const url of item.urls) {
    try {
      return await probeUrl(item, url);
    } catch (error) {
      errors.push({
        provider: (() => { try { return new URL(url).hostname; } catch { return url; } })(),
        reason: error?.name === 'AbortError' ? 'timeout' : error?.status ? `http_${error.status}` : 'unavailable',
      });
    }
  }

  return {
    name: item.name,
    status: 'offline',
    latency: null,
    error: 'all_providers_unavailable',
    providers_tried: errors,
    checked_at: new Date().toISOString(),
  };
}

export async function onRequestGet() {
  const networks = await Promise.all(NETWORKS.map(probe));
  const online = networks.filter((item) => item.status === 'online').length;
  const total = networks.length;
  return json({
    summary: {
      total,
      online,
      offline: total - online,
      health_pct: total ? Math.round((online / total) * 100) : 0,
    },
    networks,
    checked_at: new Date().toISOString(),
  });
}
