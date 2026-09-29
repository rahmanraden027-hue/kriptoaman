import http from 'node:http';
import { WebSocketServer } from 'ws';

const json = (res, status, payload, origin) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
};

const limitOf = (url, fallback, max) => {
  const parsed = Number.parseInt(url.searchParams.get('limit') || '', 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(max, parsed)) : fallback;
};

export function createApiServer({ config, store, state }) {
  const allowedOrigins = new Set(config.allowedOrigins);
  const originFor = (req) => {
    const origin = String(req.headers.origin || '').toLowerCase();
    return allowedOrigins.has(origin) ? origin : '';
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const origin = originFor(req);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '600',
      });
      return res.end();
    }

    if (req.method !== 'GET') return json(res, 405, { error: 'read_only_service' }, origin);
    if (url.pathname === '/health') {
      return json(res, 200, {
        ok: state.ready,
        chain: config.chainName,
        chainId: config.chainId,
        source: config.sourceLabel,
        upstreamWs: state.upstreamWs,
        lastBlock: state.lastBlock,
        lastIndexedAt: state.lastIndexedAt,
      }, origin);
    }
    if (url.pathname === '/v1/status') {
      return json(res, 200, {
        chain: config.chainName,
        chainId: config.chainId,
        source: config.sourceLabel,
        upstream: { http: 'first-party', websocket: state.upstreamWs ? 'connected' : 'fallback-http-polling' },
        lastBlock: state.lastBlock,
        lastBlockHash: state.lastBlockHash,
        lastIndexedAt: state.lastIndexedAt,
        counts: store.counts(),
      }, origin);
    }
    if (url.pathname === '/v1/tokens') return json(res, 200, { items: store.listTokens(limitOf(url, 50, 500)) }, origin);
    if (url.pathname.startsWith('/v1/tokens/')) {
      const address = url.pathname.slice('/v1/tokens/'.length).toLowerCase();
      const item = store.token(address);
      return item ? json(res, 200, item, origin) : json(res, 404, { error: 'token_not_indexed' }, origin);
    }
    if (url.pathname === '/v1/pools') return json(res, 200, { items: store.listPools(limitOf(url, 50, 500)) }, origin);
    if (url.pathname === '/v1/events') {
      const after = Number.parseInt(url.searchParams.get('after') || '0', 10);
      if (Number.isFinite(after) && after > 0) {
        return json(res, 200, { items: store.eventsAfter(after, limitOf(url, 100, 1000)), after }, origin);
      }
      return json(res, 200, { items: store.listEvents(limitOf(url, 100, 1000)) }, origin);
    }
    return json(res, 404, { error: 'not_found' }, origin);
  });

  const wss = new WebSocketServer({ noServer: true, clientTracking: true });
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/stream') return socket.destroy();
    const origin = String(req.headers.origin || '').toLowerCase();
    if (origin && !allowedOrigins.has(origin)) return socket.destroy();
    if (wss.clients.size >= config.maxWsClients) return socket.destroy();
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/stream', `http://${req.headers.host || 'localhost'}`);
    const since = Number.parseInt(url.searchParams.get('since') || '0', 10);
    const lastEventId = store.lastEventId();
    ws.send(JSON.stringify({
      type: 'hello',
      chain: config.chainName,
      chainId: config.chainId,
      source: config.sourceLabel,
      lastBlock: state.lastBlock,
      lastEventId,
      serverTime: new Date().toISOString(),
    }));

    if (Number.isFinite(since) && since > 0 && since < lastEventId) {
      for (const event of store.eventsAfter(since, 1000)) {
        ws.send(JSON.stringify({ type: 'replay', event }));
      }
    }
  });

  const broadcast = (event) => {
    const payload = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(payload);
    }
  };

  return {
    listen() {
      return new Promise((resolve) => server.listen(config.port, config.host, resolve));
    },
    close() {
      for (const client of wss.clients) client.close(1001, 'server_shutdown');
      return new Promise((resolve) => server.close(resolve));
    },
    broadcast,
    websocketClients: () => wss.clients.size,
  };
}
