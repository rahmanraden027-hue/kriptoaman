#!/usr/bin/env node
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';

const RPC_URL = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const EXPLORER_URL = process.env.KAM_EXPLORER_URL || 'https://explorer.kriptoaman.com';
const OUT_DIR = process.env.KAM_RESEARCH_OUT || 'research/kam-mainnet/data';

fs.mkdirSync(OUT_DIR, { recursive: true });

async function rpc(method, params = []) {
  const started = performance.now();
  let ok = false;
  let httpStatus = null;
  let error = null;
  let result = null;
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(20000),
    });
    httpStatus = res.status;
    const body = await res.json();
    if (!res.ok || body.error) throw new Error(body?.error?.message || `HTTP ${res.status}`);
    result = body.result;
    ok = true;
  } catch (e) {
    error = String(e?.message || e);
  }
  return { method, ok, httpStatus, latencyMs: Number((performance.now() - started).toFixed(2)), result, error };
}

async function getExplorerHead() {
  const started = performance.now();
  let ok = false;
  let httpStatus = null;
  let error = null;
  let blockNumber = null;
  try {
    const url = `${EXPLORER_URL}/api/v2/blocks?type=block`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    httpStatus = res.status;
    const body = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const item = Array.isArray(body?.items) ? body.items[0] : null;
    if (item?.height != null) blockNumber = Number(item.height);
    else if (item?.number != null) blockNumber = Number(item.number);
    else throw new Error('Explorer block height not found');
    ok = Number.isFinite(blockNumber);
  } catch (e) {
    error = String(e?.message || e);
  }
  return { ok, httpStatus, latencyMs: Number((performance.now() - started).toFixed(2)), blockNumber, error };
}

const timestamp = new Date().toISOString();
const chainId = await rpc('eth_chainId');
const blockNumber = await rpc('eth_blockNumber');
const syncing = await rpc('eth_syncing');
const peerCount = await rpc('net_peerCount');
const explorer = await getExplorerHead();

const rpcBlock = blockNumber.ok && typeof blockNumber.result === 'string' ? Number.parseInt(blockNumber.result, 16) : null;
const rpcChainId = chainId.ok && typeof chainId.result === 'string' ? Number.parseInt(chainId.result, 16) : null;
const explorerDelta = Number.isFinite(rpcBlock) && Number.isFinite(explorer.blockNumber)
  ? Math.abs(rpcBlock - explorer.blockNumber)
  : null;

const sample = {
  timestamp,
  rpcUrl: RPC_URL,
  explorerUrl: EXPLORER_URL,
  expectedChainId: 22028,
  chainId: rpcChainId,
  chainIdMatches: rpcChainId === 22028,
  rpcBlockNumber: rpcBlock,
  explorerBlockNumber: explorer.blockNumber,
  explorerBlockDelta: explorerDelta,
  explorerConsistent: explorerDelta == null ? null : explorerDelta <= 5,
  syncing: syncing.ok ? syncing.result : null,
  peerCount: peerCount.ok && typeof peerCount.result === 'string' ? Number.parseInt(peerCount.result, 16) : null,
  rpcChecks: [chainId, blockNumber, syncing, peerCount].map(({ method, ok, httpStatus, latencyMs, error }) => ({ method, ok, httpStatus, latencyMs, error })),
  explorerCheck: explorer,
  sampleHealthy: chainId.ok && blockNumber.ok && syncing.ok && rpcChainId === 22028 && explorer.ok,
};

const fileSafe = timestamp.replace(/[:.]/g, '-');
fs.writeFileSync(`${OUT_DIR}/sample-${fileSafe}.json`, JSON.stringify(sample, null, 2) + '\n');
fs.appendFileSync(`${OUT_DIR}/samples.ndjson`, JSON.stringify(sample) + '\n');

console.log(JSON.stringify(sample, null, 2));
if (!sample.chainIdMatches || !blockNumber.ok) process.exitCode = 2;
