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

function errorMessage(error) {
  return error?.name === 'AbortError'
    ? 'request_timeout'
    : String(error?.message || error || 'request_error');
}

async function httpCheck(name, url) {
  try {
    const { response, ms } = await timedFetch(url, { method: 'GET', redirect: 'follow' });
    return { name, ok: response.ok, status: response.status, ms };
  } catch (error) {
    return { name, ok: false, status: 0, error: errorMessage(error) };
  }
}

async function jsonHttpCheck(name, url, validate) {
  try {
    const { response, ms } = await timedFetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { accept: 'application/json', 'user-agent': 'KriptoAman-Production-Smoke/1.1' },
    });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return { name, ok: false, status: response.status, ms, error: 'invalid_json' };
    }

    const valid = response.ok && validate(body);
    return {
      name,
      ok: valid,
      status: response.status,
      ms,
      error: valid ? undefined : response.ok ? 'invalid_payload' : `http_${response.status}`,
    };
  } catch (error) {
    return { name, ok: false, status: 0, error: errorMessage(error) };
  }
}

async function rpc(method, params = []) {
  try {
    const { response, ms } = await timedFetch(RPC, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'KriptoAman-Production-Smoke/1.1',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
    });

    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return { ok: false, status: response.status, ms, error: 'invalid_json', result: null };
    }

    if (!response.ok || body?.error) {
      return {
        ok: false,
        status: response.status,
        ms,
        error: body?.error ? `rpc_error:${JSON.stringify(body.error)}` : `http_${response.status}`,
        result: body?.result ?? null,
      };
    }

    return { ok: true, status: response.status, ms, result: body?.result ?? null };
  } catch (error) {
    return { ok: false, status: 0, error: errorMessage(error), result: null };
  }
}

async function validateRpcResult(name, rpcPromise, validate) {
  const call = await rpcPromise;
  if (!call.ok) return { name, ...call };
  return { name, status: call.status, ...validate(call.result, call.ms) };
}

const checks = await Promise.all([
  httpCheck('homepage', `${SITE}/`),
  httpCheck('auth-readiness', `${SITE}/api/auth/readiness`),
  httpCheck('system-status', `${SITE}/SystemStatus`),
  httpCheck('explorer-ui', `${EXPLORER}/`),
  jsonHttpCheck(
    'explorer-blocks-api',
    `${EXPLORER}/api/v2/blocks`,
    (body) => Array.isArray(body?.items) && body.items.length > 0,
  ),
  jsonHttpCheck(
    'explorer-stats-api',
    `${EXPLORER}/api/v2/stats`,
    (body) => Boolean(body) && typeof body === 'object' && !Array.isArray(body),
  ),
  validateRpcResult('rpc-chain-id', rpc('eth_chainId'), (result, ms) => {
    const ok = typeof result === 'string' && result.toLowerCase() === EXPECTED_CHAIN_ID;
    return {
      ok,
      value: result,
      expected: EXPECTED_CHAIN_ID,
      ms,
      error: ok ? undefined : 'unexpected_chain_id',
    };
  }),
  validateRpcResult('rpc-block-number', rpc('eth_blockNumber'), (result, ms) => {
    const height = typeof result === 'string' ? Number.parseInt(result, 16) : NaN;
    const ok = Number.isSafeInteger(height) && height >= 0;
    return {
      ok,
      value: result,
      height: ok ? height : null,
      ms,
      error: ok ? undefined : 'invalid_block_number',
    };
  }),
]);

const ok = checks.every((check) => check.ok);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), ok, checks }, null, 2));
process.exit(ok ? 0 : 1);
