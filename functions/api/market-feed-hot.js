import { readSession } from '../_shared/d1-session.js';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

export async function onRequestGet({ env }) {
  if (!env?.AUTH_DB) return json({ status: 'unavailable', code: 'MARKET_DB_MISSING' }, 503);
  try {
    const db = readSession(env.AUTH_DB);
    const row = await db.prepare(
      "SELECT captured_at, source_mode, payload FROM market_feed_hot WHERE id = 'global'",
    ).first();
    if (!row?.payload) return json({ status: 'unavailable', code: 'MARKET_FEED_EMPTY' }, 503);

    const payload = JSON.parse(row.payload);
    const capturedAt = Number(row.captured_at) || Number(payload?.generatedAt) || 0;
    const ageMs = capturedAt > 0 ? Math.max(0, Date.now() - capturedAt) : Infinity;
    if (!Number.isFinite(ageMs) || ageMs > 60_000) {
      return json({
        status: 'unavailable',
        code: 'MARKET_FEED_STALE',
        capturedAt: capturedAt || null,
        ageMs: Number.isFinite(ageMs) ? ageMs : null,
        collectorMode: row.source_mode || null,
      }, 503);
    }

    return json({
      ...payload,
      delivery: {
        apiOwnership: 'KriptoAman',
        readPath: '/api/market-feed-hot',
        collectorMode: row.source_mode,
        ageMs,
      },
    });
  } catch (error) {
    console.error('Market feed read failed', error);
    return json({ status: 'unavailable', code: 'MARKET_FEED_READ_FAILED' }, 503);
  }
}
