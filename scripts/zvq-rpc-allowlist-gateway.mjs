// Standalone loopback-only JSON-RPC allowlist for the direct IP TLS recovery endpoint.
// No admin, debug, consensus, signing, account, txpool, or transaction submission.
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const APPROVED_ORIGINS = new Set([
  'https://kriptoaman.com',
  'https://explorer.kriptoaman.com',
]);
const METHODS = new Set([
  'eth_chainId', 'eth_blockNumber', 'eth_syncing', 'eth_gasPrice',
  'eth_maxPriorityFeePerGas', 'eth_feeHistory', 'eth_getBalance',
  'eth_getCode', 'eth_getStorageAt', 'eth_getProof', 'eth_getLogs',
  'eth_getTransactionCount', 'eth_getTransactionByHash',
  'eth_getTransactionReceipt', 'eth_getBlockByHash',
  'eth_getBlockByNumber', 'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber', 'eth_getTransactionByBlockHashAndIndex',
  'eth_getTransactionByBlockNumberAndIndex', 'eth_call', 'eth_estimateGas',
  'net_version',
]);
export const MAX_BODY_BYTES = 32 * 1024;

export function validateRpcPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (value.jsonrpc !== '2.0' || !METHODS.has(value.method)) return false;
  if (!(typeof value.id === 'number' && Number.isSafeInteger(value.id)) &&
      !(typeof value.id === 'string' && value.id.length <= 80)) return false;
  if (!Array.isArray(value.params) || value.params.length > 16) return false;
  return true;
}

export function createRpcGateway({ upstreamPort, fetchImpl = fetch } = {}) {
  if (!Number.isInteger(upstreamPort) || upstreamPort < 1 || upstreamPort > 65535) {
    throw new Error('Valid, verified loopback upstreamPort is required');
  }
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && APPROVED_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    const finish = (status, body = '') => {
      if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(body);
    };
    if (req.url !== '/') return finish(404);
    if (req.method === 'OPTIONS') {
      if (!origin || !APPROVED_ORIGINS.has(origin)) return finish(403);
      return finish(204);
    }
    if (req.method !== 'POST') return finish(405);
    if (!/^application\/json(?:\s*;|\s*$)/i.test(String(req.headers['content-type'] ?? ''))) return finish(415);
    const chunks = [];
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > MAX_BODY_BYTES) return finish(413);
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString('utf8');
      let payload;
      try { payload = JSON.parse(body); } catch { return finish(400); }
      if (!validateRpcPayload(payload)) return finish(403);
      const upstream = await fetchImpl(`http://127.0.0.1:${upstreamPort}/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      const upstreamBody = await upstream.text();
      if (upstreamBody.length > 2_000_000) return finish(502);
      if (!upstream.ok) return finish(502);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(
        origin && APPROVED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}
      ) });
      return res.end(upstreamBody);
    } catch {
      return finish(502);
    }
  });
  server.headersTimeout = 5_000;
  server.requestTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  server.maxConnections = 100;
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const upstreamPort = Number(process.env.ZVQ_UPSTREAM_PORT);
  const gatewayPort = Number(process.env.ZVQ_GATEWAY_PORT ?? 18445);
  if (!Number.isInteger(gatewayPort) || gatewayPort !== 18445) throw new Error('Unexpected gateway port');
  createRpcGateway({ upstreamPort }).listen(gatewayPort, '127.0.0.1', () => {
    console.log('zvq_rpc_readonly_gateway=loopback_ready');
  });
}
