const MARKET_ASSET_LIMIT = 5000;
const MIN_ACCEPTED_ASSETS = 4500;
const SNAPSHOT_FRESH_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12 * 1000;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS market_snapshots (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  asset_count INTEGER NOT NULL CHECK (asset_count >= 2001),
  captured_at INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Market-Snapshot/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`CoinLore request failed: ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
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

async function readSnapshot(db) {
  await db.prepare(SCHEMA).run();
  return db.prepare(
    'SELECT source, asset_count, captured_at, payload FROM market_snapshots WHERE id = ?',
  ).bind('global').first();
}

async function refreshSnapshot(db) {
  const data = await fetchCoinLore();
  const capturedAt = Date.now();
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
  return { source: 'coinlore', asset_count: data.length, captured_at: capturedAt, data };
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

export async function onRequestGet(context) {
  const { env, request } = context;
  const requestId = crypto.randomUUID();
  if (!env.AUTH_DB) {
    return json({ error: 'Market snapshot database is not configured', code: 'MARKET_DB_MISSING', requestId }, 503);
  }

  try {
    let snapshot = decodeSnapshot(await readSnapshot(env.AUTH_DB));
    if (!snapshot) snapshot = await refreshSnapshot(env.AUTH_DB);

    const healthOnly = new URL(request.url).searchParams.get('health') === '1';
    let ageMs = Math.max(0, Date.now() - Number(snapshot.captured_at));
    let stale = ageMs > SNAPSHOT_FRESH_MS;
    let refreshError = null;

    if (stale && healthOnly) {
      try {
        snapshot = await refreshSnapshot(env.AUTH_DB);
        ageMs = Math.max(0, Date.now() - Number(snapshot.captured_at));
        stale = ageMs > SNAPSHOT_FRESH_MS;
      } catch (error) {
        refreshError = error instanceof Error ? error.message : String(error);
        console.error('Synchronous market health refresh failed', { requestId, error });
      }
    } else if (stale && typeof context.waitUntil === 'function') {
      context.waitUntil(refreshSnapshot(env.AUTH_DB).catch((error) => {
        console.error('Background market snapshot refresh failed', { requestId, error });
      }));
    }

    const metadata = {
      healthy: snapshot.asset_count >= MIN_ACCEPTED_ASSETS && ageMs <= SNAPSHOT_FRESH_MS * 4,
      source: snapshot.source,
      assetCount: snapshot.asset_count,
      collectionLimit: MARKET_ASSET_LIMIT,
      capturedAt: snapshot.captured_at,
      ageMs,
      stale,
      requestId,
      ...(refreshError ? { refreshError } : {}),
    };
    return json(healthOnly ? metadata : { ...metadata, data: snapshot.data });
  } catch (error) {
    console.error('Market snapshot unavailable', { requestId, error });
    return json({ error: 'Market snapshot unavailable', code: 'MARKET_SNAPSHOT_FAILED', requestId }, 503);
  }
}
