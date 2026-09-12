import { readSession } from '../_shared/d1-session.js';

const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 500;
const MIN_PAGE_SIZE = 100;
const MARKET_CHUNK_SIZE = 100;
const SNAPSHOT_MEMORY_TTL_MS = 60_000;
const RESCUE_CACHE_TTL_SECONDS = 24 * 60 * 60;
const PRIMARY_SNAPSHOT_ID = 'global';
const BACKUP_SNAPSHOT_ID = 'global-backup';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=840, stale-if-error=86400',
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

async function loadMetadata(db, snapshotId = PRIMARY_SNAPSHOT_ID) {
  const useMemory = snapshotId === PRIMARY_SNAPSHOT_ID;
  const now = Date.now();
  if (useMemory && memoryMetadata && now - memoryMetadataAt < SNAPSHOT_MEMORY_TTL_MS) {
    return { row: memoryMetadata, mode: 'metadata-memory' };
  }

  if (useMemory) {
    if (!metadataLoadInFlight) {
      metadataLoadInFlight = db.prepare(
        'SELECT source, asset_count, captured_at FROM market_snapshots WHERE id = ?',
      ).bind(snapshotId).first().then((row) => {
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

  const row = await db.prepare(
    'SELECT source, asset_count, captured_at FROM market_snapshots WHERE id = ?',
  ).bind(snapshotId).first();
  return { row, mode: 'metadata-backup-d1' };
}

async function loadChunkPage(db, snapshotId, capturedAt, start, pageSize) {
  const firstChunk = Math.floor(start / MARKET_CHUNK_SIZE);
  const lastChunk = Math.floor((start + pageSize - 1) / MARKET_CHUNK_SIZE);
  try {
    const result = await db.prepare(`
      SELECT chunk_index, captured_at, payload
      FROM market_snapshot_chunks
      WHERE snapshot_id = ? AND chunk_index BETWEEN ? AND ?
      ORDER BY chunk_index ASC
    `).bind(snapshotId, firstChunk, lastChunk).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    const expected = lastChunk - firstChunk + 1;
    if (rows.length !== expected) return null;
    if (rows.some((row) => Number(row.captured_at) !== Number(capturedAt))) return null;

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

async function loadFullFallback(db, snapshotId, capturedAt, start, pageSize) {
  const row = await db.prepare(
    'SELECT captured_at, payload FROM market_snapshots WHERE id = ?',
  ).bind(snapshotId).first();
  if (!row?.payload || Number(row.captured_at) !== Number(capturedAt)) return null;
  try {
    const all = JSON.parse(row.payload);
    return Array.isArray(all)
      ? { data: all.slice(start, start + pageSize), mode: snapshotId === BACKUP_SNAPSHOT_ID ? 'backup-full-fallback' : 'full-fallback', chunksRead: 0 }
      : null;
  } catch {
    return null;
  }
}

async function readPageFromSnapshot(db, row, snapshotId, page, pageSize, metadataMode) {
  if (!row) return null;
  const totalAssets = Number(row.asset_count) || 0;
  const capturedAt = Number(row.captured_at) || 0;
  if (totalAssets <= 0 || capturedAt <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalAssets / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const expectedPageLength = Math.min(pageSize, Math.max(0, totalAssets - start));

  let pageResult = snapshotId === PRIMARY_SNAPSHOT_ID
    ? await loadChunkPage(db, snapshotId, capturedAt, start, expectedPageLength)
    : null;
  if (!pageResult || pageResult.data.length !== expectedPageLength) {
    pageResult = await loadFullFallback(db, snapshotId, capturedAt, start, expectedPageLength);
  }
  if (!pageResult || pageResult.data.length !== expectedPageLength) return null;

  return {
    source: row.source,
    capturedAt,
    totalAssets,
    page: safePage,
    pageSize,
    totalPages,
    hasMore: safePage + 1 < totalPages,
    data: pageResult.data,
    delivery: {
      snapshotRead: pageResult.mode,
      metadataRead: metadataMode,
      chunksRead: pageResult.chunksRead,
      chunkSize: MARKET_CHUNK_SIZE,
      snapshotId,
      recoverySnapshot: snapshotId === BACKUP_SNAPSHOT_ID,
    },
  };
}

async function buildPage(env, request, requestId) {
  if (!env.AUTH_DB) {
    return json({ error: 'Market database is not configured', code: 'MARKET_DB_MISSING', requestId }, 503, { 'Retry-After': '30' });
  }

  try {
    const db = readSession(env.AUTH_DB);
    const url = new URL(request.url);
    const page = clampInteger(url.searchParams.get('page'), 0, 0, 100);
    const pageSize = clampInteger(url.searchParams.get('limit'), DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE);

    const primaryMetadata = await loadMetadata(db, PRIMARY_SNAPSHOT_ID);
    let result = await readPageFromSnapshot(
      db,
      primaryMetadata.row,
      PRIMARY_SNAPSHOT_ID,
      page,
      pageSize,
      primaryMetadata.mode,
    );

    if (!result) {
      const backupMetadata = await loadMetadata(db, BACKUP_SNAPSHOT_ID);
      result = await readPageFromSnapshot(
        db,
        backupMetadata.row,
        BACKUP_SNAPSHOT_ID,
        page,
        pageSize,
        backupMetadata.mode,
      );
    }

    if (!result) {
      return json({ error: 'Market page unavailable', code: 'MARKET_PAGE_DATA_MISSING', requestId }, 503, { 'Retry-After': '30' });
    }

    return json({
      ...result,
      requestId,
      delivery: {
        ...result.delivery,
        d1SessionRead: Boolean(env.AUTH_DB && typeof env.AUTH_DB.withSession === 'function'),
      },
    }, 200, {
      'X-KriptoAman-Market-Page-Cache': 'MISS',
      'X-KriptoAman-Market-Snapshot-Read': result.delivery.snapshotRead,
      'X-KriptoAman-Market-Recovery': result.delivery.recoverySnapshot ? 'backup' : 'primary',
      'X-KriptoAman-D1-Session': typeof env.AUTH_DB.withSession === 'function' ? 'enabled' : 'compat',
      ...(result.delivery.recoverySnapshot ? {
        'X-KriptoAman-Market-Stale': 'true',
        Warning: '110 - "Response served from rolling backup snapshot"',
      } : {}),
    });
  } catch (error) {
    console.error('Paged market snapshot unavailable', { requestId, error });
    return json({ error: 'Paged market snapshot unavailable', code: 'MARKET_PAGE_FAILED', requestId }, 503, { 'Retry-After': '30' });
  }
}

function buildCacheKeys(request) {
  const sourceUrl = new URL(request.url);
  const normalizedUrl = new URL('/api/market-snapshot-page', sourceUrl.origin);
  normalizedUrl.searchParams.set('page', String(clampInteger(sourceUrl.searchParams.get('page'), 0, 0, 100)));
  normalizedUrl.searchParams.set('limit', String(clampInteger(sourceUrl.searchParams.get('limit'), DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE)));

  const cacheKey = new Request(normalizedUrl.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const rescueUrl = new URL(normalizedUrl.toString());
  rescueUrl.searchParams.set('_ka_rescue', '1');
  const rescueCacheKey = new Request(rescueUrl.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return { cacheKey, rescueCacheKey };
}

function buildRescueSeed(response) {
  const rescueHeaders = new Headers(response.headers);
  rescueHeaders.set('Cache-Control', `public, max-age=0, s-maxage=${RESCUE_CACHE_TTL_SECONDS}`);
  rescueHeaders.set('X-KriptoAman-Market-Rescue-Seed', 'true');
  return new Response(response.clone().body, {
    status: response.status,
    headers: rescueHeaders,
  });
}

async function serveRescue(edgeCache, rescueCacheKey) {
  if (!edgeCache) return null;
  const rescue = await edgeCache.match(rescueCacheKey);
  if (!rescue) return null;

  const rescueHeaders = new Headers(rescue.headers);
  rescueHeaders.set('Cache-Control', 'no-store');
  rescueHeaders.set('X-KriptoAman-Market-Page-Cache', 'RESCUE');
  rescueHeaders.set('X-KriptoAman-Market-Stale', 'true');
  rescueHeaders.set('Warning', '110 - "Response is stale"');
  return new Response(rescue.body, {
    status: 200,
    headers: rescueHeaders,
  });
}

export async function onRequestGet({ env, request, waitUntil }) {
  const requestId = crypto.randomUUID();
  const edgeCache = globalThis.caches?.default;
  const { cacheKey, rescueCacheKey } = buildCacheKeys(request);

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
    const tasks = [
      edgeCache.put(cacheKey, response.clone()),
      edgeCache.put(rescueCacheKey, buildRescueSeed(response)),
    ];
    const task = Promise.all(tasks);
    if (typeof waitUntil === 'function') waitUntil(task);
    else await task;
    return response;
  }

  const rescue = await serveRescue(edgeCache, rescueCacheKey);
  if (rescue) return rescue;

  return response;
}
