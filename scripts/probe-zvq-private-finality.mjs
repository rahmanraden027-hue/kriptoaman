import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPECTED_CHAIN_ID = '0x560c';
const PRIVATE_RPC_URL = process.env.KAM_PRIVATE_RPC_URL || 'http://127.0.0.1:8648';
const HASH = /^0x[0-9a-f]{64}$/i;
const HEX = /^0x[0-9a-f]+$/i;

function safeHexNumber(value) {
  if (typeof value !== 'string' || !HEX.test(value)) return null;
  const n = Number.parseInt(value, 16);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

// An explicit finalized RPC tag is evidence only if its canonical block
// independently matches by height and hash. QBFT membership is not finality.
export function canonicalFinality(tagged, canonical, head) {
  const number = safeHexNumber(tagged?.number);
  const canonicalNumber = safeHexNumber(canonical?.number);
  if (number === null || canonicalNumber !== number || !Number.isSafeInteger(head) || number > head) return null;
  if (!HASH.test(tagged?.hash || '') || !HASH.test(canonical?.hash || '')) return null;
  if (tagged.hash.toLowerCase() !== canonical.hash.toLowerCase()) return null;
  return { number, hash: tagged.hash.toLowerCase(), source: 'eth_getBlockByNumber:finalized+canonical' };
}

export async function collectFinalityEvidence(call, checkedAt = new Date().toISOString()) {
  const base = { schemaVersion: 1, checkedAt, source: 'protected-local-read-only-rpc', endpointRedacted: true, chainId: EXPECTED_CHAIN_ID, finalizedBlock: null };
  const chainId = await call('eth_chainId', []);
  if (typeof chainId !== 'string' || chainId.toLowerCase() !== EXPECTED_CHAIN_ID) {
    return { ...base, status: 'unverified', reason: 'chain-id-mismatch' };
  }
  const head = safeHexNumber(await call('eth_blockNumber', []));
  if (head === null) return { ...base, status: 'unverified', reason: 'invalid-head' };
  const scoped = { ...base, latestBlock: head };
  let tagged;
  try {
    tagged = await call('eth_getBlockByNumber', ['finalized', false]);
  } catch {
    return { ...scoped, status: 'unavailable', reason: 'finalized-tag-not-exposed' };
  }
  if (!tagged || safeHexNumber(tagged.number) === null || !HASH.test(tagged.hash || '')) {
    return { ...scoped, status: 'unavailable', reason: 'finalized-tag-not-supported' };
  }
  let canonical;
  try {
    canonical = await call('eth_getBlockByNumber', [tagged.number, false]);
  } catch {
    return { ...scoped, status: 'unavailable', reason: 'canonical-lookup-not-exposed' };
  }
  const proof = canonicalFinality(tagged, canonical, head);
  if (!proof) return { ...scoped, status: 'unverified', reason: 'finalized-canonical-mismatch' };
  return { ...scoped, status: 'verified', finalizedBlock: proof.number, finalitySource: proof.source };
}

async function localRpc(method, params) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), 10000);
  try {
    const response = await fetch(PRIVATE_RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      cache: 'no-store',
      signal: c.signal,
    });
    if (!response.ok) throw new Error('private-rpc-failed');
    const body = await response.json();
    if (body?.error || body?.jsonrpc !== '2.0' || typeof body?.result === 'undefined') throw new Error('private-rpc-invalid');
    return body.result;
  } finally {
    clearTimeout(timer);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = await collectFinalityEvidence(localRpc);
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'unverified') process.exitCode = 1;
  } catch {
    console.log(JSON.stringify({
      schemaVersion: 1, checkedAt: new Date().toISOString(),
      source: 'protected-local-read-only-rpc', endpointRedacted: true,
      status: 'unverified', reason: 'private-rpc-probe-failed', finalizedBlock: null,
    }));
    process.exitCode = 1;
  }
}
