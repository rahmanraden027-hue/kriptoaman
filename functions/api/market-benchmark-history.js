import { primarySession, readSession } from '../_shared/d1-session.js';

const ALLOWED_DAYS = new Set([1, 7, 30, 365]);
const SNAPSHOT_FRESH_MS = 60 * 60 * 1000;
const SNAPSHOT_STALE_MS = 24 * 60 * 60 * 1000;
const MAX_FALLBACK_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8 * 1000;

const SNAPSHOT_SCHEMA = `
CREATE TABLE IF NOT EXISTS market_benchmark_history_snapshots (
  id TEXT PRIMARY KEY,
  asset TEXT NOT NULL,
  days INTEGER NOT NULL,
  captured_at INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

const refreshInFlight = new Map();

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...BASE_HEADERS, ...extraHeaders },
});

async function ensureSchema(db) {
  await db.prepare(SNAPSHOT_SCHEMA).run();
}

async function readSnapshot(db, id) {
  return db.prepare(
    'SELECT asset, days, captured_at, payload FROM market_benchmark_history_snapshots WHERE id = ?',
  ).bind(id).first();
}

function decodeSnapshot(row) {
  if (!row?.payload) return null;
  try {
    const data = JSON.parse(row.payload);
    if (!Array.isArray(data) || data.length < 2) return null;
    return {
      asset: row.asset,
      days: Number(row.days),
      capturedAt: Number(row.captured_at),
      data,
    };
  } catch {
    return null;
  }
}

function freshnessFor(capturedAt) {
  const ageMs = Math.max(0, Date.now() - Number(capturedAt || 0));
  if (ageMs <= SNAPSHOT_FRESH_MS) return { ageMs, freshness: 'live', stale: false, available: true };
  if (ageMs <= SNAPSHOT_STALE_MS) return { ageMs, freshness: 'stale', stale: true, available: true };
  if (ageMs <= MAX_FALLBACK_AGE_MS) return { ageMs, freshness: 'archived', stale: true, available: true };
  return { ageMs, freshness: 'expired', stale: true, available: false };
}

async function fetchBitcoinHistory(days) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = new URL('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('days', String(days));
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Benchmark-History/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`benchmark upstream HTTP ${response.status}`);
    const payload = await response.json();
    const prices = Array.isArray(payload?.prices)
      ? payload.prices
        .map((point) => [Number(point?.[0]), Number(point?.[1])])
        .filter(([ts, price]) => Number.isFinite(ts) && Number.isFinite(price) && price > 0)
      : [];
    if (prices.length < 2) throw new Error('benchmark upstream returned insufficient history');
    return prices;
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshSnapshot(dbBinding, days) {
  const id = `btc:${days}`;
  const data = await fetchBitcoinHistory(days);
  const capturedAt = Date.now();
  if (dbBinding) {
    const db = primarySession(dbBinding);
    await ensureSchema(db);
    await db.prepare(`
      INSERT INTO market_benchmark_history_snapshots (id, asset, days, captured_at, payload, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        asset = excluded.asset,
        days = excluded.days,
        captured_at = excluded.captured_at,
        payload = excluded.payload,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, 'bitcoin', days, capturedAt, JSON.stringify(data)).run();
  }
  return { asset: 'bitcoin', days, capturedAt, data };
}

async function refreshSingleFlight(dbBinding, days) {
  const key = String(days);
  if (!refreshInFlight.has(key)) {
    refreshInFlight.set(key, refreshSnapshot(dbBinding, days).finally(() => refreshInFlight.delete(key)));
  }
  return refreshInFlight.get(key);
}

function responseFromSnapshot(snapshot, source) {
  const state = freshnessFor(snapshot.capturedAt);
  const headers = state.stale
    ? {
        'Cache-Control': 'no-store',
        'X-KriptoAman-Market-Stale': 'true',
        Warning: '110 - "Response is stale"',
      }
    : { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=900' };
  return json({
    asset: snapshot.asset,
    days: snapshot.days,
    capturedAt: snapshot.capturedAt,
    ageMs: state.ageMs,
    freshness: state.freshness,
    stale: state.stale,
    available: state.available,
    source,
    maxFallbackAgeMs: MAX_FALLBACK_AGE_MS,
    prices: snapshot.data,
  }, state.available ? 200 : 503, headers);
}

export async function onRequestGet({ env, request, waitUntil }) {
  const url = new URL(request.url);
  const requestedDays = Number.parseInt(url.searchParams.get('days') || '7', 10);
  const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 7;
  const id = `btc:${days}`;
  let persisted = null;

  if (env.AUTH_DB) {
    try {
      const db = readSession(env.AUTH_DB);
      await ensureSchema(primarySession(env.AUTH_DB));
      persisted = decodeSnapshot(await readSnapshot(db, id));
    } catch (error) {
      console.error('Benchmark persisted read failed', { error });
    }
  }

  if (persisted) {
    const state = freshnessFor(persisted.capturedAt);
    if (!state.stale) return responseFromSnapshot(persisted, 'd1');

    if (typeof waitUntil === 'function') {
      waitUntil(refreshSingleFlight(env.AUTH_DB, days).catch((error) => {
        console.warn('Benchmark background refresh failed', { days, error });
      }));
      return responseFromSnapshot(persisted, state.freshness === 'archived' ? 'd1-archived' : 'd1-stale');
    }

    try {
      const refreshed = await refreshSingleFlight(env.AUTH_DB, days);
      return responseFromSnapshot(refreshed, 'upstream-refresh');
    } catch {
      return responseFromSnapshot(persisted, state.freshness === 'archived' ? 'd1-archived' : 'd1-stale');
    }
  }

  try {
    const refreshed = await refreshSingleFlight(env.AUTH_DB, days);
    return responseFromSnapshot(refreshed, 'upstream-initial');
  } catch (error) {
    console.error('Benchmark history unavailable', { days, error });
    return json({
      error: 'Benchmark history unavailable',
      code: 'BENCHMARK_HISTORY_UNAVAILABLE',
      asset: 'bitcoin',
      days,
    }, 503, { 'Cache-Control': 'no-store', 'Retry-After': '60' });
  }
}
