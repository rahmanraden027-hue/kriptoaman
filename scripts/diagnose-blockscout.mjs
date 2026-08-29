const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const explorerUrl = (process.env.KAM_EXPLORER_URL || 'https://explorer.kriptoaman.com').replace(/\/$/, '');
const expectedChainId = '0x560c';
const knownTxHash = process.env.KNOWN_TX_HASH || '0x90dbcf26bfc0c9398b2a2b235e4f5d9de6dc7151bfbf9b662ba79a1af0c0f33e';
const timeoutMs = 10000;

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch {}
    return { response, payload, text, latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function rpc(method, params = []) {
  return fetchJson(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
  });
}

const report = {
  checkedAt: new Date().toISOString(),
  rpcUrl,
  explorerUrl,
  expectedChainId,
  classification: 'unknown',
  checks: {},
};

try {
  const [chain, head, receipt, blocks, stats] = await Promise.all([
    rpc('eth_chainId'),
    rpc('eth_blockNumber'),
    rpc('eth_getTransactionReceipt', [knownTxHash]),
    fetchJson(`${explorerUrl}/api/v2/blocks`, { headers: { accept: 'application/json' } }),
    fetchJson(`${explorerUrl}/api/v2/stats`, { headers: { accept: 'application/json' } }),
  ]);

  const rpcHeight = Number.parseInt(head.payload?.result, 16);
  const firstBlock = Array.isArray(blocks.payload?.items) ? blocks.payload.items[0] : null;
  const explorerHeight = Number(firstBlock?.height);

  report.checks.rpcChainId = {
    ok: chain.response.ok && chain.payload?.result === expectedChainId,
    httpStatus: chain.response.status,
    value: chain.payload?.result ?? null,
    latencyMs: chain.latencyMs,
  };
  report.checks.rpcHead = {
    ok: head.response.ok && Number.isFinite(rpcHeight),
    httpStatus: head.response.status,
    height: Number.isFinite(rpcHeight) ? rpcHeight : null,
    hex: head.payload?.result ?? null,
    latencyMs: head.latencyMs,
  };
  report.checks.knownTransactionReceipt = {
    ok: receipt.response.ok && Boolean(receipt.payload?.result),
    httpStatus: receipt.response.status,
    transactionHash: knownTxHash,
    blockNumber: receipt.payload?.result?.blockNumber ?? null,
    status: receipt.payload?.result?.status ?? null,
    latencyMs: receipt.latencyMs,
  };
  report.checks.explorerBlocksApi = {
    ok: blocks.response.ok,
    httpStatus: blocks.response.status,
    itemCount: Array.isArray(blocks.payload?.items) ? blocks.payload.items.length : null,
    height: Number.isFinite(explorerHeight) ? explorerHeight : null,
    latencyMs: blocks.latencyMs,
  };
  report.checks.explorerStatsApi = {
    ok: stats.response.ok,
    httpStatus: stats.response.status,
    latencyMs: stats.latencyMs,
  };

  if (!report.checks.rpcChainId.ok || !report.checks.rpcHead.ok) {
    report.classification = 'rpc_unhealthy_or_wrong_chain';
  } else if (!blocks.response.ok || !stats.response.ok) {
    report.classification = 'blockscout_backend_or_api_unhealthy';
  } else if (!Number.isFinite(explorerHeight)) {
    report.classification = 'blockscout_indexer_not_populating_blocks';
  } else {
    const distance = Math.abs(rpcHeight - explorerHeight);
    report.checks.heightDistance = { rpcHeight, explorerHeight, distance };
    report.classification = distance <= 5 ? 'healthy' : 'blockscout_indexer_lagging';
  }
} catch (error) {
  report.classification = 'diagnostic_failed';
  report.error = error?.name === 'AbortError' ? 'request_timeout' : String(error?.message || error);
}

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.classification === 'healthy' ? 0 : 1;
