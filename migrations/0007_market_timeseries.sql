CREATE TABLE IF NOT EXISTS market_timeseries_observations (
  schema_version INTEGER NOT NULL DEFAULT 1,
  canonical_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_asset_id TEXT NOT NULL,
  quote_currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL,
  open_time INTEGER NOT NULL,
  close_time INTEGER NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL,
  volume_unit TEXT,
  provider_observed_at INTEGER,
  retrieved_at INTEGER NOT NULL,
  ingest_run_id TEXT NOT NULL,
  ingest_mode TEXT NOT NULL,
  provenance TEXT NOT NULL,
  PRIMARY KEY (provider, provider_asset_id, quote_currency, interval, open_time)
);

CREATE INDEX IF NOT EXISTS idx_market_timeseries_canonical_range
  ON market_timeseries_observations (canonical_key, quote_currency, interval, open_time);

CREATE INDEX IF NOT EXISTS idx_market_timeseries_provider_range
  ON market_timeseries_observations (provider, provider_asset_id, interval, open_time);

CREATE TABLE IF NOT EXISTS market_timeseries_ingest_runs (
  run_id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL DEFAULT 1,
  provider TEXT NOT NULL,
  provider_asset_id TEXT NOT NULL,
  canonical_key TEXT NOT NULL,
  quote_currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL,
  requested_from INTEGER NOT NULL,
  requested_to INTEGER NOT NULL,
  requested_at INTEGER NOT NULL,
  completed_at INTEGER,
  ingest_mode TEXT NOT NULL,
  provenance TEXT NOT NULL,
  status TEXT NOT NULL,
  received_count INTEGER NOT NULL DEFAULT 0,
  persisted_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_market_timeseries_runs_asset
  ON market_timeseries_ingest_runs (canonical_key, interval, requested_at);
