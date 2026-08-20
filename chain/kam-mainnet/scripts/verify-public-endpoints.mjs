import { isAdminRpcBlocked } from './rpc-security.mjs';

const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const explorerUrl = process.env.KAM_EXPLORER_URL || 'https://explorer.kriptoaman.com';
const expectedChainId = '0x560c';

const SENSITIVE_METHOD_PROBES = [
  { namespace: 'admin', method: 'admin_peers', params: [] },
  { namespace: 'debug', method: 'debug_traceTransaction', params: [`0x${'0'.repeat(64)}`, {}] },
  { namespace: 'personal', method: 'personal_listAccounts', params: [] },
  { namespace: 'qbft', method: 'qbft_getValidatorsByBlockNumber', params: ['latest'] },
];

async function rpc(method, params = []) {
  const startedAt = performance.now();
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
  });
  const latencyMs = Math.round(performance.now() - startedAt);
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`${method}: ${data.error.message || 'RPC error'}`);
  return { result: data.result, latencyMs };
}

async function probeBlockedMethod({ namespace, method, params }) {
  const startedAt = performance.now();
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
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
  };
}

async function checkExplorer() {
  const startedAt = performance.now();
  const response = await fetch(explorerUrl, { redirect: 'follow' });
  const latencyMs = Math.round(performance.now() - startedAt);
  if (!response.ok) throw new Error(`Explorer HTTP ${response.status}`);
  return { ok: true, finalUrl: response.url, latencyMs };
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

  try {
    const chainId = await rpc('eth_chainId');
    result.checks.chainId = {
      ok: chainId.result === expectedChainId,
      value: chainId.result,
      latencyMs: chainId.latencyMs,
    };

    const block1 = await rpc('eth_blockNumber');
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const block2 = await rpc('eth_blockNumber');
    const n1 = Number.parseInt(block1.result, 16);
    const n2 = Number.parseInt(block2.result, 16);
    result.checks.blockProgress = {
      ok: Number.isFinite(n1) && Number.isFinite(n2) && n2 > n1,
      from: block1.result,
      to: block2.result,
      firstLatencyMs: block1.latencyMs,
      secondLatencyMs: block2.latencyMs,
    };

    const sensitiveMethods = await Promise.all(SENSITIVE_METHOD_PROBES.map(probeBlockedMethod));
    result.checks.sensitiveMethodsBlocked = {
      ok: sensitiveMethods.every((probe) => probe.ok),
      methods: sensitiveMethods,
    };

    result.checks.explorer = await checkExplorer();
    result.ready = Object.values(result.checks).every((check) => check.ok === true);
  } catch (error) {
    result.error = String(error?.message || error);
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) process.exitCode = 1;
}

main();
