// Read-only, external ZEVARYQ public RPC browser preflight proof.
// Does not sign, submit transactions, or access any private validator endpoint.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const APPROVED_ORIGINS = Object.freeze([
  'https://explorer.kriptoaman.com',
  'https://kriptoaman.com',
]);
const UNAPPROVED_ORIGIN = 'https://untrusted.invalid';
const PUBLIC_RPC = 'https://rpc.kriptoaman.com/';

function tokens(value) {
  return String(value || '').toLowerCase().split(',').map(item => item.trim()).filter(Boolean);
}

export function assessPreflight(status, headers, origin, approved) {
  const allowOrigin = headers.get('access-control-allow-origin') || '';
  const methods = tokens(headers.get('access-control-allow-methods'));
  const requestHeaders = tokens(headers.get('access-control-allow-headers'));
  if (!approved) {
    const ok = [403, 405].includes(status) && allowOrigin !== '*' && allowOrigin !== origin;
    return { ok, status, origin, approved, reason: ok ? 'unapproved-origin-blocked' : 'unapproved-origin-not-denied' };
  }
  const ok = [200, 204].includes(status) && allowOrigin === origin &&
    methods.includes('post') && requestHeaders.includes('content-type') &&
    !['put', 'patch', 'delete'].some(method => methods.includes(method));
  return { ok, status, origin, approved,
    reason: ok ? 'browser-preflight-verified' : 'browser-preflight-failed',
    allowOrigin, allowMethods: methods, allowHeaders: requestHeaders };
}

export function assessChainPost(status, headers, payload, origin) {
  const allowOrigin = headers.get('access-control-allow-origin') || '';
  const ok = status === 200 && allowOrigin === origin &&
    payload?.jsonrpc === '2.0' && payload?.result === '0x560c' && !payload?.error;
  return { ok, status, chainId: payload?.result ?? null,
    corsOriginMatched: allowOrigin === origin,
    reason: ok ? 'public-chain-id-verified' : 'public-chain-or-cors-failed' };
}

async function timedFetch(fetchImpl, url, options) {
  return fetchImpl(url, { ...options, signal: AbortSignal.timeout(12000), redirect: 'manual' });
}

export async function collectProof({ fetchImpl = fetch, rpcUrl = PUBLIC_RPC } = {}) {
  const checks = [];
  for (const origin of [...APPROVED_ORIGINS, UNAPPROVED_ORIGIN]) {
    const approved = APPROVED_ORIGINS.includes(origin);
    try {
      const response = await timedFetch(fetchImpl, rpcUrl, {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type' },
      });
      checks.push(assessPreflight(response.status, response.headers, origin, approved));
    } catch (error) {
      checks.push({ ok: false, origin, approved, status: null,
        reason: 'preflight-network-error', error: String(error?.message || error) });
    }
  }
  let chainPost;
  try {
    const origin = APPROVED_ORIGINS[0];
    const response = await timedFetch(fetchImpl, rpcUrl, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    });
    const payload = await response.json().catch(() => null);
    chainPost = assessChainPost(response.status, response.headers, payload, origin);
  } catch (error) {
    chainPost = { ok: false, status: null, reason: 'chain-post-network-error',
      error: String(error?.message || error) };
  }
  return { checkedAt: new Date().toISOString(),
    scope: 'public OPTIONS/CORS and read-only eth_chainId only',
    chainIdExpected: '0x560c', checks, chainPost,
    ready: checks.every(check => check.ok) && chainPost.ok };
}

async function main() {
  const proof = await collectProof();
  const destination = resolve(process.env.ZVQ_RPC_CORS_EVIDENCE_DIR || 'artifacts/zvq-rpc-cors');
  await mkdir(destination, { recursive: true });
  await writeFile(join(destination, 'proof.json'), JSON.stringify(proof, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify(proof, null, 2));
  if (!proof.ready) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Public CORS proof could not complete: ' + String(error?.message || error));
    process.exitCode = 1;
  });
}
