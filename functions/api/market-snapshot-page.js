import { readSession } from '../_shared/d1-session.js';

const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 500;
const MIN_PAGE_SIZE = 100;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=840',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, ...extraHeaders },
});

const clampInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

async function buildPage(env, request, requestId) {
  if (!env.AUTH_DB) {
    return json({ error: 'Market database is not configured', code: 'MARKET_DB_MISSING', requestId }, 503, { 'Retry-After': '30' });
  }

  try {
    const db = readSession(env.AUTH_DB);
    const row = await db.prepare(
      'SELECT source, asset_count, captured_at, payload FROM market_snapshots WHERE id = ?',
    ).bind('global').first();

    if (!row?.payload) {
      return json({ error: 'Market snapshot unavailable', code: 'MARKET_SNAPSHOT_EMPTY', requestId }, 503, { 'Retry-After': '30' });
    }

    const all = JSON.parse(row.payload);
    if (!Array.isArray(all)) {
      return json({ error: 'Market snapshot invalid', code: 'MARKET_SNAPSHOT_INVALID', requestId }, 503, { 'Retry-After': '30' });
    }

    const url = new URL(request.url);
    const page = clampInteger(url.searchParams.get('page'), 0, 0, 100);
    const pageSize = clampInteger(url.searchParams.get('limit'), DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE);
    const totalAssets = Math.min(Number(row.asset_count) || all.length, all.length);
    const totalPages = Math.max(1, Math.ceil(totalAssets / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * pageSize;
    const data = all.slice(start, start + pageSize);

    return json({
      source: row.source,
      capturedAt: Number(row.captured_at),
      totalAssets,
      page: safePage,
      pageSize,
      totalPages,
      hasMore: safePage + 1 < totalPages,
      requestId,
      data,
    }, 200, {
      'X-KriptoAman-Market-Page-Cache': 'MISS',
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
