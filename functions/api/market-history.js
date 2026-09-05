import { readSession } from '../_shared/d1-session.js';
import {
  MARKET_TIMESERIES_SCHEMA_VERSION,
  compressMissingIntervals,
  expectedIntervalCount,
  normalizeStoredCandle,
  parseMarketTimeseriesQuery,
} from '../_shared/market-timeseries.js';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const schemaUnavailable = (requestId) => json({
  schemaVersion: '1.0',
  storageSchemaVersion: MARKET_TIMESERIES_SCHEMA_VERSION,
  requestId,
  available: false,
  error: 'Historical market storage is not available yet',
  code: 'MARKET_HISTORY_SCHEMA_UNAVAILABLE',
  candles: [],
  gaps: [],
  policy: {
    syntheticCandles: false,
    missingIntervals: 'explicit-not-filled',
    provenanceRequired: true,
  },
}, 503, { 'Retry-After': '60' });

export async function onRequestGet({ request, env }) {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);
  const parsed = parseMarketTimeseriesQuery(url.searchParams);
  if (!parsed.ok) {
    return json({
      schemaVersion: '1.0',
      storageSchemaVersion: MARKET_TIMESERIES_SCHEMA_VERSION,
      requestId,
      error: parsed.error,
      code: parsed.code,
    }, parsed.status);
  }

  if (!env?.AUTH_DB) return schemaUnavailable(requestId);
  const db = readSession(env.AUTH_DB);
  const upperBound = parsed.cursor === null ? parsed.to : Math.min(parsed.cursor, parsed.to);

  try {
    const [pageResult, coverageResult] = await Promise.all([
      db.prepare(`
        SELECT
          schema_version,
          canonical_key,
          provider,
          provider_asset_id,
          quote_currency,
          interval,
          open_time,
          close_time,
          open,
          high,
          low,
          close,
          volume,
          volume_unit,
          provider_observed_at,
          retrieved_at,
          ingest_run_id,
          ingest_mode,
          provenance
        FROM market_timeseries_observations
        WHERE canonical_key = ?
          AND provider = ?
          AND provider_asset_id = ?
          AND quote_currency = ?
          AND interval = ?
          AND open_time >= ?
          AND open_time < ?
        ORDER BY open_time DESC
        LIMIT ?
      `).bind(
        parsed.assetSpec.canonicalKey,
        parsed.assetSpec.provider,
        parsed.assetSpec.providerAssetId,
        parsed.quoteCurrency,
        parsed.interval,
        parsed.from,
        upperBound,
        parsed.limit + 1,
      ).all(),
      db.prepare(`
        SELECT open_time
        FROM market_timeseries_observations
        WHERE canonical_key = ?
          AND provider = ?
          AND provider_asset_id = ?
          AND quote_currency = ?
          AND interval = ?
          AND open_time >= ?
          AND open_time < ?
        ORDER BY open_time ASC
      `).bind(
        parsed.assetSpec.canonicalKey,
        parsed.assetSpec.provider,
        parsed.assetSpec.providerAssetId,
        parsed.quoteCurrency,
        parsed.interval,
        parsed.from,
        parsed.to,
      ).all(),
    ]);

    const rawRows = Array.isArray(pageResult?.results) ? pageResult.results : [];
    const hasMore = rawRows.length > parsed.limit;
    const pageRows = rawRows.slice(0, parsed.limit);
    const candles = pageRows
      .map(normalizeStoredCandle)
      .filter(Boolean)
      .reverse();

    const coverageRows = Array.isArray(coverageResult?.results) ? coverageResult.results : [];
    const observedTimes = coverageRows
      .map((row) => Number(row?.open_time))
      .filter((value) => Number.isInteger(value));
    const gaps = compressMissingIntervals(
      observedTimes,
      parsed.from,
      parsed.to,
      parsed.intervalSpec.ms,
    );
    const expectedIntervals = expectedIntervalCount(parsed.from, parsed.to, parsed.intervalSpec.ms);
    const nextCursor = hasMore && pageRows.length
      ? Number(pageRows[pageRows.length - 1].open_time)
      : null;

    return json({
      schemaVersion: '1.0',
      storageSchemaVersion: MARKET_TIMESERIES_SCHEMA_VERSION,
      requestId,
      available: true,
      asset: parsed.asset,
      canonicalKey: parsed.assetSpec.canonicalKey,
      provider: parsed.assetSpec.provider,
      providerAssetId: parsed.assetSpec.providerAssetId,
      quoteCurrency: parsed.quoteCurrency,
      interval: parsed.interval,
      range: { from: parsed.from, to: parsed.to },
      pagination: {
        limit: parsed.limit,
        cursor: parsed.cursor,
        nextCursor,
        hasMore,
      },
      candles,
      coverage: {
        expectedIntervals,
        observedIntervals: new Set(observedTimes).size,
        complete: expectedIntervals > 0 && new Set(observedTimes).size === expectedIntervals && gaps.length === 0,
        missingIntervalsExplicit: true,
      },
      gaps,
      policy: {
        syntheticCandles: false,
        missingIntervals: 'explicit-not-filled',
        queryMode: 'persisted-storage-only',
        customerPriceReplacement: false,
        provenanceRequired: true,
        interpretation: 'Historical market data only; not investment advice, valuation, best execution, or a guaranteed tradable price.',
      },
    }, 200, {
      'X-KriptoAman-Market-History': gaps.length ? 'partial' : 'available',
      'X-KriptoAman-Market-History-Schema': String(MARKET_TIMESERIES_SCHEMA_VERSION),
    });
  } catch (error) {
    const message = String(error?.message || error || '');
    if (/no such table|market_timeseries_observations/i.test(message)) return schemaUnavailable(requestId);
    return json({
      schemaVersion: '1.0',
      storageSchemaVersion: MARKET_TIMESERIES_SCHEMA_VERSION,
      requestId,
      available: false,
      error: 'Historical market query failed',
      code: 'MARKET_HISTORY_QUERY_FAILED',
      candles: [],
      gaps: [],
    }, 503, { 'Retry-After': '30' });
  }
}
