import { readSession } from '../_shared/d1-session.js';

const PRIMARY_SNAPSHOT_ID = 'global';
const BACKUP_SNAPSHOT_ID = 'global-backup';
const MIN_ACCEPTED_ASSETS = 4500;
const SNAPSHOT_FRESH_MS = 15 * 60 * 1000;
const FEAR_GREED_TIMEOUT_MS = 4000;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, ...extraHeaders },
});

async function readSnapshot(db, snapshotId) {
  return db.prepare(
    'SELECT source, asset_count, captured_at, payload FROM market_snapshots WHERE id = ?',
  ).bind(snapshotId).first();
}

function decodeSnapshot(row, snapshotId) {
  if (!row) return null;
  try {
    const data = JSON.parse(row.payload);
    const assetCount = Number(row.asset_count);
    const capturedAt = Number(row.captured_at);
    if (!Array.isArray(data)
      || data.length < MIN_ACCEPTED_ASSETS
      || !Number.isFinite(assetCount)
      || assetCount !== data.length
      || !Number.isFinite(capturedAt)
      || capturedAt <= 0) {
      return null;
    }
    return { ...row, snapshot_id: snapshotId, data };
  } catch {
    return null;
  }
}

async function readBestSnapshot(db) {
  const primary = decodeSnapshot(await readSnapshot(db, PRIMARY_SNAPSHOT_ID), PRIMARY_SNAPSHOT_ID);
  if (primary) return primary;
  return decodeSnapshot(await readSnapshot(db, BACKUP_SNAPSHOT_ID), BACKUP_SNAPSHOT_ID);
}

function buildOverview(snapshot) {
  let totalMarketCap = 0;
  let totalVolume24h = 0;
  let weightedChangeNumerator = 0;
  let weightedChangeDenominator = 0;
  let btcMarketCap = 0;
  let ethMarketCap = 0;

  for (const coin of snapshot.data) {
    const symbol = String(coin?.symbol || '').toUpperCase();
    const marketCap = Number(coin?.market_cap);
    const volume = Number(coin?.total_volume);
    const change24h = Number(coin?.price_change_percentage_24h);

    if (Number.isFinite(marketCap) && marketCap > 0) {
      totalMarketCap += marketCap;
      if (symbol === 'BTC') btcMarketCap = Math.max(btcMarketCap, marketCap);
      if (symbol === 'ETH') ethMarketCap = Math.max(ethMarketCap, marketCap);
      if (Number.isFinite(change24h)) {
        weightedChangeNumerator += marketCap * change24h;
        weightedChangeDenominator += marketCap;
      }
    }
    if (Number.isFinite(volume) && volume > 0) totalVolume24h += volume;
  }

  const marketCapChange24h = weightedChangeDenominator > 0
    ? weightedChangeNumerator / weightedChangeDenominator
    : null;

  return {
    marketCap: totalMarketCap > 0 ? totalMarketCap : null,
    volume24h: totalVolume24h > 0 ? totalVolume24h : null,
    btcDominance: totalMarketCap > 0 && btcMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : null,
    ethDominance: totalMarketCap > 0 && ethMarketCap > 0 ? (ethMarketCap / totalMarketCap) * 100 : null,
    trackedAssets: snapshot.data.length,
    marketCapChange24h,
  };
}

async function fetchFearGreed() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEAR_GREED_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KriptoAman-Market-Overview/1.0',
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const row = payload?.data?.[0];
    const value = Number(row?.value);
    const timestamp = Number(row?.timestamp);
    if (!Number.isFinite(value)) return null;
    return {
      value,
      classification: row?.value_classification || null,
      timestamp: Number.isFinite(timestamp) ? timestamp : null,
      source: 'alternative.me',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestGet({ env }) {
  const requestId = crypto.randomUUID();
  if (!env.AUTH_DB) {
    return json({
      error: 'Market database is not configured',
      code: 'MARKET_DB_MISSING',
      requestId,
    }, 503, { 'Retry-After': '30' });
  }

  try {
    const snapshot = await readBestSnapshot(readSession(env.AUTH_DB));
    if (!snapshot) {
      return json({
        error: 'Persisted market snapshot is unavailable',
        code: 'MARKET_OVERVIEW_UNAVAILABLE',
        requestId,
      }, 503, { 'Retry-After': '30' });
    }

    const overview = buildOverview(snapshot);
    const fearGreed = await fetchFearGreed();
    const capturedAt = Number(snapshot.captured_at);
    const ageMs = Math.max(0, Date.now() - capturedAt);

    return json({
      status: 'ok',
      requestId,
      ...overview,
      fearGreed,
      capturedAt,
      ageMs,
      stale: ageMs > SNAPSHOT_FRESH_MS,
      source: 'kriptoaman-market-database',
      upstreamSource: snapshot.source || null,
      snapshotId: snapshot.snapshot_id,
      recoverySnapshot: snapshot.snapshot_id === BACKUP_SNAPSHOT_ID,
      methodology: {
        totals: 'sum-of-tracked-assets',
        dominance: 'share-of-tracked-market-cap',
        marketCapChange24h: 'market-cap-weighted-snapshot',
        trackedAssetMinimum: MIN_ACCEPTED_ASSETS,
      },
    });
  } catch (error) {
    console.error('Market overview unavailable', { requestId, error });
    return json({
      error: 'Market overview unavailable',
      code: 'MARKET_OVERVIEW_FAILED',
      requestId,
    }, 503, { 'Retry-After': '30' });
  }
}
