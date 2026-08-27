const NETWORKS = [
  { name: 'Bitcoin', type: 'bitcoin', urls: ['https://mempool.space/api/blocks/tip/height', 'https://blockstream.info/api/blocks/tip/height'] },
  { name: 'Ethereum', type: 'evm', urls: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'] },
  { name: 'BNB Chain', type: 'evm', urls: ['https://bsc-dataseed.binance.org', 'https://bsc-rpc.publicnode.com'] },
  { name: 'Polygon', type: 'evm', urls: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon.drpc.org'] },
  { name: 'Arbitrum', type: 'evm', urls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'] },
  { name: 'Optimism', type: 'evm', urls: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'] },
  {
    name: 'Base',
    type: 'evm',
    urls: [
      'https://mainnet.base.org',
      'https://base-rpc.publicnode.com',
      'https://base-mainnet.public.blastapi.io',
    ],
  },
  { name: 'Avalanche', type: 'evm', urls: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain-rpc.publicnode.com'] },
  { name: 'Gnosis', type: 'evm', urls: ['https://rpc.gnosischain.com', 'https://gnosis-rpc.publicnode.com'] },
  { name: 'Celo', type: 'evm', urls: ['https://forno.celo.org', 'https://celo-rpc.publicnode.com'] },
  { name: 'Linea', type: 'evm', urls: ['https://rpc.linea.build', 'https://linea-rpc.publicnode.com'] },
  { name: 'Scroll', type: 'evm', urls: ['https://rpc.scroll.io', 'https://scroll-rpc.publicnode.com'] },
  { name: 'Mantle', type: 'evm', urls: ['https://rpc.mantle.xyz', 'https://mantle-rpc.publicnode.com'] },
  { name: 'Fantom', type: 'evm', urls: ['https://rpcapi.fantom.network', 'https://fantom.publicnode.com'] },
  { name: 'Solana', type: 'solana', urls: ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'] },
  { name: 'TRON', type: 'tron', urls: ['https://api.trongrid.io/wallet/getnowblock', 'https://apilist.tronscanapi.com/api/system/status'] },
  { name: 'XRP Ledger', type: 'xrp', urls: ['https://xrplcluster.com', 'https://s1.ripple.com:51234'] },
  { name: 'Polkadot', type: 'polkadot', urls: ['https://rpc.polkadot.io', 'https://polkadot-rpc.publicnode.com'] },
  { name: 'Cardano', type: 'cardano', urls: ['https://api.koios.rest/api/v1/tip'] },
  { name: 'Litecoin', type: 'get-json', urls: ['https://api.blockchair.com/litecoin/stats', 'https://api.blockcypher.com/v1/ltc/main'] },
  { name: 'Dogecoin', type: 'get-json', urls: ['https://api.blockchair.com/dogecoin/stats', 'https://api.blockcypher.com/v1/doge/main'] },
];

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=120, s-maxage=300');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const rpcBody = (method, params = []) => JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });

async function probeUrl(item, url) {
  const started = Date.now();
  let response;

  if (item.type === 'evm') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: rpcBody('eth_blockNumber'),
    });
  } else if (item.type === 'solana') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: rpcBody('getBlockHeight'),
    });
  } else if (item.type === 'xrp') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ method: 'server_info', params: [{}] }),
    });
  } else if (item.type === 'polkadot') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: rpcBody('chain_getHeader'),
    });
  } else if (item.type === 'tron') {
    if (url.includes('/wallet/getnowblock')) {
      response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: '{}',
      });
    } else {
      response = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    }
  } else {
    response = await fetchWithTimeout(url, { headers: { Accept: 'application/json,text/plain,*/*' } });
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  let detail = 'ok';
  if (item.type === 'bitcoin') {
    const height = Number((await response.text()).trim());
    if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid Bitcoin response');
    detail = String(height);
  } else {
    const payload = await response.json().catch(() => null);
    if (item.type === 'evm') {
      if (!payload?.result) throw new Error('Invalid EVM RPC response');
      detail = payload.result;
    } else if (item.type === 'solana') {
      if (!Number.isFinite(Number(payload?.result)) || Number(payload.result) <= 0) throw new Error('Invalid Solana response');
      detail = String(payload.result);
    } else if (item.type === 'xrp') {
      const seq = payload?.result?.info?.validated_ledger?.seq;
      if (!seq) throw new Error('Invalid XRP response');
      detail = String(seq);
    } else if (item.type === 'polkadot') {
      if (!payload?.result?.number) throw new Error('Invalid Polkadot response');
      detail = payload.result.number;
    } else if (item.type === 'tron') {
      const blockNumber = payload?.block_header?.raw_data?.number;
      const tronscanOk = payload?.status === 1 || payload?.data?.status === 1 || payload?.code === 0;
      if (!blockNumber && !tronscanOk) throw new Error('Invalid TRON response');
      detail = blockNumber ? String(blockNumber) : 'ok';
    } else if (item.type === 'cardano') {
      if (!Array.isArray(payload) || !payload[0]?.block_no) throw new Error('Invalid Cardano response');
      detail = String(payload[0].block_no);
    } else if (item.type === 'get-json') {
      const valid = Boolean(payload?.data?.blocks || payload?.height || payload?.name);
      if (!valid) throw new Error('Invalid chain stats response');
    }
  }

  return {
    name: item.name,
    status: 'online',
    latency: Date.now() - started,
    provider: new URL(url).hostname,
    detail,
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
      minimum_active_target: 12,
    },
    networks,
    checked_at: new Date().toISOString(),
  }, { status: online > 0 ? 200 : 503 });
}
