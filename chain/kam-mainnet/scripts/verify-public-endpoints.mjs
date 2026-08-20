import { isAdminRpcBlocked } from './rpc-security.mjs';

const rpcUrl = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const explorerUrl = process.env.KAM_EXPLORER_URL || 'https://explorer.kriptoaman.com';
const expectedChainId = '0x560c';

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`${method}: ${data.error.message || 'RPC error'}`);
  return data.result;
}

async function checkExplorer() {
  const response = await fetch(explorerUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Explorer HTTP ${response.status}`);
  return { ok: true, finalUrl: response.url };
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
    result.checks.chainId = { ok: chainId === expectedChainId, value: chainId };

    const block1 = await rpc('eth_blockNumber');
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const block2 = await rpc('eth_blockNumber');
    const n1 = Number.parseInt(block1, 16);
    const n2 = Number.parseInt(block2, 16);
    result.checks.blockProgress = { ok: Number.isFinite(n1) && Number.isFinite(n2) && n2 > n1, from: block1, to: block2 };

    const forbiddenResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'admin_peers', params: [] }),
    });
    const forbiddenPayload = await forbiddenResponse.json().catch(() => null);
    result.checks.adminBlocked = {
      ok: isAdminRpcBlocked(forbiddenResponse.status, forbiddenPayload),
      status: forbiddenResponse.status,
      rpcErrorCode: forbiddenPayload?.error?.code ?? null,
      rpcErrorMessage: forbiddenPayload?.error?.message ?? null,
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
