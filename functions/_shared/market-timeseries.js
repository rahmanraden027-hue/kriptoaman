export const MARKET_TIMESERIES_SCHEMA_VERSION = 1;

// Canonical persisted-history registry. Expanding this registry only permits
// reads for observations that actually exist in D1; it never fabricates or
// fetches missing history on the customer read path.
export const MARKET_TIMESERIES_ASSETS = Object.freeze({
  BTC: { canonicalKey: 'coingecko:bitcoin', provider: 'coingecko', providerAssetId: 'bitcoin' },
  ETH: { canonicalKey: 'coingecko:ethereum', provider: 'coingecko', providerAssetId: 'ethereum' },
  BNB: { canonicalKey: 'coingecko:binancecoin', provider: 'coingecko', providerAssetId: 'binancecoin' },
  SOL: { canonicalKey: 'coingecko:solana', provider: 'coingecko', providerAssetId: 'solana' },
  XRP: { canonicalKey: 'coingecko:ripple', provider: 'coingecko', providerAssetId: 'ripple' },
  ADA: { canonicalKey: 'coingecko:cardano', provider: 'coingecko', providerAssetId: 'cardano' },
  DOGE: { canonicalKey: 'coingecko:dogecoin', provider: 'coingecko', providerAssetId: 'dogecoin' },
  TRX: { canonicalKey: 'coingecko:tron', provider: 'coingecko', providerAssetId: 'tron' },
  AVAX: { canonicalKey: 'coingecko:avalanche-2', provider: 'coingecko', providerAssetId: 'avalanche-2' },
  DOT: { canonicalKey: 'coingecko:polkadot', provider: 'coingecko', providerAssetId: 'polkadot' },
  LINK: { canonicalKey: 'coingecko:chainlink', provider: 'coingecko', providerAssetId: 'chainlink' },
  MATIC: { canonicalKey: 'coingecko:matic-network', provider: 'coingecko', providerAssetId: 'matic-network' },
  POL: { canonicalKey: 'coingecko:matic-network', provider: 'coingecko', providerAssetId: 'matic-network' },
  LTC: { canonicalKey: 'coingecko:litecoin', provider: 'coingecko', providerAssetId: 'litecoin' },
  UNI: { canonicalKey: 'coingecko:uniswap', provider: 'coingecko', providerAssetId: 'uniswap' },
  ATOM: { canonicalKey: 'coingecko:cosmos', provider: 'coingecko', providerAssetId: 'cosmos' },
  NEAR: { canonicalKey: 'coingecko:near', provider: 'coingecko', providerAssetId: 'near' },
  APT: { canonicalKey: 'coingecko:aptos', provider: 'coingecko', providerAssetId: 'aptos' },
  SUI: { canonicalKey: 'coingecko:sui', provider: 'coingecko', providerAssetId: 'sui' },
  ARB: { canonicalKey: 'coingecko:arbitrum', provider: 'coingecko', providerAssetId: 'arbitrum' },
  OP: { canonicalKey: 'coingecko:optimism', provider: 'coingecko', providerAssetId: 'optimism' },
  AAVE: { canonicalKey: 'coingecko:aave', provider: 'coingecko', providerAssetId: 'aave' },
  CRV: { canonicalKey: 'coingecko:curve-dao-token', provider: 'coingecko', providerAssetId: 'curve-dao-token' },
  INJ: { canonicalKey: 'coingecko:injective-protocol', provider: 'coingecko', providerAssetId: 'injective-protocol' },
  SHIB: { canonicalKey: 'coingecko:shiba-inu', provider: 'coingecko', providerAssetId: 'shiba-inu' },
  USDT: { canonicalKey: 'coingecko:tether', provider: 'coingecko', providerAssetId: 'tether' },
  USDC: { canonicalKey: 'coingecko:usd-coin', provider: 'coingecko', providerAssetId: 'usd-coin' },
  PEPE: { canonicalKey: 'coingecko:pepe', provider: 'coingecko', providerAssetId: 'pepe' },
  BCH: { canonicalKey: 'coingecko:bitcoin-cash', provider: 'coingecko', providerAssetId: 'bitcoin-cash' },
  XLM: { canonicalKey: 'coingecko:stellar', provider: 'coingecko', providerAssetId: 'stellar' },
  TON: { canonicalKey: 'coingecko:the-open-network', provider: 'coingecko', providerAssetId: 'the-open-network' },
  HBAR: { canonicalKey: 'coingecko:hedera-hashgraph', provider: 'coingecko', providerAssetId: 'hedera-hashgraph' },
  ICP: { canonicalKey: 'coingecko:internet-computer', provider: 'coingecko', providerAssetId: 'internet-computer' },
  ETC: { canonicalKey: 'coingecko:ethereum-classic', provider: 'coingecko', providerAssetId: 'ethereum-classic' },
  FIL: { canonicalKey: 'coingecko:filecoin', provider: 'coingecko', providerAssetId: 'filecoin' },
  LDO: { canonicalKey: 'coingecko:lido-dao', provider: 'coingecko', providerAssetId: 'lido-dao' },
  DAI: { canonicalKey: 'coingecko:dai', provider: 'coingecko', providerAssetId: 'dai' },
  CRO: { canonicalKey: 'coingecko:crypto-com-chain', provider: 'coingecko', providerAssetId: 'crypto-com-chain' },
  MKR: { canonicalKey: 'coingecko:maker', provider: 'coingecko', providerAssetId: 'maker' },
  ALGO: { canonicalKey: 'coingecko:algorand', provider: 'coingecko', providerAssetId: 'algorand' },
  VET: { canonicalKey: 'coingecko:vechain', provider: 'coingecko', providerAssetId: 'vechain' },
  TIA: { canonicalKey: 'coingecko:celestia', provider: 'coingecko', providerAssetId: 'celestia' },
  IMX: { canonicalKey: 'coingecko:immutable-x', provider: 'coingecko', providerAssetId: 'immutable-x' },
  GRT: { canonicalKey: 'coingecko:the-graph', provider: 'coingecko', providerAssetId: 'the-graph' },
  STX: { canonicalKey: 'coingecko:blockstack', provider: 'coingecko', providerAssetId: 'blockstack' },
  RUNE: { canonicalKey: 'coingecko:thorchain', provider: 'coingecko', providerAssetId: 'thorchain' },
  KAS: { canonicalKey: 'coingecko:kaspa', provider: 'coingecko', providerAssetId: 'kaspa' },
});

export const MARKET_TIMESERIES_INTERVALS = Object.freeze({
  '1h': { ms: 60 * 60 * 1000, maxRangeMs: 31 * 24 * 60 * 60 * 1000 },
  '4h': { ms: 4 * 60 * 60 * 1000, maxRangeMs: 180 * 24 * 60 * 60 * 1000 },
  '1d': { ms: 24 * 60 * 60 * 1000, maxRangeMs: 5 * 365 * 24 * 60 * 60 * 1000 },
});

export const MARKET_TIMESERIES_LIMITS = Object.freeze({
  defaultPageSize: 250,
  maxPageSize: 500,
  maxGapRanges: 250,
});

const finiteInteger = (value) => Number.isFinite(Number(value)) && Number.isInteger(Number(value));

export function parseMarketTimeseriesQuery(searchParams, now = Date.now()) {
  const asset = String(searchParams.get('asset') || '').toUpperCase();
  const interval = String(searchParams.get('interval') || '1d').toLowerCase();
  const assetSpec = MARKET_TIMESERIES_ASSETS[asset];
  const intervalSpec = MARKET_TIMESERIES_INTERVALS[interval];

  if (!assetSpec) {
    return { ok: false, status: 400, code: 'UNSUPPORTED_ASSET', error: 'Unsupported market-history asset' };
  }
  if (!intervalSpec) {
    return { ok: false, status: 400, code: 'UNSUPPORTED_INTERVAL', error: 'Unsupported market-history interval' };
  }

  const requestedTo = searchParams.get('to');
  const to = requestedTo === null ? Number(now) : Number(requestedTo);
  const requestedFrom = searchParams.get('from');
  const defaultRange = Math.min(intervalSpec.maxRangeMs, intervalSpec.ms * 90);
  const from = requestedFrom === null ? to - defaultRange : Number(requestedFrom);
  const requestedLimit = searchParams.get('limit');
  const limit = requestedLimit === null ? MARKET_TIMESERIES_LIMITS.defaultPageSize : Number(requestedLimit);
  const requestedCursor = searchParams.get('cursor');
  const cursor = requestedCursor === null ? null : Number(requestedCursor);

  if (!finiteInteger(from) || !finiteInteger(to) || from < 0 || to <= from) {
    return { ok: false, status: 400, code: 'INVALID_RANGE', error: 'from/to must be valid epoch-millisecond integers with to > from' };
  }
  if (to - from > intervalSpec.maxRangeMs) {
    return { ok: false, status: 400, code: 'RANGE_TOO_LARGE', error: 'Requested market-history range exceeds the interval policy' };
  }
  if (!finiteInteger(limit) || limit < 1 || limit > MARKET_TIMESERIES_LIMITS.maxPageSize) {
    return { ok: false, status: 400, code: 'INVALID_LIMIT', error: `limit must be an integer from 1 to ${MARKET_TIMESERIES_LIMITS.maxPageSize}` };
  }
  if (cursor !== null && (!finiteInteger(cursor) || cursor <= from || cursor > to)) {
    return { ok: false, status: 400, code: 'INVALID_CURSOR', error: 'cursor must be an epoch-millisecond integer inside the requested range' };
  }

  return {
    ok: true,
    asset,
    assetSpec,
    interval,
    intervalSpec,
    quoteCurrency: 'USD',
    from,
    to,
    limit,
    cursor,
  };
}

export function normalizeStoredCandle(row) {
  if (!row) return null;
  const candle = {
    openTime: Number(row.open_time),
    closeTime: Number(row.close_time),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: row.volume === null || row.volume === undefined ? null : Number(row.volume),
    volumeUnit: row.volume_unit || null,
    provider: String(row.provider || ''),
    providerAssetId: String(row.provider_asset_id || ''),
    canonicalKey: String(row.canonical_key || ''),
    providerObservedAt: row.provider_observed_at === null || row.provider_observed_at === undefined ? null : Number(row.provider_observed_at),
    retrievedAt: Number(row.retrieved_at),
    ingestRunId: String(row.ingest_run_id || ''),
    ingestMode: String(row.ingest_mode || ''),
    provenance: String(row.provenance || ''),
    schemaVersion: Number(row.schema_version),
  };

  const requiredNumbers = [candle.openTime, candle.closeTime, candle.open, candle.high, candle.low, candle.close, candle.retrievedAt];
  if (requiredNumbers.some((value) => !Number.isFinite(value))) return null;
  if (candle.volume !== null && !Number.isFinite(candle.volume)) return null;
  if (candle.openTime < 0 || candle.closeTime <= candle.openTime) return null;
  if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) return null;
  if (candle.high < Math.max(candle.open, candle.close, candle.low)) return null;
  if (candle.low > Math.min(candle.open, candle.close, candle.high)) return null;
  if (candle.volume !== null && candle.volume < 0) return null;
  return candle;
}

export function compressMissingIntervals(observedTimes, from, to, intervalMs, maxRanges = MARKET_TIMESERIES_LIMITS.maxGapRanges) {
  if (![from, to, intervalMs].every((value) => finiteInteger(value)) || to <= from || intervalMs <= 0) return [];
  const observed = new Set(
    (observedTimes || [])
      .map(Number)
      .filter((value) => Number.isInteger(value) && value >= from && value < to),
  );

  const first = Math.ceil(from / intervalMs) * intervalMs;
  const lastExclusive = Math.floor((to - 1) / intervalMs) * intervalMs + intervalMs;
  const ranges = [];
  let gapStart = null;
  let missingCount = 0;

  for (let ts = first; ts < lastExclusive; ts += intervalMs) {
    if (!observed.has(ts)) {
      if (gapStart === null) gapStart = ts;
      missingCount += 1;
      continue;
    }
    if (gapStart !== null) {
      ranges.push({ from: gapStart, to: ts, expectedIntervals: missingCount });
      if (ranges.length >= maxRanges) return ranges;
      gapStart = null;
      missingCount = 0;
    }
  }

  if (gapStart !== null && ranges.length < maxRanges) {
    ranges.push({ from: gapStart, to: lastExclusive, expectedIntervals: missingCount });
  }
  return ranges;
}

export function expectedIntervalCount(from, to, intervalMs) {
  if (![from, to, intervalMs].every((value) => finiteInteger(value)) || to <= from || intervalMs <= 0) return 0;
  const first = Math.ceil(from / intervalMs) * intervalMs;
  const last = Math.floor((to - 1) / intervalMs) * intervalMs;
  if (last < first) return 0;
  return Math.floor((last - first) / intervalMs) + 1;
}
