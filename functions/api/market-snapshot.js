import { primarySession, readSession } from '../_shared/d1-session.js';

const MARKET_ASSET_LIMIT = 5000;
const MIN_ACCEPTED_ASSETS = 4500;
const SNAPSHOT_FRESH_MS = 15 * 60 * 1000;
const SNAPSHOT_REFRESH_AHEAD_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12 * 1000;
const RETRY_DELAYS_MS = [250, 750];
const MARKET_CHUNK_SIZE = 100;
const CHUNK_WRITE_BATCH_SIZE = 10;

const SNAPSHOT_SCHEMA = `
CREATE TABLE IF NOT EXISTS market_snapshots (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  asset_count INTEGER NOT NULL CHECK (asset_count >= 2001),
  captured_at INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const CHUNK_SCHEMA = `
CREATE TABLE IF NOT EXISTS market_snapshot_chunks (
  snapshot_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  source TEXT NOT NULL,
  captured_at INTEGER NOT NULL,
  asset_count INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (snapshot_id, chunk_index)
)`;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

let refreshInFlight = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, ...extraHeaders },
});

async function fetchJson(url) {
  let lastError;
  const maxAttempts = RETRY_DELAYS_MS.length + 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Market-Snapshot/3.0' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`CoinLore request failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1) break;
      const retryDelay = RETRY_DELAYS_MS[attempt];
      if (Number.isFinite(retryDelay)) await sleep(retryDelay);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error('CoinLore request failed');
}

async function fetchCoinLore() {
  const starts = Array.from({ length: Math.ceil(MARKET_ASSET_LIMIT / 100) }, (_, index) => index * 100);
  const rows = [];
  for (let index = 0; index < starts.length; index += 5) {
    const results = await Promise.allSettled(
      starts.slice(index, index + 5).map((start) =>
        fetchJson(`https://api.coinlore.net/api/tickers/?start=${start}&limit=100`)),
    );
    rows.push(...results
      .filter((result) => result.status === 'fulfilled' && Array.isArray(result.value?.data))
      .flatMap((result) => result.value.data));
  }

  const seen = new Set();
  const data = rows.map((item, index) => ({
    id: `coinlore-${item.id || item.symbol || index}`,
    symbol: String(item.symbol || '').toUpperCase(),
    name: item.name || item.nameid || item.symbol || '',
    image: '',
    current_price: Number(item.price_usd),
    price_change_percentage_24h: Number(item.percent_change_24h),
    market_cap: Number(item.market_cap_usd),
    total_volume: Number(item.volume24),
    high_24h: null,
    low_24h: null,
    market_cap_rank: Number(item.rank) || index + 1,
    sparkline_in_7d: { price: [] },
  })).filter((coin) => coin.symbol && !seen.has(coin.symbol) && seen.add(coin.symbol))
    .slice(0, MARKET_ASSET_LIMIT);

  if (data.length < MIN_ACCEPTED_ASSETS) {
    throw new Error(`CoinLore returned only ${data.length} unique assets`);
  }
  return data;
}

async function ensureSchemas(db) {
  await db.prepare(SNAPSHOT_SCHEMA).run();
  await db.prepare(CHUNK_SCHEMA).run();
}

async function readSnapshotMetadata(db) {
  return db.prepare(
    'SELECT source, asset_count, captured_at FROM market_snapshots WHERE id = ?',
  ).bind('global').first();
}

async function readSnapshot(db) {
  return db.prepare(
    'SELECT source, asset_count, captured_at, payload FROM market_snapshots WHERE id = ?',
  ).bind('global').first();
}

async function persistChunks(db, data, capturedAt) {
  const chunkCount = Math.ceil(data.length / MARKET_CHUNK_SIZE);
  const statements = [];
  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
    const chunk = data.slice(chunkIndex * MARKET_CHUNK_SIZE, (chunkIndex + 1) * MARKET_CHUNK_SIZE);
    statements.push(db.prepare(`
      INSERT INTO market_snapshot_chunks (snapshot_id, chunk_index, source, captured_at, asset_count, payload, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(snapshot_id, chunk_index) DO UPDATE SET
        source = excluded.source,
        captured_at = excluded.captured_at,
        asset_count = excluded.asset_count,
        payload = excluded.payload,
        updated_at = CURRENT_TIMESTAMP
    `).bind('global', chunkIndex, 'coinlore', capturedAt, data.length, JSON.stringify(chunk)));
  }

  for (let offset = 0; offset < statements.length; offset += CHUNK_WRITE_BATCH_SIZE) {
    const group = statements.slice(offset, offset + CHUNK_WRITE_BATCH_SIZE);
    if (typeof db.batch === 'function') await db.batch(group);
    else {
      for (const statement of group) await statement.run();
    }
  }

  await db.prepare(
    'DELETE FROM market_snapshot_chunks WHERE snapshot_id = ? AND chunk_index >= ?',
  ).bind('global', chunkCount).run();
}

async function refreshSnapshot(dbBinding) {
  const data = await fetchCoinLore();
  const capturedAt = Date.now();
  const db = primarySession(dbBinding);
  await ensureSchemas(db);
  await db.prepare(`
    INSERT INTO market_snapshots (id, source, asset_count, captured_at, payload, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      asset_count = excluded.asset_count,
      captured_at = excluded.captured_at,
      payload = excluded.payload,
      updated_at = CURRENT_TIMESTAMP
  `).bind('global', 'coinlore', data.length, capturedAt, JSON.stringify(data)).run();
  await persistChunks(db, data, capturedAt);
  return { source: 'coinlore', asset_count: data.length, captured_at: capturedAt, data };
}

async function refreshSnapshotSingleFlight(db) {
  if (!refreshInFlight) {
    refreshInFlight = refreshSnapshot(db).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function decodeSnapshot(row) {
  if (!row) return null;
  try {
    const data = JSON.parse(row.payload);
    return Array.isArray(data) ? { ...row, data } : null;
  } catch {
    return null;
  }
}

function metadataFor(snapshot, requestId, refreshPerformed, refreshScheduled) {
  const ageMs = Math.max(0, Date.now() - Number(snapshot.captured_at));
  const stale = ageMs > SNAPSHOT_FRESH_MS;
  const refreshDue = ageMs >= SNAPSHOT_FRESH_MS - SNAPSHOT_REFRESH_AHEAD_MS;
  return {
    healthy: snapshot.asset_count >= MIN_ACCEPTED_ASSETS && ageMs <= SNAPSHOT_FRESH_MS * 4,
    source: snapshot.source,
    assetCount: snapshot.asset_count,
    collectionLimit: MARKET_ASSET_LIMIT,
    capturedAt: snapshot.captured_at,
    ageMs,
    stale,
    refreshDue,
    refreshPerformed,
    refreshScheduled,
    refreshMode: 'single-flight-background',
    chunkSize: MARKET_CHUNK_SIZE,
    requestId,
  };
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const requestId = crypto.randomUUID();
  if (!env.AUTH_DB) {
    return json({ error: 'Market snapshot database is not configured', code: 'MARKET_DB_MISSING', requestId }, 503, { 'Retry-After': '30' });
  }

  try {
    const url = new URL(request.url);
    const healthOnly = url.searchParams.get('health') === '1';
    const forceRefresh = healthOnly && url.searchParams.get('refresh') === '1';
    const readDb = readSession(env.AUTH_DB);

    if (healthOnly) {
      let metadataRow = await readSnapshotMetadata(readDb).catch(() => null);
      if (!metadataRow) {
        const initialized = await refreshSnapshotSingleFlight(env.AUTH_DB);
        metadataRow = initialized;
      }

      let meta = metadataFor(metadataRow, requestId, false, false);
      if (forceRefresh && meta.refreshDue) {
        metadataRow = await refreshSnapshotSingleFlight(env.AUTH_DB);
        meta = metadataFor(metadataRow, requestId, true, false);
      } else if (meta.refreshDue && typeof context.waitUntil === 'function') {
        context.waitUntil(refreshSnapshotSingleFlight(env.AUTH_DB).catch((error) => {
          console.error('Background market snapshot refresh failed', { requestId, error });
        }));
        meta = metadataFor(metadataRow, requestId, false, true);
      }
      return json(meta, 200, { 'X-KriptoAman-Market-Read': 'metadata-only' });
    }

    let snapshot = decodeSnapshot(await readSnapshot(readDb));
    if (!snapshot) snapshot = await refreshSnapshotSingleFlight(env.AUTH_DB);
    let meta = metadataFor(snapshot, requestId, false, false);

    if (meta.refreshDue && typeof context.waitUntil === 'function') {
      context.waitUntil(refreshSnapshotSingleFlight(env.AUTH_DB).catch((error) => {
        console.error('Background market snapshot refresh failed', { requestId, error });
      }));
      meta = metadataFor(snapshot, requestId, false, true);
    }

    return json({ ...meta, data: snapshot.data });
  } catch (error) {
    console.error('Market snapshot unavailable', { requestId, error });
    return json({ error: 'Market snapshot unavailable', code: 'MARKET_SNAPSHOT_FAILED', requestId }, 503, { 'Retry-After': '30' });
  }
}
