#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const EXPECTED_CHAIN = '0x560c';
const HTTP_RPC = process.env.ZVQ_INDEXER_HTTP_RPC || 'http://127.0.0.1:8545';
const WS_RPC = process.env.ZVQ_INDEXER_WS_RPC || 'ws://127.0.0.1:8546';
const HOST = '127.0.0.1';
const PORT = Number(process.env.ZVQ_INDEXER_PORT || 8765);
const STATE_DIR = process.env.ZVQ_INDEXER_STATE_DIR || '/var/lib/kriptoaman-indexer';
const STATE_FILE = path.join(STATE_DIR, 'zvq-discovery.json');
const MAX_EVENTS = 250;

let ws;
let reconnectTimer;
let reconnectAttempt = 0;
let lastHeadAt = 0;
let lastHead = null;
let events = [];
let latencies = [];
let requestId = 1;

const now = () => Date.now();
const hex = value => Number.parseInt(String(value || '0x0'), 16);
const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
};

async function rpc(method, params = []) {
  const response = await fetch(HTTP_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: requestId++, method, params }),
  });
  if (!response.ok) throw new Error(`RPC ${method} HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(payload.error.message || `RPC ${method} failed`);
  return payload.result;
}

async function persist() {
  await fs.mkdir(STATE_DIR, { recursive: true, mode: 0o750 });
  const payload = {
    version: 1,
    network: 'ZEVARYQ Mainnet',
    chainId: 22028,
    chainIdHex: EXPECTED_CHAIN,
    source: { ownership: 'first-party', transport: 'WebSocket+JSON-RPC', ws: 'local-node', http: 'local-node' },
    head: lastHead,
    lastHeadAt,
    streamFresh: lastHeadAt > 0 && now() - lastHeadAt < 30000,
    events,
    latency: {
      samples: latencies.length,
      p50Ms: percentile(latencies, .50),
      p95Ms: percentile(latencies, .95),
      p99Ms: percentile(latencies, .99),
    },
    publishedAt: now(),
  };
  const temp = `${STATE_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(payload), { mode: 0o640 });
  await fs.rename(temp, STATE_FILE);
}

async function processHead(header) {
  const receivedAt = now();
  const number = hex(header?.number);
  if (!Number.isFinite(number)) return;
  const block = await rpc('eth_getBlockByNumber', [header.number, true]);
  if (!block?.hash) return;

  const blockTimestamp = hex(block.timestamp) * 1000;
  const latency = Math.max(0, receivedAt - blockTimestamp);
  latencies = [...latencies, latency].slice(-500);
  lastHead = { number, hash: block.hash, parentHash: block.parentHash, timestamp: blockTimestamp };

  const next = [];
  for (const tx of Array.isArray(block.transactions) ? block.transactions : []) {
    if (tx?.to != null || !tx?.hash) continue;
    let receipt = null;
    try { receipt = await rpc('eth_getTransactionReceipt', [tx.hash]); } catch {}
    next.push({
      type: 'CONTRACT_CREATION',
      chainId: 22028,
      blockNumber: number,
      blockHash: block.hash,
      txHash: tx.hash,
      from: tx.from || null,
      contractAddress: receipt?.contractAddress || null,
      observedAt: receivedAt,
      confirmationState: 'observed',
    });
  }

  // Same-height replacement means a reorg candidate. Keep the replacement and
  // mark prior events from the displaced block rather than presenting them as final.
  if (events.some(event => event.blockNumber === number && event.blockHash !== block.hash)) {
    events = events.map(event => event.blockNumber === number && event.blockHash !== block.hash
      ? { ...event, confirmationState: 'reorged', reorgDetectedAt: receivedAt }
      : event);
  }

  events = [...next, ...events].slice(0, MAX_EVENTS);
  lastHeadAt = receivedAt;
  await persist();
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  const delay = Math.min(30000, 1000 * (2 ** Math.min(reconnectAttempt, 5)));
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(connect, delay);
}

async function connect() {
  try {
    const chain = await rpc('eth_chainId');
    if (chain !== EXPECTED_CHAIN) throw new Error(`Unexpected chain ${chain}`);
  } catch (error) {
    console.error('chain preflight failed', error.message);
    scheduleReconnect();
    return;
  }

  try {
    ws = new WebSocket(WS_RPC);
  } catch (error) {
    console.error('websocket constructor failed', error.message);
    scheduleReconnect();
    return;
  }

  ws.addEventListener('open', () => {
    reconnectAttempt = 0;
    ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['newHeads'] }));
  });
  ws.addEventListener('message', event => {
    try {
      const payload = JSON.parse(String(event.data));
      if (payload?.method === 'eth_subscription' && payload?.params?.result?.number) {
        processHead(payload.params.result).catch(error => console.error('head processing failed', error.message));
      }
    } catch (error) {
      console.error('websocket message parse failed', error.message);
    }
  });
  ws.addEventListener('close', scheduleReconnect);
  ws.addEventListener('error', () => {
    try { ws.close(); } catch {}
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' || !['/health', '/v1/discovery'].includes(req.url)) {
    res.writeHead(404).end();
    return;
  }
  let state = null;
  try { state = JSON.parse(await fs.readFile(STATE_FILE, 'utf8')); } catch {}
  const fresh = state?.lastHeadAt && now() - state.lastHeadAt < 30000;
  const body = req.url === '/health'
    ? { status: fresh ? 'live' : 'unavailable', chainId: 22028, lastHeadAt: state?.lastHeadAt || null, head: state?.head || null }
    : { ...(state || {}), status: fresh ? 'live' : 'unavailable' };
  res.writeHead(fresh ? 200 : 503, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body));
});

server.listen(PORT, HOST, () => {
  console.log(`KriptoAman ZEVARYQ first-party indexer listening on http://${HOST}:${PORT}`);
  connect();
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    clearTimeout(reconnectTimer);
    try { ws?.close(); } catch {}
    server.close(() => process.exit(0));
  });
}
