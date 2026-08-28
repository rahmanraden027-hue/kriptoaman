const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const explorerUrl = (process.env.KAM_EXPLORER_URL || 'https://explorer.kriptoaman.com').replace(/\/$/, '');
const expectedChainId = '0x560c';

async function fetchJson(url, options = {}) {
  const started = Date.now();
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text); } catch {}
  return { response, payload, text, latencyMs: Date.now() - started };
}

async function rpc(method) {
  return fetchJson(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params: [] }),
  });
}

function print(name, value) {
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(value, null, 2));
}

async function main() {
  const report = {
    checkedAt: new Date().toISOString(),
    rpcUrl,
    explorerUrl,
    expectedChainId,
    classification: 'unknown',
    checks: {},
  };

  try {
    const chain = await rpc('eth_chainId');
    report.checks.rpcChainId = {
      httpStatus: chain.response.status,
      value: chain.payload?.result ?? null,
      ok: chain.response.ok && chain.payload?.result === expectedChainId,
      latencyMs: chain.latencyMs,
      error: chain.payload?.error ?? null,
    };

    const head = await rpc('eth_blockNumber');
    const rpcHeight = Number.parseInt(head.payload?.result, 16);
    report.checks.rpcHead = {
      httpStatus: head.response.status,
      value: head.payload?.result ?? null,
      height: Number.isFinite(rpcHeight) ? rpcHeight : null,
      ok: head.response.ok && Number.isFinite(rpcHeight),
      latencyMs: head.latencyMs,
      error: head.payload?.error ?? null,
    };

    const blocks = await fetchJson(`${explorerUrl}/api/v2/blocks`, { headers: { accept: 'application/json' } });
    const first = Array.isArray(blocks.payload?.items) ? blocks.payload.items[0] : null;
    const explorerHeight = Number(first?.height);
    report.checks.explorerBlocksApi = {
      httpStatus: blocks.response.status,
      ok: blocks.response.ok,
      itemCount: Array.isArray(blocks.payload?.items) ? blocks.payload.items.length : null,
      height: Number.isFinite(explorerHeight) ? explorerHeight : null,
      latencyMs: blocks.latencyMs,
      bodySample: blocks.payload ?? blocks.text.slice(0, 500),
    };

    const stats = await fetchJson(`${explorerUrl}/api/v2/stats`, { headers: { accept: 'application/json' } });
    report.checks.explorerStatsApi = {
      httpStatus: stats.response.status,
      ok: stats.response.ok,
      latencyMs: stats.latencyMs,
      bodySample: stats.payload ?? stats.text.slice(0, 500),
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
    report.error = String(error?.stack || error);
  }

  print('Blockscout diagnostic', report);
  process.exitCode = report.classification === 'healthy' ? 0 : 1;
}

main();
