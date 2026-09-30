// Strict read-only JSON-RPC allowlist for ZEVARYQ public gateways.
// QoryVEx exposes only two read-only GET paths backed by the loopback first-party indexer.
// No admin, debug, consensus, signing, account, txpool, or transaction submission.
import http from 'node:http';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const APPROVED_ORIGINS = new Set([
  'https://kriptoaman.com',
  'https://www.kriptoaman.com',
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
const DISCOVERY_ROUTES = new Map([
  ['/qoryvex/v1/discovery', 'http://127.0.0.1:8765/v1/discovery'],
  ['/qoryvex/health', 'http://127.0.0.1:8765/health'],
]);
export const MAX_BODY_BYTES = 32 * 1024;
export const MAX_DISCOVERY_BYTES = 2_000_000;

function isPrivateIpv4(hostname) {
  if (isIP(hostname) !== 4) return false;
  const octets = hostname.split('.').map(Number);
  return octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

export function validateUpstreamUrl(value) {
  if (value === 'https://rpc.kriptoaman.com/') return value;
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || url.username || url.password || url.port ||
        url.pathname !== '/rpc' || url.search || url.hash ||
        !isPrivateIpv4(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function validateRpcPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (value.jsonrpc !== '2.0' || !METHODS.has(value.method)) return false;
  if (!(typeof value.id === 'number' && Number.isSafeInteger(value.id)) &&
      !(typeof value.id === 'string' && value.id.length <= 80)) return false;
  if (!Array.isArray(value.params) || value.params.length > 16) return false;
  return true;
}

export function createRpcGateway({ upstreamPort, upstreamUrl, fetchImpl = fetch, discoveryFetchImpl = fetch } = {}) {
  const loopback = Number.isInteger(upstreamPort) && upstreamPort >= 1 && upstreamPort <= 65535
    ? `http://127.0.0.1:${upstreamPort}/` : null;
  const remote = validateUpstreamUrl(upstreamUrl);
  if ((loopback ? 1 : 0) + (remote ? 1 : 0) !== 1) {
    throw new Error('Exactly one verified loopback port or approved ZVQ RPC upstream URL is required');
  }
  const target = loopback ?? remote;
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const discoveryTarget = DISCOVERY_ROUTES.get(req.url);
    const isKnownPath = req.url === '/' || Boolean(discoveryTarget);
    if (origin && APPROVED_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', discoveryTarget ? 'GET, OPTIONS' : 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    const finish = (status, body = '') => {
      if (!res.headersSent) res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(body);
    };

    if (req.method === 'OPTIONS') {
      if (!isKnownPath || !origin || !APPROVED_ORIGINS.has(origin)) return finish(403);
      return finish(204);
    }

    if (discoveryTarget) {
      if (req.method !== 'GET') return finish(405);
      try {
        const upstream = await discoveryFetchImpl(discoveryTarget, {
          method: 'GET',
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(8_000),
        });
        const upstreamBody = await upstream.text();
        if (upstreamBody.length > MAX_DISCOVERY_BYTES) return finish(502);
        if (![200, 503].includes(upstream.status)) return finish(502);
        res.writeHead(upstream.status, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'X-KriptoAman-Source': 'first-party-zvq-indexer',
          ...(origin && APPROVED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
        });
        return res.end(upstreamBody);
      } catch {
        return finish(502);
      }
    }

    if (req.url !== '/') return finish(404);
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
      const upstream = await fetchImpl(target, {
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
  const upstreamPort = process.env.ZVQ_UPSTREAM_PORT ? Number(process.env.ZVQ_UPSTREAM_PORT) : undefined;
  const upstreamUrl = process.env.ZVQ_UPSTREAM_URL;
  const gatewayPort = Number(process.env.ZVQ_GATEWAY_PORT ?? 18445);
  if (![18445, 18446].includes(gatewayPort)) throw new Error('Unexpected gateway port');
  createRpcGateway({ upstreamPort, upstreamUrl }).listen(gatewayPort, '127.0.0.1', () => {
    console.log('zvq_rpc_readonly_gateway=loopback_ready');
  });
}
