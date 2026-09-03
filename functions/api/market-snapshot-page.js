import { readSession } from '../_shared/d1-session.js';

const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 500;
const MIN_PAGE_SIZE = 100;
const MARKET_CHUNK_SIZE = 100;
const SNAPSHOT_MEMORY_TTL_MS = 60_000;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=840',
  'X-Content-Type-Options': 'nosniff',
};

let memoryMetadata = null;
let memoryMetadataAt = 0;
let metadataLoadInFlight = null;

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, ...extraHeaders },
});

const clampInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

async function loadMetadata(db) {
  const now = Date.now();
  if (memoryMetadata && now - memoryMetadataAt < SNAPSHOT_MEMORY_TTL_MS) {
    return { row: memoryMetadata, mode: 'metadata-memory' };
  }

  if (!metadataLoadInFlight) {
    metadataLoadInFlight = db.prepare(
      'SELECT source, asset_count, captured_at FROM market_snapshots WHERE id = ?',
    ).bind('global').first().then((row) => {
      if (row) {
        memoryMetadata = row;
        memoryMetadataAt = Date.now();
      }
      return row;
    }).finally(() => {
      metadataLoadInFlight = null;
    });
  }

  return { row: await metadataLoadInFlight, mode: 'metadata-d1' };
}

async function loadChunkPage(db, start, pageSize) {
  const firstChunk = Math.floor(start / MARKET_CHUNK_SIZE);
  const lastChunk = Math.floor((start + pageSize - 1) / MARKET_CHUNK_SIZE);
  try {
    const result = await db.prepare(`
      SELECT chunk_index, payload
      FROM market_snapshot_chunks
      WHERE snapshot_id = ? AND chunk_index BETWEEN ? AND ?
      ORDER BY chunk_index ASC
    `).bind('global', firstChunk, lastChunk).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    const expected = lastChunk - firstChunk + 1;
    if (rows.length !== expected) return null;
    const combined = rows.flatMap((row) => {
      try {
        const parsed = JSON.parse(row.payload);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });
    const withinFirstChunk = start - (firstChunk * MARKET_CHUNK_SIZE);
    const data = combined.slice(withinFirstChunk, withinFirstChunk + pageSize);
    return data.length ? { data, mode: 'chunk-d1', chunksRead: rows.length } : null;
  } catch {
    return null;
  }
}

async function loadFullFallback(db, start, pageSize) {
  const row = await db.prepare(
    'SELECT payload FROM market_snapshots WHERE id = ?',
  ).bind('global').first();
  if (!row?.payload) return null;
  try {
    const all = JSON.parse(row.payload);
    return Array.isArray(all) ? { data: all.slice(start, start + pageSize), mode: 'full-fallback', chunksRead: 0 } : null;
  } catch {
    return null;
  }
}

async function buildPage(env, request, requestId) {
  if (!env.AUTH_DB) {
    return json({ error: 'Market database is not configured', code: 'MARKET_DB_MISSING', requestId }, 503, { 'Retry-After': '30' });
  }

  try {
    const db = readSession(env.AUTH_DB);
    const { row, mode: metadataMode } = await loadMetadata(db);
    if (!row) {
      return json({ error: 'Market snapshot unavailable', code: 'MARKET_SNAPSHOT_EMPTY', requestId }, 503, { 'Retry-After': '30' });
    }

    const url = new URL(request.url);
    const page = clampInteger(url.searchParams.get('page'), 0, 0, 100);
    const pageSize = clampInteger(url.searchParams.get('limit'), DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE);
    const totalAssets = Number(row.asset_count) || 0;
    if (totalAssets <= 0) {
      return json({ error: 'Market snapshot invalid', code: 'MARKET_SNAPSHOT_INVALID', requestId }, 503, { 'Retry-After': '30' });
    }
    const totalPages = Math.max(1, Math.ceil(totalAssets / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * pageSize;
    const expectedPageLength = Math.min(pageSize, Math.max(0, totalAssets - start));

    let pageResult = await loadChunkPage(db, start, expectedPageLength);
    if (!pageResult || pageResult.data.length !== expectedPageLength) {
      pageResult = await loadFullFallback(db, start, expectedPageLength);
    }
    if (!pageResult || pageResult.data.length !== expectedPageLength) {
      return json({ error: 'Market page unavailable', code: 'MARKET_PAGE_DATA_MISSING', requestId }, 503, { 'Retry-After': '30' });
    }

    return json({
      source: row.source,
      capturedAt: Number(row.captured_at),
      totalAssets,
      page: safePage,
      pageSize,
      totalPages,
      hasMore: safePage + 1 < totalPages,
      requestId,
      data: pageResult.data,
      delivery: {
        snapshotRead: pageResult.mode,
        metadataRead: metadataMode,
        chunksRead: pageResult.chunksRead,
        chunkSize: MARKET_CHUNK_SIZE,
        d1SessionRead: Boolean(env.AUTH_DB && typeof env.AUTH_DB.withSession === 'function'),
      },
    }, 200, {
      'X-KriptoAman-Market-Page-Cache': 'MISS',
      'X-KriptoAman-Market-Snapshot-Read': pageResult.mode,
      'X-KriptoAman-D1-Session': typeof env.AUTH_DB.withSession === 'function' ? 'enabled' : 'compat',
    });
  } catch (error) {
    console.error('Paged market snapshot unavailable', { requestId, error });
    return json({ error: 'Paged market snapshot unavailable', code: 'MARKET_PAGE_FAILED', requestId }, 503, { 'Retry-After': '30' });
  }
}

export async function onRequestGet({ env, request, waitUntil }) {
  const requestId = crypto.randomUUID();
  const edgeCache = globalThis.caches?.default;
  const sourceUrl = new URL(request.url);
  const normalizedUrl = new URL('/api/market-snapshot-page', sourceUrl.origin);
  normalizedUrl.searchParams.set('page', String(clampInteger(sourceUrl.searchParams.get('page'), 0, 0, 100)));
  normalizedUrl.searchParams.set('limit', String(clampInteger(sourceUrl.searchParams.get('limit'), DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE)));
  const cacheKey = new Request(normalizedUrl.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) {
      const hitHeaders = new Headers(hit.headers);
      hitHeaders.set('X-KriptoAman-Market-Page-Cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers: hitHeaders });
    }
  }

  const response = await buildPage(env, request, requestId);
  if (edgeCache && response.status === 200) {
    const task = edgeCache.put(cacheKey, response.clone());
    if (typeof waitUntil === 'function') waitUntil(task);
    else await task;
  }
  return response;
}
