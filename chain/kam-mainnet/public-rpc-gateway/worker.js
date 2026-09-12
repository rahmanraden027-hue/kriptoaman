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
const EXPECTED_CHAIN_ID = '0x560c';
const UPSTREAM_TIMEOUT_MS = 2500;
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

async function fetchOrigin(env, body, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  if (!env.KAM_RPC_ORIGIN) throw new Error('origin-not-configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(env.KAM_RPC_ORIGIN, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      redirect: 'error',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function probeOrigin(env) {
  if (!env.KAM_RPC_ORIGIN) {
    return { ready: false, reason: 'origin-not-configured', status: 503 };
  }

  const startedAt = Date.now();
  try {
    const [chainResponse, blockResponse] = await Promise.all([
      fetchOrigin(env, JSON.stringify({ jsonrpc: '2.0', id: 'ready-chain', method: 'eth_chainId', params: [] })),
      fetchOrigin(env, JSON.stringify({ jsonrpc: '2.0', id: 'ready-block', method: 'eth_blockNumber', params: [] })),
    ]);

    if (!chainResponse.ok || !blockResponse.ok) {
      return {
        ready: false,
        reason: 'origin-http-error',
        status: 503,
        probeDurationMs: Date.now() - startedAt,
      };
    }

    const [chainPayload, blockPayload] = await Promise.all([
      chainResponse.json().catch(() => null),
      blockResponse.json().catch(() => null),
    ]);
    const chainId = typeof chainPayload?.result === 'string' ? chainPayload.result.toLowerCase() : null;
    const blockHex = typeof blockPayload?.result === 'string' ? blockPayload.result : null;
    let blockNumber = null;
    try {
      if (blockHex) blockNumber = Number(BigInt(blockHex));
    } catch {
      blockNumber = null;
    }

    if (chainId !== EXPECTED_CHAIN_ID) {
      return {
        ready: false,
        reason: 'chain-id-mismatch',
        status: 503,
        chainId,
        blockNumber: Number.isSafeInteger(blockNumber) ? blockNumber : null,
        probeDurationMs: Date.now() - startedAt,
      };
    }

    if (!Number.isSafeInteger(blockNumber) || blockNumber < 0) {
      return {
        ready: false,
        reason: 'invalid-block-number',
        status: 503,
        chainId,
        blockNumber: null,
        probeDurationMs: Date.now() - startedAt,
      };
    }

    return {
      ready: true,
      reason: 'verified',
      status: 200,
      chainId,
      blockNumber,
      probeDurationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ready: false,
      reason: error?.name === 'AbortError' ? 'origin-timeout' : 'origin-unreachable',
      status: 503,
      probeDurationMs: Date.now() - startedAt,
    };
  }
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
        expectedChainId: EXPECTED_CHAIN_ID,
        auditOnlyActivation: true,
        originConfigured: Boolean(env.KAM_RPC_ORIGIN),
      });
    }

    if (url.pathname === '/ready' && request.method === 'GET') {
      const readiness = await probeOrigin(env);
      return json({
        service: 'kam-public-rpc-gateway',
        network: 'KriptoAman Mainnet Candidate',
        expectedChainId: EXPECTED_CHAIN_ID,
        ready: readiness.ready,
        reason: readiness.reason,
        chainId: readiness.chainId ?? null,
        blockNumber: readiness.blockNumber ?? null,
        probeDurationMs: readiness.probeDurationMs ?? null,
      }, readiness.status);
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

    let upstream;
    try {
      upstream = await fetchOrigin(env, raw);
    } catch (error) {
      if (error?.name === 'AbortError') return json({ error: 'RPC upstream timeout' }, 504);
      return json({ error: 'RPC upstream unavailable' }, 502);
    }

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
