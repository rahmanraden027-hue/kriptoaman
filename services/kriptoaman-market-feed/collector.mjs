#!/usr/bin/env node
import http from 'node:http';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { CORE_SYMBOLS, buildFeedPayload, normalizeObservation, normalizeVenueSymbol } from './model.mjs';

const HOST = '127.0.0.1';
const PORT = Number(process.env.KA_MARKET_FEED_PORT || 8780);
const INGEST_URL = process.env.KA_MARKET_INGEST_URL || '';
const INGEST_SECRET = process.env.KA_MARKET_INGEST_SECRET || '';
const PUBLISH_INTERVAL_MS = Number(process.env.KA_MARKET_PUBLISH_INTERVAL_MS || 5000);
const MAX_OBSERVATION_AGE_MS = 120_000;

const observations = new Map();
const venueStates = {
  coinbase: { connected: false, lastMessageAt: 0, reconnects: 0 },
  kraken: { connected: false, lastMessageAt: 0, reconnects: 0 },
};
const sockets = new Map();
const reconnectTimers = new Map();
let shuttingDown = false;
let publishTimer = null;
let lastPublish = { ok: false, at: null, status: null, error: null };

function observationKey(venue, symbol) {
  return `${venue}:${symbol}`;
}

function upsertObservation(input) {
  const item = normalizeObservation(input);
  if (!item) return false;
  observations.set(observationKey(item.venue, item.symbol), item);
  const cutoff = Date.now() - MAX_OBSERVATION_AGE_MS;
  for (const [key,value] of observations) if (value.observedAt < cutoff) observations.delete(key);
  return true;
}

function wsConnect(name, url, subscribe, parseMessage) {
  if (shuttingDown) return;
  let ws;
  try {
    ws = new WebSocket(url);
  } catch {
    scheduleReconnect(name, url, subscribe, parseMessage);
    return;
  }
  sockets.set(name, ws);

  ws.addEventListener('open', () => {
    venueStates[name].connected = true;
    ws.send(JSON.stringify(subscribe));
  });

  ws.addEventListener('message', event => {
    venueStates[name].lastMessageAt = Date.now();
    try {
      const payload = JSON.parse(String(event.data));
      for (const item of parseMessage(payload)) upsertObservation(item);
    } catch {}
  });

  ws.addEventListener('close', () => {
    venueStates[name].connected = false;
    sockets.delete(name);
    scheduleReconnect(name, url, subscribe, parseMessage);
  });

  ws.addEventListener('error', () => {
    venueStates[name].connected = false;
    try { ws.close(); } catch {}
  });
}

function scheduleReconnect(name, url, subscribe, parseMessage) {
  if (shuttingDown || reconnectTimers.has(name)) return;
  venueStates[name].reconnects += 1;
  const delay = Math.min(30_000, 1000 * 2 ** Math.min(venueStates[name].reconnects, 5));
  const timer = setTimeout(() => {
    reconnectTimers.delete(name);
    wsConnect(name, url, subscribe, parseMessage);
  }, delay);
  reconnectTimers.set(name, timer);
}

function coinbaseRows(payload) {
  const rows = [];
  for (const event of Array.isArray(payload?.events) ? payload.events : []) {
    for (const ticker of Array.isArray(event?.tickers) ? event.tickers : []) {
      const symbol = normalizeVenueSymbol(ticker?.product_id);
      if (!symbol) continue;
      rows.push({
        venue: 'coinbase',
        symbol,
        price: ticker?.price,
        change24h: ticker?.price_percent_chg_24_h,
        volume24h: ticker?.volume_24_h,
        high24h: ticker?.high_24_h,
        low24h: ticker?.low_24_h,
        observedAt: Date.now(),
      });
    }
  }
  return rows;
}

function krakenRows(payload) {
  if (payload?.channel !== 'ticker' || !Array.isArray(payload?.data)) return [];
  return payload.data.map(ticker => ({
    venue: 'kraken',
    symbol: normalizeVenueSymbol(ticker?.symbol),
    price: ticker?.last,
    change24h: ticker?.change_pct,
    volume24h: ticker?.volume,
    high24h: ticker?.high,
    low24h: ticker?.low,
    observedAt: Date.now(),
  })).filter(row => row.symbol);
}

function startVenueStreams() {
  wsConnect(
    'coinbase',
    'wss://advanced-trade-ws.coinbase.com',
    { type: 'subscribe', product_ids: CORE_SYMBOLS.map(s => `${s}-USD`), channel: 'ticker' },
    coinbaseRows,
  );
  wsConnect(
    'kraken',
    'wss://ws.kraken.com/v2',
    { method: 'subscribe', params: { channel: 'ticker', symbol: CORE_SYMBOLS.map(s => `${s}/USD`), snapshot: true } },
    krakenRows,
  );
}

function currentPayload() {
  return buildFeedPayload([...observations.values()], venueStates, Date.now());
}

async function publish() {
  if (!INGEST_URL || !INGEST_SECRET) return;
  const payload = currentPayload();
  if (payload.status === 'unavailable') return;
  const body = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const signature = crypto.createHmac('sha256', INGEST_SECRET).update(`${timestamp}.${body}`).digest('hex');
  try {
    const response = await fetch(INGEST_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ka-timestamp': timestamp,
        'x-ka-signature': signature,
        'user-agent': 'KriptoAman-Market-Feed-Collector/1.0',
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    lastPublish = {
      ok: response.ok,
      at: Date.now(),
      status: response.status,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    console.error('Market feed publish failed', error?.name || 'Error');
    lastPublish = { ok: false, at: Date.now(), status: null, error: 'publish_failed' };
  }
}

const server = http.createServer((req,res) => {
  if (req.method !== 'GET' || !['/health','/v1/hot'].includes(req.url)) {
    res.writeHead(404).end();
    return;
  }
  const feed = currentPayload();
  const body = req.url === '/health'
    ? {
        status: feed.status,
        coverage: feed.coverage,
        venues: feed.venues,
        lastPublish,
        generatedAt: feed.generatedAt,
      }
    : { ...feed, lastPublish };
  res.writeHead(feed.status === 'unavailable' ? 503 : 200, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body));
});

function start() {
  startVenueStreams();
  if (INGEST_URL && INGEST_SECRET) publishTimer = setInterval(() => void publish(), PUBLISH_INTERVAL_MS);
  server.listen(PORT, HOST, () => {
    console.log(`KriptoAman market feed collector listening on http://${HOST}:${PORT}`);
  });
}

function shutdown() {
  shuttingDown = true;
  if (publishTimer) clearInterval(publishTimer);
  for (const timer of reconnectTimers.values()) clearTimeout(timer);
  for (const ws of sockets.values()) try { ws.close(); } catch {}
  server.close(() => process.exit(0));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  start();
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, shutdown);
}

export { coinbaseRows, krakenRows, currentPayload, upsertObservation };
