import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  MARKET_TIMESERIES_SCHEMA_VERSION,
  compressMissingIntervals,
  expectedIntervalCount,
  normalizeStoredCandle,
  parseMarketTimeseriesQuery,
} from '../functions/_shared/market-timeseries.js';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

test('time-series query is bounded by explicit asset, interval, range, page and cursor rules', () => {
  const ok = parseMarketTimeseriesQuery(new URLSearchParams({
    asset: 'btc',
    interval: '1h',
    from: String(100 * HOUR),
    to: String(124 * HOUR),
    limit: '250',
  }), 200 * HOUR);
  assert.equal(ok.ok, true);
  assert.equal(ok.asset, 'BTC');
  assert.equal(ok.assetSpec.providerAssetId, 'bitcoin');
  assert.equal(ok.intervalSpec.ms, HOUR);

  const tooLarge = parseMarketTimeseriesQuery(new URLSearchParams({
    asset: 'BTC',
    interval: '1h',
    from: '0',
    to: String(32 * DAY),
  }), 32 * DAY);
  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.code, 'RANGE_TOO_LARGE');

  const badLimit = parseMarketTimeseriesQuery(new URLSearchParams({ asset: 'BTC', limit: '501' }));
  assert.equal(badLimit.ok, false);
  assert.equal(badLimit.code, 'INVALID_LIMIT');
});

test('missing intervals are explicit compressed ranges rather than synthetic candles', () => {
  const from = 100 * HOUR;
  const to = 108 * HOUR;
  const observed = [100, 101, 104, 107].map((n) => n * HOUR);
  const gaps = compressMissingIntervals(observed, from, to, HOUR);

  assert.deepEqual(gaps, [
    { from: 102 * HOUR, to: 104 * HOUR, expectedIntervals: 2 },
    { from: 105 * HOUR, to: 107 * HOUR, expectedIntervals: 2 },
  ]);
  assert.equal(expectedIntervalCount(from, to, HOUR), 8);
});

test('stored candles preserve nullable volume and reject impossible OHLC values', () => {
  const valid = normalizeStoredCandle({
    schema_version: 1,
    canonical_key: 'coingecko:bitcoin',
    provider: 'coingecko',
    provider_asset_id: 'bitcoin',
    open_time: 1000,
    close_time: 2000,
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: null,
    volume_unit: null,
    retrieved_at: 3000,
    ingest_run_id: 'run-1',
    ingest_mode: 'backfill',
    provenance: 'provider-native-ohlc',
  });
  assert.equal(valid.volume, null);
  assert.equal(valid.schemaVersion, MARKET_TIMESERIES_SCHEMA_VERSION);

  const impossible = normalizeStoredCandle({
    schema_version: 1,
    canonical_key: 'coingecko:bitcoin',
    provider: 'coingecko',
    provider_asset_id: 'bitcoin',
    open_time: 1000,
    close_time: 2000,
    open: 100,
    high: 95,
    low: 90,
    close: 105,
    volume: null,
    volume_unit: null,
    retrieved_at: 3000,
    ingest_run_id: 'run-2',
    ingest_mode: 'backfill',
    provenance: 'provider-native-ohlc',
  });
  assert.equal(impossible, null);
});

test('migration stores versioned provider-scoped observations and backfill provenance', async () => {
  const migration = await read('migrations/0007_market_timeseries.sql');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_timeseries_observations/);
  assert.match(migration, /schema_version INTEGER NOT NULL DEFAULT 1/);
  assert.match(migration, /PRIMARY KEY \(provider, provider_asset_id, quote_currency, interval, open_time\)/);
  assert.match(migration, /ingest_run_id TEXT NOT NULL/);
  assert.match(migration, /provenance TEXT NOT NULL/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_timeseries_ingest_runs/);
  assert.match(migration, /received_count INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /persisted_count INTEGER NOT NULL DEFAULT 0/);
});

test('historical API is persisted-storage-only and does not fabricate or fetch upstream on read', async () => {
  const source = await read('functions/api/market-history.js');
  assert.match(source, /queryMode: 'persisted-storage-only'/);
  assert.match(source, /syntheticCandles: false/);
  assert.match(source, /missingIntervals: 'explicit-not-filled'/);
  assert.match(source, /customerPriceReplacement: false/);
  assert.match(source, /FROM market_timeseries_observations/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.equal(source.includes('fetch('), false);
  assert.doesNotMatch(source, /\bINSERT\b/i);
  assert.doesNotMatch(source, /\bUPDATE\b/i);
  assert.doesNotMatch(source, /\bDELETE\b/i);
  assert.doesNotMatch(source, /CREATE TABLE/i);
});

test('retention and downsampling policy keeps licensing and completeness as hard gates', async () => {
  const policy = await read('docs/MARKET_TIMESERIES_POLICY.md');
  assert.match(policy, /Retention is a technical ceiling, not a provider-rights claim/);
  assert.match(policy, /must not interpolate, forward-fill, back-fill, or synthesize a candle/i);
  assert.match(policy, /only when every required source interval is present/i);
  assert.match(policy, /Before production historical ingestion is enabled for any provider/i);
  assert.match(policy, /should not be used to claim historical coverage/i);
});
