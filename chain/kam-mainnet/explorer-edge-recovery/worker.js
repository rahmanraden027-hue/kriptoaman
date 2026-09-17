const EXPECTED_CHAIN_ID = '0x560c';
const DEFAULT_RPC = 'https://rpc.kriptoaman.com';
const API_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'access-control-allow-origin': '*',
};
const SECURITY_HEADERS = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'same-origin',
};

const STATIC_ROUTES = new Map([
  ['/', '/index.html'],
  ['/stats', '/stats.html'],
  ['/tokens', '/tokens.html'],
  ['/developer', '/developer.html'],
  ['/developers', '/developer.html'],
  ['/developer/docs', '/developer-docs.html'],
  ['/developer/examples', '/developer-examples.html'],
  ['/developer/verify', '/developer-verify.html'],
  ['/developer/network.json', '/developer-network.json'],
  ['/addresses', '/addresses.html'],
  ['/validators', '/validators.html'],
  ['/contracts', '/contracts.html'],
  ['/status', '/status.html'],
  ['/blocks', '/blocks.html'],
  ['/txs', '/transactions.html'],
  ['/api-docs', '/api-docs.html'],
]);

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...API_HEADERS, ...extra } });
}

function secure(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  headers.set('x-kam-explorer-edge', 'rpc-recovery-v1');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const hexToBigInt = (value) => {
  try { return typeof value === 'string' && value.startsWith('0x') ? BigInt(value) : BigInt(value ?? 0); }
  catch { return 0n; }
};
const hexToNumber = (value) => Number(hexToBigInt(value));
const hexToDecimalString = (value) => hexToBigInt(value).toString(10);
const isoFromHexTimestamp = (value) => new Date(hexToNumber(value) * 1000).toISOString();
const addressObject = (hash) => hash ? { hash } : null;

async function rpc(env, method, params = [], timeoutMs = 6500) {
  const url = String(env?.KAM_RPC_URL || DEFAULT_RPC).trim() || DEFAULT_RPC;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`);
    const payload = await response.json();
    if (payload?.error) throw new Error(`RPC_${payload.error.code}:${payload.error.message || 'error'}`);
    return payload?.result;
  } finally {
    clearTimeout(timer);
  }
}

function blockItem(block) {
  if (!block) return null;
  const txs = Array.isArray(block.transactions) ? block.transactions : [];
  return {
    height: hexToNumber(block.number),
    hash: block.hash,
    timestamp: isoFromHexTimestamp(block.timestamp),
    tx_count: txs.length,
    miner: addressObject(block.miner),
    gas_used: hexToDecimalString(block.gasUsed),
    gas_limit: hexToDecimalString(block.gasLimit),
    base_fee_per_gas: block.baseFeePerGas ? hexToDecimalString(block.baseFeePerGas) : null,
    size: block.size ? hexToNumber(block.size) : null,
    type: 'block',
    source: 'KAM JSON-RPC',
  };
}

function txItem(tx, block = null, receipt = null) {
  if (!tx) return null;
  const timestamp = block?.timestamp ? isoFromHexTimestamp(block.timestamp) : null;
  const status = receipt?.status === '0x1' ? 'ok' : receipt?.status === '0x0' ? 'error' : null;
  return {
    hash: tx.hash,
    block: tx.blockNumber == null ? null : hexToNumber(tx.blockNumber),
    block_number: tx.blockNumber == null ? null : hexToNumber(tx.blockNumber),
    timestamp,
    from: addressObject(tx.from),
    to: addressObject(tx.to),
    value: hexToDecimalString(tx.value || '0x0'),
    gas: hexToDecimalString(tx.gas || '0x0'),
    gas_price: tx.gasPrice ? hexToDecimalString(tx.gasPrice) : null,
    gas_used: receipt?.gasUsed ? hexToDecimalString(receipt.gasUsed) : null,
    status,
    method: tx.input && tx.input !== '0x' ? tx.input.slice(0, 10) : null,
    type: tx.type ? hexToNumber(tx.type) : null,
    position: tx.transactionIndex == null ? null : hexToNumber(tx.transactionIndex),
    source: 'KAM JSON-RPC',
  };
}

async function latestBlocks(env, count = 12, fullTransactions = true) {
  const chainId = await rpc(env, 'eth_chainId');
  if (String(chainId).toLowerCase() !== EXPECTED_CHAIN_ID) throw new Error(`WRONG_CHAIN:${chainId}`);
  const headHex = await rpc(env, 'eth_blockNumber');
  const head = hexToNumber(headHex);
  const nums = Array.from({ length: Math.min(count, head + 1) }, (_, index) => head - index);
  const blocks = await Promise.all(nums.map((number) => rpc(env, 'eth_getBlockByNumber', [`0x${number.toString(16)}`, fullTransactions])));
  return { chainId, head, blocks: blocks.filter(Boolean) };
}

async function apiBlocks(env) {
  const { blocks } = await latestBlocks(env, 12, true);
  return json({ items: blocks.map(blockItem), next_page_params: null, source: 'KAM JSON-RPC recovery path' });
}

async function apiTransactions(env) {
  const { blocks } = await latestBlocks(env, 14, true);
  const items = [];
  for (const block of blocks) {
    for (const tx of block.transactions || []) {
      items.push(txItem(tx, block));
      if (items.length >= 30) break;
    }
    if (items.length >= 30) break;
  }
  return json({ items, next_page_params: null, source: 'KAM JSON-RPC recovery path', status_policy: 'status is null unless independently verified by a receipt' });
}

async function apiStats(env) {
  const { blocks, head } = await latestBlocks(env, 16, false);
  const stamps = blocks.map((block) => hexToNumber(block.timestamp)).filter(Number.isFinite).sort((a, b) => a - b);
  const deltas = [];
  for (let index = 1; index < stamps.length; index += 1) {
    const delta = stamps[index] - stamps[index - 1];
    if (delta >= 0 && delta < 3600) deltas.push(delta);
  }
  const averageBlockTime = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : null;
  return json({
    total_transactions: null,
    transactions_today: null,
    total_addresses: null,
    average_block_time: averageBlockTime,
    latest_block: head,
    source: 'KAM JSON-RPC recovery path',
    aggregate_policy: 'Indexer-wide aggregates are unavailable and are not fabricated.',
  });
}

async function apiTransactionChart(env) {
  const { blocks } = await latestBlocks(env, 24, true);
  const points = blocks.map((block) => ({
    date: isoFromHexTimestamp(block.timestamp),
    tx_count: Array.isArray(block.transactions) ? block.transactions.length : 0,
    block: hexToNumber(block.number),
  })).reverse();
  return json({ chart_data: points, source: 'Recent verified blocks only', aggregate_policy: 'This is a recent-block sample, not a fabricated daily total.' });
}

async function apiBlockDetail(env, id) {
  const isHash = /^0x[0-9a-fA-F]{64}$/.test(id);
  const block = isHash
    ? await rpc(env, 'eth_getBlockByHash', [id, true])
    : await rpc(env, 'eth_getBlockByNumber', [/^0x/.test(id) ? id : `0x${BigInt(id).toString(16)}`, true]);
  if (!block) return json({ message: 'Block not found' }, 404);
  const item = blockItem(block);
  item.transactions = (block.transactions || []).map((tx) => txItem(tx, block));
  return json(item);
}

async function apiTransactionDetail(env, hash) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return json({ message: 'Invalid transaction hash' }, 400);
  const tx = await rpc(env, 'eth_getTransactionByHash', [hash]);
  if (!tx) return json({ message: 'Transaction not found' }, 404);
  const [receipt, block] = await Promise.all([
    rpc(env, 'eth_getTransactionReceipt', [hash]).catch(() => null),
    tx.blockNumber ? rpc(env, 'eth_getBlockByNumber', [tx.blockNumber, false]).catch(() => null) : Promise.resolve(null),
  ]);
  return json({ ...txItem(tx, block, receipt), receipt, input: tx.input, nonce: tx.nonce ? hexToNumber(tx.nonce) : null });
}

async function apiAddressDetail(env, address) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return json({ message: 'Invalid address' }, 400);
  const [balance, count, code] = await Promise.all([
    rpc(env, 'eth_getBalance', [address, 'latest']),
    rpc(env, 'eth_getTransactionCount', [address, 'latest']),
    rpc(env, 'eth_getCode', [address, 'latest']),
  ]);
  return json({
    hash: address,
    coin_balance: hexToDecimalString(balance),
    transactions_count: hexToNumber(count),
    is_contract: Boolean(code && code !== '0x'),
    source: 'KAM JSON-RPC',
    note: 'Address-wide transfer history requires the Blockscout indexer and is not fabricated here.',
  });
}

async function handleApi(request, env, url) {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') return json({ message: 'Read-only Explorer recovery API' }, 405, { allow: 'GET, HEAD' });
    if (url.pathname === '/api/v2/blocks') return apiBlocks(env);
    if (url.pathname === '/api/v2/transactions') return apiTransactions(env);
    if (url.pathname === '/api/v2/stats') return apiStats(env);
    if (url.pathname === '/api/v2/stats/charts/transactions') return apiTransactionChart(env);
    if (url.pathname === '/api/v2/stats/charts/market') return json({ chart_data: [], source: 'unavailable', note: 'No market-price series is fabricated by Explorer.' });
    if (url.pathname === '/api/v2/tokens') return json({ items: [], next_page_params: null, source: 'indexer unavailable', note: 'Token registry requires indexed data.' });
    let match = url.pathname.match(/^\/api\/v2\/blocks\/(.+)$/);
    if (match) return apiBlockDetail(env, decodeURIComponent(match[1]));
    match = url.pathname.match(/^\/api\/v2\/transactions\/(0x[0-9a-fA-F]{64})$/);
    if (match) return apiTransactionDetail(env, match[1]);
    match = url.pathname.match(/^\/api\/v2\/addresses\/(0x[0-9a-fA-F]{40})$/);
    if (match) return apiAddressDetail(env, match[1]);
    return json({ message: 'This indexed API surface is temporarily unavailable during Blockscout recovery.', source: 'rpc-recovery' }, 503, { 'retry-after': '60' });
  } catch (error) {
    return json({ message: 'Verified KAM data source temporarily unavailable', error: String(error?.message || 'RPC_ERROR'), source: 'rpc-recovery' }, 503, { 'retry-after': '30' });
  }
}

async function assetResponse(request, env, assetPath) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = assetPath;
  assetUrl.search = '';
  return secure(await env.ASSETS.fetch(new Request(assetUrl, { method: request.method, headers: request.headers })));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...API_HEADERS, allow: 'GET, HEAD, OPTIONS' } });
    if (url.pathname === '/edge-health') {
      try {
        const chainId = await rpc(env, 'eth_chainId');
        const block = await rpc(env, 'eth_blockNumber');
        return json({ ok: String(chainId).toLowerCase() === EXPECTED_CHAIN_ID, chainId, blockNumber: hexToNumber(block), mode: 'rpc-recovery-v1' });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error), mode: 'rpc-recovery-v1' }, 503);
      }
    }
    if (url.pathname.startsWith('/api/v2/')) return secure(await handleApi(request, env, url));
    if (request.method !== 'GET' && request.method !== 'HEAD') return secure(new Response('Read-only Explorer', { status: 405, headers: { allow: 'GET, HEAD' } }));

    if (/^\/tx\/0x[0-9a-fA-F]{64}$/.test(url.pathname)) return assetResponse(request, env, '/transaction-detail.html');
    if (/^\/block\/(?:0x[0-9a-fA-F]{64}|0x[0-9a-fA-F]+|[0-9]+)$/.test(url.pathname)) return assetResponse(request, env, '/block-detail.html');
    if (/^\/address\/0x[0-9a-fA-F]{40}$/.test(url.pathname)) return assetResponse(request, env, '/address-detail.html');

    const staticPath = STATIC_ROUTES.get(url.pathname);
    if (staticPath) return assetResponse(request, env, staticPath);
    return secure(await env.ASSETS.fetch(request));
  },
};
