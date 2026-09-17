const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const explorerUrl = (process.env.KAM_EXPLORER_URL || 'https://explorer.kriptoaman.com').replace(/\/$/, '');
const expectedChainId = '0x560c';
const knownTxHash = process.env.KNOWN_TX_HASH || '0x9854d90159013d488190d0f1847596a5dfb7582812f880102f167a1b172b163a';
const timeoutMs = 10000;

function errorMessage(error) {
  return error?.name === 'AbortError' ? 'request_timeout' : String(error?.message || error || 'request_error');
}

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

async function probe(name, task) {
  const started = Date.now();
  try {
    return { name, reachable: true, result: await task(), probeLatencyMs: Date.now() - started };
  } catch (error) {
    return {
      name,
      reachable: false,
      error: errorMessage(error),
      probeLatencyMs: Date.now() - started,
    };
  }
}

function unreachableCheck(result) {
  return {
    ok: false,
    reachable: false,
    error: result.error || 'request_failed',
    latencyMs: result.probeLatencyMs,
  };
}

const report = {
  checkedAt: new Date().toISOString(),
  rpcUrl,
  explorerUrl,
  expectedChainId,
  classification: 'unknown',
  checks: {},
};

const probes = await Promise.all([
  probe('chain', () => rpc('eth_chainId')),
  probe('head', () => rpc('eth_blockNumber')),
  probe('receipt', () => rpc('eth_getTransactionReceipt', [knownTxHash])),
  probe('blocks', () => fetchJson(`${explorerUrl}/api/v2/blocks`, { headers: { accept: 'application/json' } })),
  probe('stats', () => fetchJson(`${explorerUrl}/api/v2/stats`, { headers: { accept: 'application/json' } })),
  probe('transactionChart', () => fetchJson(`${explorerUrl}/api/v2/stats/charts/transactions`, { headers: { accept: 'application/json' } })),
  probe('marketChart', () => fetchJson(`${explorerUrl}/api/v2/stats/charts/market`, { headers: { accept: 'application/json' } })),
]);

const results = Object.fromEntries(probes.map((entry) => [entry.name, entry]));
const chain = results.chain;
const head = results.head;
const receipt = results.receipt;
const blocks = results.blocks;
const stats = results.stats;
const transactionChart = results.transactionChart;
const marketChart = results.marketChart;

report.checks.rpcChainId = chain.reachable
  ? {
      ok: chain.result.response.ok && chain.result.payload?.result?.toLowerCase() === expectedChainId,
      reachable: true,
      httpStatus: chain.result.response.status,
      value: chain.result.payload?.result ?? null,
      latencyMs: chain.result.latencyMs,
    }
  : unreachableCheck(chain);

const rpcHeight = head.reachable ? Number.parseInt(head.result.payload?.result, 16) : NaN;
report.checks.rpcHead = head.reachable
  ? {
      ok: head.result.response.ok && Number.isFinite(rpcHeight),
      reachable: true,
      httpStatus: head.result.response.status,
      height: Number.isFinite(rpcHeight) ? rpcHeight : null,
      hex: head.result.payload?.result ?? null,
      latencyMs: head.result.latencyMs,
    }
  : unreachableCheck(head);

report.checks.knownTransactionReceipt = receipt.reachable
  ? {
      ok: receipt.result.response.ok && Boolean(receipt.result.payload?.result),
      advisory: true,
      reachable: true,
      httpStatus: receipt.result.response.status,
      transactionHash: knownTxHash,
      blockNumber: receipt.result.payload?.result?.blockNumber ?? null,
      status: receipt.result.payload?.result?.status ?? null,
      latencyMs: receipt.result.latencyMs,
    }
  : {
      ...unreachableCheck(receipt),
      advisory: true,
      transactionHash: knownTxHash,
    };

const blockItems = blocks.reachable && Array.isArray(blocks.result.payload?.items)
  ? blocks.result.payload.items
  : [];
const firstBlock = blockItems[0] ?? null;
const explorerHeight = Number(firstBlock?.height);
report.checks.explorerBlocksApi = blocks.reachable
  ? {
      ok: blocks.result.response.ok && Array.isArray(blocks.result.payload?.items),
      reachable: true,
      httpStatus: blocks.result.response.status,
      itemCount: Array.isArray(blocks.result.payload?.items) ? blocks.result.payload.items.length : null,
      height: Number.isFinite(explorerHeight) ? explorerHeight : null,
      latencyMs: blocks.result.latencyMs,
    }
  : unreachableCheck(blocks);

report.checks.explorerStatsApi = stats.reachable
  ? {
      ok: stats.result.response.ok && Boolean(stats.result.payload) && typeof stats.result.payload === 'object',
      reachable: true,
      httpStatus: stats.result.response.status,
      transactionsToday: stats.result.payload?.transactions_today ?? null,
      totalTransactions: stats.result.payload?.total_transactions ?? null,
      latencyMs: stats.result.latencyMs,
    }
  : unreachableCheck(stats);

report.checks.explorerTransactionsChartApi = transactionChart.reachable
  ? {
      ok: transactionChart.result.response.ok && Array.isArray(transactionChart.result.payload?.chart_data),
      reachable: true,
      httpStatus: transactionChart.result.response.status,
      pointCount: Array.isArray(transactionChart.result.payload?.chart_data)
        ? transactionChart.result.payload.chart_data.length
        : null,
      latencyMs: transactionChart.result.latencyMs,
    }
  : unreachableCheck(transactionChart);

report.checks.explorerMarketChartApi = marketChart.reachable
  ? {
      ok: marketChart.result.response.ok && Array.isArray(marketChart.result.payload?.chart_data),
      reachable: true,
      httpStatus: marketChart.result.response.status,
      pointCount: Array.isArray(marketChart.result.payload?.chart_data)
        ? marketChart.result.payload.chart_data.length
        : null,
      latencyMs: marketChart.result.latencyMs,
    }
  : unreachableCheck(marketChart);

// Verify a live block that exists in both sources. This is a stronger core-data
// invariant than relying on one historical transaction receipt, which may be
// unavailable after node/indexer recovery while the current chain is healthy.
let commonExplorerBlock = null;
if (Number.isFinite(rpcHeight)) {
  commonExplorerBlock = blockItems.find((item) => {
    const height = Number(item?.height);
    return Number.isFinite(height) && height <= rpcHeight;
  }) ?? null;
}

if (commonExplorerBlock) {
  const commonHeight = Number(commonExplorerBlock.height);
  const explorerHash = String(commonExplorerBlock.hash ?? commonExplorerBlock.block_hash ?? '').toLowerCase();
  const rpcBlockProbe = await probe('commonBlock', () => rpc('eth_getBlockByNumber', [`0x${commonHeight.toString(16)}`, false]));
  if (rpcBlockProbe.reachable) {
    const rpcHash = String(rpcBlockProbe.result.payload?.result?.hash ?? '').toLowerCase();
    report.checks.rpcExplorerBlockIdentity = {
      ok: rpcBlockProbe.result.response.ok && Boolean(explorerHash) && Boolean(rpcHash) && explorerHash === rpcHash,
      reachable: true,
      height: commonHeight,
      explorerHash: explorerHash || null,
      rpcHash: rpcHash || null,
      httpStatus: rpcBlockProbe.result.response.status,
      latencyMs: rpcBlockProbe.result.latencyMs,
    };
  } else {
    report.checks.rpcExplorerBlockIdentity = {
      ...unreachableCheck(rpcBlockProbe),
      height: commonHeight,
      explorerHash: explorerHash || null,
      rpcHash: null,
    };
  }
} else {
  report.checks.rpcExplorerBlockIdentity = {
    ok: false,
    reachable: Boolean(blocks.reachable && head.reachable),
    height: null,
    explorerHash: null,
    rpcHash: null,
    error: 'no_common_block_sample',
  };
}

const rpcTransportDown = !chain.reachable && !head.reachable;
const explorerTransportDown = !blocks.reachable && !stats.reachable;

if (rpcTransportDown && explorerTransportDown) {
  report.classification = 'rpc_and_explorer_unreachable';
} else if (rpcTransportDown) {
  report.classification = 'rpc_unreachable';
} else if (!report.checks.rpcChainId.ok || !report.checks.rpcHead.ok) {
  report.classification = 'rpc_unhealthy_or_wrong_chain';
} else if (explorerTransportDown) {
  report.classification = 'explorer_unreachable';
} else if (!report.checks.explorerBlocksApi.ok || !report.checks.explorerStatsApi.ok) {
  report.classification = 'blockscout_backend_or_api_unhealthy';
} else if (!Number.isFinite(explorerHeight)) {
  report.classification = 'blockscout_indexer_not_populating_blocks';
} else {
  const distance = Math.abs(rpcHeight - explorerHeight);
  report.checks.heightDistance = { rpcHeight, explorerHeight, distance };
  if (distance > 5) {
    report.classification = 'blockscout_indexer_lagging';
  } else if (!report.checks.rpcExplorerBlockIdentity.ok) {
    report.classification = 'rpc_explorer_block_identity_mismatch';
  } else if (!report.checks.explorerTransactionsChartApi.ok || !report.checks.explorerMarketChartApi.ok) {
    report.classification = 'blockscout_stats_chart_api_unhealthy';
  } else {
    report.classification = 'healthy';
  }
}

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.classification === 'healthy' ? 0 : 1;
