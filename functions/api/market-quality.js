import { readSession } from '../_shared/d1-session.js';

const TARGET_ASSET_COUNT = 4500;
const FRESH_WINDOW_MS = 20 * 60 * 1000;
const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const WATCH_WINDOW_MS = 60 * 60 * 1000;
const STALE_WINDOW_MS = 6 * 60 * 60 * 1000;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120, stale-if-error=900',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const pct = (numerator, denominator) => denominator > 0
  ? Math.round((numerator / denominator) * 10000) / 100
  : 0;

const clamp100 = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const hasObservedValue = value => value !== null && value !== undefined && value !== '';

function freshnessScore(ageMs) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return 0;
  if (ageMs <= FRESH_WINDOW_MS) return 100;
  if (ageMs <= ACTIVE_WINDOW_MS) return 85;
  if (ageMs <= WATCH_WINDOW_MS) return 60;
  if (ageMs <= STALE_WINDOW_MS) return 25;
  return 0;
}

export function scoreMarketQuality({ rows = [], capturedAt = 0, source = 'unknown', now = Date.now() } = {}) {
  const data = Array.isArray(rows) ? rows : [];
  const assetCount = data.length;
  const ageMs = Math.max(0, Number(now) - Number(capturedAt || 0));

  const symbolSet = new Set();
  const idSet = new Set();
  let duplicateSymbols = 0;
  let duplicateIds = 0;
  let validIdentity = 0;
  let validPrice = 0;
  let validMarketCap = 0;
  let validVolume = 0;
  let validChange24h = 0;
  let imageCoverage = 0;
  let nonPositivePrices = 0;
  let negativeMarketCaps = 0;
  let negativeVolumes = 0;
  let missingPrices = 0;
  let missingMarketCaps = 0;
  let missingVolumes = 0;

  for (const item of data) {
    const id = String(item?.id || '').trim();
    const symbol = String(item?.symbol || '').trim().toUpperCase();
    const name = String(item?.name || '').trim();

    if (id && symbol && name) validIdentity += 1;
    if (symbol) {
      if (symbolSet.has(symbol)) duplicateSymbols += 1;
      else symbolSet.add(symbol);
    }
    if (id) {
      if (idSet.has(id)) duplicateIds += 1;
      else idSet.add(id);
    }

    if (!hasObservedValue(item?.current_price)) {
      missingPrices += 1;
    } else {
      const price = Number(item.current_price);
      if (Number.isFinite(price) && price > 0) validPrice += 1;
      else if (Number.isFinite(price) && price <= 0) nonPositivePrices += 1;
    }

    if (!hasObservedValue(item?.market_cap)) {
      missingMarketCaps += 1;
    } else {
      const marketCap = Number(item.market_cap);
      if (Number.isFinite(marketCap) && marketCap >= 0) validMarketCap += 1;
      else if (Number.isFinite(marketCap) && marketCap < 0) negativeMarketCaps += 1;
    }

    if (!hasObservedValue(item?.total_volume)) {
      missingVolumes += 1;
    } else {
      const volume = Number(item.total_volume);
      if (Number.isFinite(volume) && volume >= 0) validVolume += 1;
      else if (Number.isFinite(volume) && volume < 0) negativeVolumes += 1;
    }

    if (hasObservedValue(item?.price_change_percentage_24h)) {
      const change24h = Number(item.price_change_percentage_24h);
      if (Number.isFinite(change24h)) validChange24h += 1;
    }

    if (String(item?.image || '').trim()) imageCoverage += 1;
  }

  const coverageScore = clamp100((assetCount / TARGET_ASSET_COUNT) * 100);
  const priceScore = pct(validPrice, assetCount);
  const identityScore = pct(validIdentity, assetCount);
  const volumeScore = pct(validVolume, assetCount);
  const freshScore = freshnessScore(ageMs);

  const weightedScore = Math.round(
    freshScore * 0.30
    + coverageScore * 0.25
    + priceScore * 0.20
    + identityScore * 0.15
    + volumeScore * 0.10,
  );

  const hardAnomaly = nonPositivePrices > 0 || negativeMarketCaps > 0 || negativeVolumes > 0;
  const stale = ageMs > WATCH_WINDOW_MS;
  const veryStale = ageMs > STALE_WINDOW_MS;
  let status = weightedScore >= 95 ? 'excellent'
    : weightedScore >= 85 ? 'healthy'
      : weightedScore >= 70 ? 'watch'
        : 'degraded';
  if (stale && status === 'excellent') status = 'watch';
  if (veryStale) status = 'stale';
  if (hardAnomaly && status === 'excellent') status = 'healthy';

  return {
    schemaVersion: '1.1',
    status,
    score: weightedScore,
    source,
    capturedAt: Number(capturedAt) || null,
    ageMs,
    assetCount,
    targetAssetCount: TARGET_ASSET_COUNT,
    components: {
      freshnessScore: freshScore,
      coverageScore: Math.round(coverageScore),
      priceCompletenessPct: priceScore,
      identityCompletenessPct: identityScore,
      marketCapCompletenessPct: pct(validMarketCap, assetCount),
      volumeCompletenessPct: volumeScore,
      change24hCompletenessPct: pct(validChange24h, assetCount),
      imageCoveragePct: pct(imageCoverage, assetCount),
    },
    missing: {
      prices: missingPrices,
      marketCaps: missingMarketCaps,
      volumes: missingVolumes,
    },
    anomalies: {
      duplicateSymbols,
      duplicateIds,
      nonPositivePrices,
      negativeMarketCaps,
      negativeVolumes,
    },
    freshness: {
      fresh: ageMs <= FRESH_WINDOW_MS,
      active: ageMs <= ACTIVE_WINDOW_MS,
      stale,
      veryStale,
    },
    interpretation: 'Operational market-data quality only; not an investment signal, valuation, execution-price guarantee, or cross-provider consensus score.',
  };
}

async function buildQuality(env, requestId) {
  if (!env.AUTH_DB) {
    return json({
      error: 'Market database is not configured',
      code: 'MARKET_DB_MISSING',
      requestId,
    }, 503, { 'Retry-After': '30' });
  }

  try {
    const db = readSession(env.AUTH_DB);
    const row = await db.prepare(
      'SELECT source, asset_count, captured_at, payload FROM market_snapshots WHERE id = ?',
    ).bind('global').first();

    if (!row?.payload) {
      return json({
        error: 'Market snapshot unavailable',
        code: 'MARKET_SNAPSHOT_EMPTY',
        requestId,
      }, 503, { 'Retry-After': '30' });
    }

    let data;
    try {
      data = JSON.parse(row.payload);
    } catch {
      return json({
        error: 'Market snapshot is not valid JSON',
        code: 'MARKET_SNAPSHOT_INVALID',
        requestId,
      }, 503, { 'Retry-After': '30' });
    }

    if (!Array.isArray(data)) {
      return json({
        error: 'Market snapshot payload is invalid',
        code: 'MARKET_SNAPSHOT_INVALID',
        requestId,
      }, 503, { 'Retry-After': '30' });
    }

    const quality = scoreMarketQuality({
      rows: data,
      capturedAt: Number(row.captured_at),
      source: row.source || 'unknown',
    });

    return json({
      healthy: quality.status === 'excellent' || quality.status === 'healthy',
      ...quality,
      persistedAssetCount: Number(row.asset_count) || data.length,
      requestId,
    }, quality.status === 'stale' ? 503 : 200, {
      'X-KriptoAman-Market-Quality': quality.status,
      'X-KriptoAman-Market-Quality-Score': String(quality.score),
    });
  } catch (error) {
    console.error('Market quality unavailable', { requestId, error });
    return json({
      error: 'Market quality unavailable',
      code: 'MARKET_QUALITY_FAILED',
      requestId,
    }, 503, { 'Retry-After': '30' });
  }
}

export async function onRequestGet({ env }) {
  const requestId = crypto.randomUUID();
  return buildQuality(env, requestId);
}
