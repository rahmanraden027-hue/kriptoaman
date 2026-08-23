const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 500;
const MIN_PAGE_SIZE = 100;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=840',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

const clampInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export async function onRequestGet({ env, request }) {
  const requestId = crypto.randomUUID();
  if (!env.AUTH_DB) {
    return json({ error: 'Market database is not configured', code: 'MARKET_DB_MISSING', requestId }, 503);
  }

  try {
    const row = await env.AUTH_DB.prepare(
      'SELECT source, asset_count, captured_at, payload FROM market_snapshots WHERE id = ?',
    ).bind('global').first();

    if (!row?.payload) {
      return json({ error: 'Market snapshot unavailable', code: 'MARKET_SNAPSHOT_EMPTY', requestId }, 503);
    }

    const all = JSON.parse(row.payload);
    if (!Array.isArray(all)) {
      return json({ error: 'Market snapshot invalid', code: 'MARKET_SNAPSHOT_INVALID', requestId }, 503);
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
    });
  } catch (error) {
    console.error('Paged market snapshot unavailable', { requestId, error });
    return json({ error: 'Paged market snapshot unavailable', code: 'MARKET_PAGE_FAILED', requestId }, 503);
  }
}
