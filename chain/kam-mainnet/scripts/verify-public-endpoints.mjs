import { isAdminRpcBlocked } from './rpc-security.mjs';

const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const explorerUrl = process.env.KAM_EXPLORER_URL || 'https://explorer.kriptoaman.com';
const expectedChainId = '0x560c';
const corsProbeOrigin = process.env.KAM_CORS_PROBE_ORIGIN || 'https://kriptoaman.com';
const maxExplorerDistanceBlocks = Number.parseInt(process.env.KAM_EXPLORER_MAX_DISTANCE_BLOCKS || '5', 10);
const maxRpcLatencyMs = Number.parseInt(process.env.KAM_RPC_MAX_LATENCY_MS || '5000', 10);
const maxExplorerLatencyMs = Number.parseInt(process.env.KAM_EXPLORER_MAX_LATENCY_MS || '8000', 10);

const SENSITIVE_METHOD_PROBES = [
  { namespace: 'admin', method: 'admin_peers', params: [] },
  { namespace: 'debug', method: 'debug_traceTransaction', params: [`0x${'0'.repeat(64)}`, {}] },
  { namespace: 'personal', method: 'personal_listAccounts', params: [] },
  { namespace: 'qbft', method: 'qbft_getValidatorsByBlockNumber', params: ['latest'] },
];

const EXPLORER_ROUTES = ['/', '/blocks', '/transactions', '/addresses', '/validators', '/status'];

function messageFrom(error) {
  return String(error?.message || error);
}

function timedSignal(timeoutMs) {
  return AbortSignal.timeout(Math.max(1000, timeoutMs));
}

async function safeCheck(fn) {
  try {
    return await fn();
  } catch (error) {
    return { ok: false, error: messageFrom(error) };
  }
}

async function rpc(method, params = []) {
  const startedAt = performance.now();
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
    signal: timedSignal(maxRpcLatencyMs + 1000),
  });
  const latencyMs = Math.round(performance.now() - startedAt);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.error || payload?.reason || payload?.message || null;
    throw new Error(`${method}: HTTP ${response.status}${detail ? ` (${detail})` : ''}`);
  }
  if (payload?.error) throw new Error(`${method}: ${payload.error.message || 'RPC error'}`);
  return { result: payload?.result, latencyMs };
}

async function checkGatewayEndpoint(path) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${rpcUrl.replace(/\/$/, '')}${path}`, {
      redirect: 'follow',
      signal: timedSignal(maxRpcLatencyMs + 1000),
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, latencyMs, payload };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Math.round(performance.now() - startedAt),
      error: messageFrom(error),
      payload: null,
    };
  }
}

async function checkCorsPreflight() {
  const startedAt = performance.now();
  const response = await fetch(rpcUrl, {
    method: 'OPTIONS',
    headers: {
      origin: corsProbeOrigin,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
    signal: timedSignal(maxRpcLatencyMs + 1000),
  });
  const latencyMs = Math.round(performance.now() - startedAt);
  const allowOrigin = response.headers.get('access-control-allow-origin');
  const allowMethods = response.headers.get('access-control-allow-methods') || '';
  const allowHeaders = response.headers.get('access-control-allow-headers') || '';
  const originAllowed = allowOrigin === '*' || allowOrigin === corsProbeOrigin;
  const methodAllowed = allowMethods.toUpperCase().split(',').map((value) => value.trim()).includes('POST');
  const headerAllowed = allowHeaders.toLowerCase().split(',').map((value) => value.trim()).includes('content-type');

  return {
    ok: response.ok
      && originAllowed
      && methodAllowed
      && headerAllowed
      && latencyMs <= maxRpcLatencyMs,
    status: response.status,
    probeOrigin: corsProbeOrigin,
    allowOrigin,
    allowMethods,
    allowHeaders,
    latencyMs,
    maxLatencyMs: maxRpcLatencyMs,
  };
}

async function probeBlockedMethod({ namespace, method, params }) {
  const startedAt = performance.now();
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
    signal: timedSignal(maxRpcLatencyMs + 1000),
  });
  const latencyMs = Math.round(performance.now() - startedAt);
  const payload = await response.json().catch(() => null);
  return {
    namespace,
    method,
    ok: isAdminRpcBlocked(response.status, payload),
    status: response.status,
    rpcErrorCode: payload?.error?.code ?? null,
    rpcErrorMessage: payload?.error?.message ?? null,
    latencyMs,
    latencyWithinLimit: latencyMs <= maxRpcLatencyMs,
    maxLatencyMs: maxRpcLatencyMs,
  };
}

async function checkExplorerRoute(path) {
  const url = `${explorerUrl.replace(/\/$/, '')}${path === '/' ? '' : path}`;
  const startedAt = performance.now();
  const response = await fetch(url, {
    redirect: 'follow',
    signal: timedSignal(maxExplorerLatencyMs),
  });
  const latencyMs = Math.round(performance.now() - startedAt);
  await response.body?.cancel().catch(() => {});
  return {
    path,
    url,
    ok: response.ok && latencyMs <= maxExplorerLatencyMs,
    status: response.status,
    finalUrl: response.url,
    latencyMs,
    maxLatencyMs: maxExplorerLatencyMs,
  };
}

async function checkExplorerJson(path, predicate, summarize = () => ({})) {
  const url = `${explorerUrl.replace(/\/$/, '')}${path}`;
  const startedAt = performance.now();
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    redirect: 'follow',
    signal: timedSignal(maxExplorerLatencyMs),
  });
  const latencyMs = Math.round(performance.now() - startedAt);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const payload = await response.json();
  return {
    path,
    url,
    ok: Boolean(predicate(payload)) && latencyMs <= maxExplorerLatencyMs,
    status: response.status,
    latencyMs,
    maxLatencyMs: maxExplorerLatencyMs,
    ...summarize(payload),
  };
}

async function main() {
  const result = {
    checkedAt: new Date().toISOString(),
    rpcUrl,
    explorerUrl,
    expectedChainId,
    checks: {},
    ready: false,
  };

  result.checks.gatewayHealth = await checkGatewayEndpoint('/health');
  result.checks.gatewayReady = await checkGatewayEndpoint('/ready');
  result.checks.cors = await safeCheck(checkCorsPreflight);

  result.checks.chainId = await safeCheck(async () => {
    const chainId = await rpc('eth_chainId');
    return {
      ok: chainId.result === expectedChainId && chainId.latencyMs <= maxRpcLatencyMs,
      value: chainId.result,
      latencyMs: chainId.latencyMs,
      maxLatencyMs: maxRpcLatencyMs,
    };
  });

  let latestRpcBlockHex = null;
  result.checks.blockProgress = await safeCheck(async () => {
    const block1 = await rpc('eth_blockNumber');
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const block2 = await rpc('eth_blockNumber');
    latestRpcBlockHex = block2.result;
    const n1 = Number.parseInt(block1.result, 16);
    const n2 = Number.parseInt(block2.result, 16);
    return {
      ok: Number.isFinite(n1)
        && Number.isFinite(n2)
        && n2 > n1
        && block1.latencyMs <= maxRpcLatencyMs
        && block2.latencyMs <= maxRpcLatencyMs,
      from: block1.result,
      to: block2.result,
      firstLatencyMs: block1.latencyMs,
      secondLatencyMs: block2.latencyMs,
      maxLatencyMs: maxRpcLatencyMs,
    };
  });

  result.checks.sensitiveMethodsBlocked = await safeCheck(async () => {
    const methods = await Promise.all(SENSITIVE_METHOD_PROBES.map(async (probe) => {
      try {
        return await probeBlockedMethod(probe);
      } catch (error) {
        return {
          namespace: probe.namespace,
          method: probe.method,
          ok: false,
          error: messageFrom(error),
        };
      }
    }));
    return {
      ok: methods.every((probe) => probe.ok && probe.latencyWithinLimit),
      methods,
      maxLatencyMs: maxRpcLatencyMs,
    };
  });

  const explorerRoutes = await Promise.all(EXPLORER_ROUTES.map(async (path) => safeCheck(() => checkExplorerRoute(path))));
  result.checks.explorerRoutes = {
    ok: explorerRoutes.every((route) => route.ok),
    routes: explorerRoutes,
  };

  const [blocksApi, transactionsApi, statsApi] = await Promise.all([
    safeCheck(() => checkExplorerJson(
      '/api/v2/blocks',
      (payload) => Array.isArray(payload?.items),
      (payload) => ({
        itemCount: payload.items.length,
        latestHeight: payload.items.length ? Number(payload.items[0]?.height) : null,
      }),
    )),
    safeCheck(() => checkExplorerJson(
      '/api/v2/transactions',
      (payload) => Array.isArray(payload?.items),
      (payload) => ({ itemCount: payload.items.length }),
    )),
    safeCheck(() => checkExplorerJson(
      '/api/v2/stats',
      (payload) => Boolean(payload) && typeof payload === 'object' && !Array.isArray(payload),
      () => ({}),
    )),
  ]);

  result.checks.explorerApis = {
    ok: blocksApi.ok && transactionsApi.ok && statsApi.ok,
    blocks: blocksApi,
    transactions: transactionsApi,
    stats: statsApi,
  };

  result.checks.explorerHeight = (() => {
    const explorerHeight = Number(blocksApi?.latestHeight);
    const rpcHeight = latestRpcBlockHex ? Number.parseInt(latestRpcBlockHex, 16) : Number.NaN;
    if (!Number.isFinite(rpcHeight)) {
      return {
        ok: false,
        error: 'rpc-block-unavailable',
        explorerHeight: Number.isFinite(explorerHeight) ? explorerHeight : null,
        maxDistanceBlocks: maxExplorerDistanceBlocks,
      };
    }
    if (!Number.isFinite(explorerHeight)) {
      return {
        ok: false,
        error: 'explorer-height-unavailable',
        rpcHeight,
        maxDistanceBlocks: maxExplorerDistanceBlocks,
      };
    }
    const distanceBlocks = Math.abs(rpcHeight - explorerHeight);
    return {
      ok: Number.isFinite(maxExplorerDistanceBlocks)
        && maxExplorerDistanceBlocks >= 0
        && distanceBlocks <= maxExplorerDistanceBlocks,
      rpcHeight,
      explorerHeight,
      distanceBlocks,
      maxDistanceBlocks: maxExplorerDistanceBlocks,
    };
  })();

  result.ready = Boolean(
    result.checks.gatewayHealth?.ok
    && result.checks.gatewayReady?.ok
    && result.checks.cors?.ok
    && result.checks.chainId?.ok
    && result.checks.blockProgress?.ok
    && result.checks.sensitiveMethodsBlocked?.ok
    && result.checks.explorerRoutes?.ok
    && result.checks.explorerApis?.ok
    && result.checks.explorerHeight?.ok
  );

  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) process.exitCode = 1;
}

main();
