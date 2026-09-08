const ALLOWED_METHODS = new Set([
  'web3_clientVersion',
  'net_version',
  'eth_chainId',
  'eth_blockNumber',
  'eth_getBalance',
  'eth_getCode',
  'eth_getTransactionCount',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_call',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getLogs',
]);

const MAX_BODY_BYTES = 64 * 1024;
const HEAVY_METHODS = new Set(['eth_getLogs', 'eth_call', 'eth_estimateGas', 'eth_feeHistory']);
const DEVELOPER_CONSOLE_URL = 'https://kriptoaman.com/KAMDeveloper';
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'referrer-policy': 'no-referrer',
      'x-frame-options': 'DENY',
      'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function rpcError(id, code, message, status = 400) {
  return json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, status);
}

function isAllowedRpcItem(item) {
  return item && item.jsonrpc === '2.0' && typeof item.method === 'string' && ALLOWED_METHODS.has(item.method);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/health') {
      return json({
        service: 'kam-public-rpc-gateway',
        network: 'KriptoAman Mainnet Candidate',
        expectedChainId: '0x560c',
        auditOnlyActivation: true,
      });
    }

    // Human/browser navigation gets the full Developer Console while the RPC
    // contract at POST / remains unchanged for wallets, explorers and apps.
    if (request.method === 'GET' && url.pathname === '/') {
      return Response.redirect(DEVELOPER_CONSOLE_URL, 302);
    }

    if (request.method !== 'POST' || url.pathname !== '/') {
      return json({ error: 'JSON-RPC POST only' }, 405, { allow: 'GET, POST, OPTIONS' });
    }

    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return json({ error: 'Content-Type must be application/json' }, 415);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413);

    const clientKey = request.headers.get('cf-connecting-ip') || 'anonymous';
    if (env.RPC_RATE_LIMITER) {
      const { success } = await env.RPC_RATE_LIMITER.limit({ key: clientKey });
      if (!success) return json({ error: 'Rate limit exceeded' }, 429, { 'retry-after': '60' });
    }

    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413);

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return rpcError(null, -32700, 'Parse error');
    }

    const batch = Array.isArray(payload);
    const items = batch ? payload : [payload];
    if (!items.length || items.length > 20) return rpcError(null, -32600, 'Invalid Request');

    for (const item of items) {
      if (!isAllowedRpcItem(item)) {
        return rpcError(item?.id, -32601, 'Method not available on public gateway', 403);
      }
    }

    if (env.RPC_HEAVY_RATE_LIMITER && items.some((item) => HEAVY_METHODS.has(item.method))) {
      const { success } = await env.RPC_HEAVY_RATE_LIMITER.limit({ key: clientKey });
      if (!success) return rpcError(items[0]?.id, -32005, 'Heavy RPC rate limit exceeded', 429);
    }

    if (!env.KAM_RPC_ORIGIN) return json({ error: 'RPC origin not configured' }, 503);

    const upstream = await fetch(env.KAM_RPC_ORIGIN, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: raw,
      redirect: 'error',
    });

    const responseText = await upstream.text();
    return new Response(responseText, {
      status: upstream.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        ...CORS_HEADERS,
      },
    });
  },
};
