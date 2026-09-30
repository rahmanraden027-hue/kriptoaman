import { primarySession } from '../_shared/d1-session.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS market_feed_hot (
  id TEXT PRIMARY KEY,
  captured_at INTEGER NOT NULL,
  source_mode TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

function hexToBytes(hex) {
  if (typeof hex !== 'string' || !/^[0-9a-f]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function verifySignature(secret, timestamp, rawBody, signatureHex) {
  if (!secret || !/^\d{13}$/.test(timestamp || '')) return false;
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > 30_000) return false;
  const signature = hexToBytes(signatureHex);
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(`${timestamp}.${rawBody}`),
  );
}

function validatePayload(payload) {
  if (payload?.schema !== 'kriptoaman.market-feed.v1') return false;
  if (!['live','degraded'].includes(payload?.status)) return false;
  if (payload?.collector?.ownership !== 'KriptoAman') return false;
  if (payload?.collector?.mode !== 'server-side-websocket') return false;
  if (payload?.collector?.syntheticValues !== false) return false;
  if (payload?.provenance?.marketPriceOrigin !== 'external-trading-venues') return false;
  if (payload?.provenance?.browserDirectVenueAccess !== false) return false;
  if (!Array.isArray(payload?.assets) || payload.assets.length < 5 || payload.assets.length > 50) return false;
  if (!Number.isSafeInteger(payload?.generatedAt) || Math.abs(Date.now() - payload.generatedAt) > 60_000) return false;

  const seen = new Set();
  for (const asset of payload.assets) {
    const symbol = String(asset?.symbol || '').toUpperCase();
    if (!/^[A-Z0-9]{2,12}$/.test(symbol) || seen.has(symbol)) return false;
    seen.add(symbol);
    if (!Number.isFinite(Number(asset?.price)) || Number(asset.price) <= 0) return false;
    if (!Number.isSafeInteger(asset?.observedAt) || asset.observedAt <= 0) return false;
    if (!Number.isInteger(asset?.venueCount) || asset.venueCount < 1 || asset.venueCount > 4) return false;
    if (!Array.isArray(asset?.venues) || asset.venues.length !== asset.venueCount) return false;
    if (!asset.venues.every(venue => ['coinbase','kraken'].includes(venue))) return false;
  }
  return true;
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();
  const timestamp = request.headers.get('x-ka-timestamp') || '';
  const signature = request.headers.get('x-ka-signature') || '';

  if (!env?.AUTH_DB || !env?.MARKET_FEED_INGEST_SECRET) {
    return json({ error: 'Market feed ingest is not configured', code: 'MARKET_FEED_CONFIG_MISSING' }, 503);
  }

  if (!(await verifySignature(env.MARKET_FEED_INGEST_SECRET, timestamp, rawBody, signature))) {
    return json({ error: 'Invalid market feed signature', code: 'MARKET_FEED_SIGNATURE_INVALID' }, 401);
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch {
    return json({ error: 'Invalid JSON', code: 'MARKET_FEED_JSON_INVALID' }, 400);
  }
  if (!validatePayload(payload)) {
    return json({ error: 'Invalid market feed payload', code: 'MARKET_FEED_PAYLOAD_INVALID' }, 400);
  }

  const db = primarySession(env.AUTH_DB);
  await db.prepare(SCHEMA).run();
  await db.prepare(`
    INSERT INTO market_feed_hot (id, captured_at, source_mode, payload, updated_at)
    VALUES ('global', ?, 'server-side-websocket', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      captured_at = excluded.captured_at,
      source_mode = excluded.source_mode,
      payload = excluded.payload,
      updated_at = CURRENT_TIMESTAMP
  `).bind(payload.generatedAt, rawBody).run();

  return json({
    ok: true,
    acceptedAt: Date.now(),
    capturedAt: payload.generatedAt,
    assets: payload.assets.length,
    status: payload.status,
  });
}

export { validatePayload, verifySignature };
