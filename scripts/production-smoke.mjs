#!/usr/bin/env node

/**
 * Low-rate, read-only production smoke check for KriptoAman.
 * No wallet signing, writes, validator changes, or chain-state mutations.
 */

const RPC = 'https://rpc.kriptoaman.com';
const SITE = 'https://kriptoaman.com';
const EXPLORER = 'https://explorer.kriptoaman.com';
const EXPECTED_CHAIN_ID = '0x560c';
const timeoutMs = 10000;

async function timedFetch(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return { response, ms: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timer);
  }
}

async function httpCheck(name, url) {
  try {
    const { response, ms } = await timedFetch(url, { method: 'GET', redirect: 'follow' });
    return { name, ok: response.ok, status: response.status, ms };
  } catch (error) {
    return { name, ok: false, status: 0, error: error?.name || 'request_error' };
  }
}

async function rpc(method, params = []) {
  const { response, ms } = await timedFetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'KriptoAman-Production-Smoke/1.0' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(`${method}: HTTP ${response.status} ${JSON.stringify(body.error || {})}`);
  return { result: body.result, ms };
}

const checks = [];
checks.push(await httpCheck('homepage', `${SITE}/`));
checks.push(await httpCheck('auth-readiness', `${SITE}/api/auth/readiness`));
checks.push(await httpCheck('system-status', `${SITE}/SystemStatus`));
checks.push(await httpCheck('explorer-ui', `${EXPLORER}/`));

try {
  const chainId = await rpc('eth_chainId');
  checks.push({ name: 'rpc-chain-id', ok: chainId.result?.toLowerCase() === EXPECTED_CHAIN_ID, value: chainId.result, expected: EXPECTED_CHAIN_ID, ms: chainId.ms });
} catch (error) {
  checks.push({ name: 'rpc-chain-id', ok: false, error: error.message });
}

try {
  const block = await rpc('eth_blockNumber');
  const height = typeof block.result === 'string' ? Number.parseInt(block.result, 16) : NaN;
  checks.push({ name: 'rpc-block-number', ok: Number.isSafeInteger(height) && height >= 0, value: block.result, height, ms: block.ms });
} catch (error) {
  checks.push({ name: 'rpc-block-number', ok: false, error: error.message });
}

const ok = checks.every((check) => check.ok);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), ok, checks }, null, 2));
process.exit(ok ? 0 : 1);
