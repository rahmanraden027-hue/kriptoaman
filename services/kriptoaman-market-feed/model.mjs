const USD_PRODUCT_RE = /^([A-Z0-9]+)[-\/]USD$/;

export const CORE_SYMBOLS = ['BTC','ETH','SOL','XRP','ADA','DOGE','AVAX','DOT','LINK','LTC'];

export function normalizeVenueSymbol(product) {
  const match = String(product || '').toUpperCase().match(USD_PRODUCT_RE);
  return match ? match[1] : null;
}

export function normalizeObservation(input) {
  const venue = String(input?.venue || '').toLowerCase();
  const symbol = String(input?.symbol || '').toUpperCase();
  const price = Number(input?.price);
  const observedAt = Number(input?.observedAt);
  if (!['coinbase','kraken'].includes(venue)) return null;
  if (!CORE_SYMBOLS.includes(symbol)) return null;
  if (!Number.isFinite(price) || price <= 0) return null;
  if (!Number.isSafeInteger(observedAt) || observedAt <= 0) return null;

  const valueOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;
  return {
    venue,
    symbol,
    price,
    change24h: valueOrNull(input?.change24h),
    volume24h: valueOrNull(input?.volume24h),
    high24h: valueOrNull(input?.high24h),
    low24h: valueOrNull(input?.low24h),
    observedAt,
  };
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
}

export function buildConsensus(observations, now = Date.now(), staleMs = 20_000) {
  const fresh = observations
    .map(normalizeObservation)
    .filter(Boolean)
    .filter(item => now - item.observedAt <= staleMs);

  const bySymbol = new Map();
  for (const item of fresh) {
    if (!bySymbol.has(item.symbol)) bySymbol.set(item.symbol, []);
    bySymbol.get(item.symbol).push(item);
  }

  return CORE_SYMBOLS.map(symbol => {
    const rows = bySymbol.get(symbol) || [];
    if (!rows.length) return null;
    const center = median(rows.map(row => row.price));
    const accepted = rows.filter(row => Math.abs(row.price - center) / center <= 0.02);
    if (!accepted.length) return null;
    const consensus = median(accepted.map(row => row.price));
    const spreadsBps = accepted.length > 1
      ? ((Math.max(...accepted.map(r=>r.price)) - Math.min(...accepted.map(r=>r.price))) / consensus) * 10_000
      : null;
    const newest = Math.max(...accepted.map(row => row.observedAt));

    const changeValues = accepted.map(row => row.change24h).filter(Number.isFinite);
    const volumeValues = accepted.map(row => row.volume24h).filter(Number.isFinite);
    const highValues = accepted.map(row => row.high24h).filter(Number.isFinite);
    const lowValues = accepted.map(row => row.low24h).filter(Number.isFinite);

    return {
      symbol,
      quote: 'USD',
      price: consensus,
      change24h: median(changeValues),
      volume24h: volumeValues.length ? Math.max(...volumeValues) : null,
      high24h: highValues.length ? Math.max(...highValues) : null,
      low24h: lowValues.length ? Math.min(...lowValues) : null,
      observedAt: newest,
      ageMs: Math.max(0, now - newest),
      venueCount: accepted.length,
      venues: accepted.map(row => row.venue).sort(),
      spreadBps: Number.isFinite(spreadsBps) ? Number(spreadsBps.toFixed(2)) : null,
      quality: accepted.length >= 2 ? 'multi-venue' : 'single-venue',
    };
  }).filter(Boolean);
}

export function buildFeedPayload(observations, venueStates, now = Date.now()) {
  const assets = buildConsensus(observations, now);
  const coreCovered = new Set(assets.map(asset => asset.symbol));
  const venueList = Object.entries(venueStates || {}).map(([venue,state]) => ({
    venue,
    connected: Boolean(state?.connected),
    lastMessageAt: Number(state?.lastMessageAt) || null,
    reconnects: Number(state?.reconnects) || 0,
  }));
  return {
    schema: 'kriptoaman.market-feed.v1',
    status: coreCovered.size >= 8 ? 'live' : coreCovered.size >= 5 ? 'degraded' : 'unavailable',
    collector: {
      ownership: 'KriptoAman',
      mode: 'server-side-websocket',
      syntheticValues: false,
    },
    provenance: {
      marketPriceOrigin: 'external-trading-venues',
      venues: venueList.map(v=>v.venue),
      browserDirectVenueAccess: false,
    },
    coverage: {
      expectedCoreSymbols: CORE_SYMBOLS,
      availableCoreSymbols: [...coreCovered],
      available: coreCovered.size,
      expected: CORE_SYMBOLS.length,
    },
    venues: venueList,
    assets,
    generatedAt: now,
  };
}
