const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin', stablecoin: false },
  { symbol: 'ETH', name: 'Ethereum', coinGeckoId: 'ethereum', stablecoin: false },
  { symbol: 'BNB', name: 'BNB', coinGeckoId: 'binancecoin', stablecoin: false },
  { symbol: 'SOL', name: 'Solana', coinGeckoId: 'solana', stablecoin: false },
  { symbol: 'XRP', name: 'XRP', coinGeckoId: 'ripple', stablecoin: false },
  { symbol: 'USDT', name: 'Tether', coinGeckoId: 'tether', stablecoin: true },
  { symbol: 'USDC', name: 'USD Coin', coinGeckoId: 'usd-coin', stablecoin: true },
];

const COINLORE_NAME_OVERRIDES = {
  BNB: 'binance coin',
};

const CORE_SYMBOLS = new Set(['BTC', 'ETH', 'BNB', 'SOL', 'XRP']);
const REQUEST_TIMEOUT_MS = 6_000;
const MAX_OBSERVATION_AGE_MS = 2 * 60 * 1000;
const ALIGNED_MAX_BPS = 50;
const WATCH_MAX_BPS = 150;
const STABLECOIN_WATCH_BPS = 50;
const STABLECOIN_DEPEG_BPS = 100;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=5, s-maxage=20, stale-while-revalidate=40, stale-if-error=120',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

function coinGeckoConfig(env = {}) {
  if (env.COINGECKO_PRO_API_KEY) {
    return {
      baseUrl: 'https://pro-api.coingecko.com/api/v3',
      headers: { 'x-cg-pro-api-key': env.COINGECKO_PRO_API_KEY },
      tier: 'pro',
    };
  }
  const demoKey = env.COINGECKO_DEMO_API_KEY || env.COINGECKO_API_KEY;
  if (demoKey) {
    return {
      baseUrl: 'https://api.coingecko.com/api/v3',
      headers: { 'x-cg-demo-api-key': demoKey },
      tier: 'demo',
    };
  }
  return {
    baseUrl: 'https://api.coingecko.com/api/v3',
    headers: {},
    tier: 'public-keyless',
  };
}

async function fetchJson(url, { provider, headers = {} } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KriptoAman-Market-Consensus/1.0',
        ...headers,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${provider || 'provider'} HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function calculateDispersionBps(a, b) {
  const first = Number(a);
  const second = Number(b);
  if (!Number.isFinite(first) || !Number.isFinite(second) || first <= 0 || second <= 0) return null;
  const midpoint = (first + second) / 2;
  return Math.round((Math.abs(first - second) / midpoint) * 10_000 * 100) / 100;
}

export function classifyConsensus(dispersionBps) {
  if (dispersionBps === null || dispersionBps === undefined || dispersionBps === '') return 'insufficient';
  const bps = Number(dispersionBps);
  if (!Number.isFinite(bps) || bps < 0) return 'insufficient';
  if (bps <= ALIGNED_MAX_BPS) return 'aligned';
  if (bps <= WATCH_MAX_BPS) return 'watch';
  return 'divergent';
}

export function classifyStablecoinPeg(referencePrice, consensusStatus) {
  if (!Number.isFinite(Number(referencePrice)) || Number(referencePrice) <= 0) return null;
  if (consensusStatus === 'divergent' || consensusStatus === 'insufficient') return 'unreliable';
  const deviationBps = Math.abs(Number(referencePrice) - 1) * 10_000;
  if (deviationBps >= STABLECOIN_DEPEG_BPS) return 'depeg-observed';
  if (deviationBps >= STABLECOIN_WATCH_BPS) return 'depeg-watch';
  return 'observed-near-peg';
}

function normalizeCoinLore(payload, retrievedAt) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const bySymbol = new Map();
  for (const item of rows) {
    const symbol = String(item?.symbol || '').toUpperCase();
    const spec = ASSETS.find((asset) => asset.symbol === symbol);
    if (!spec) continue;
    const observedName = String(item?.name || item?.nameid || '').trim().toLowerCase();
    const expectedName = COINLORE_NAME_OVERRIDES[spec.symbol] || spec.name.toLowerCase();
    if (observedName && observedName !== expectedName) continue;
    const price = Number(item?.price_usd);
    if (!Number.isFinite(price) || price <= 0) continue;
    const rank = Number(item?.rank);
    const existing = bySymbol.get(symbol);
    if (!existing || (Number.isFinite(rank) && rank < Number(existing.rank || Number.MAX_SAFE_INTEGER))) {
      bySymbol.set(symbol, {
        provider: 'coinlore',
        providerAssetId: String(item?.id || ''),
        symbol,
        price,
        observedAt: retrievedAt,
        retrievedAt,
        timestampType: 'retrieved',
        rank: Number.isFinite(rank) ? rank : null,
      });
    }
  }
  return bySymbol;
}

function normalizeCoinGecko(payload, retrievedAt) {
  const bySymbol = new Map();
  for (const spec of ASSETS) {
    const item = payload?.[spec.coinGeckoId];
    const price = Number(item?.usd);
    if (!Number.isFinite(price) || price <= 0) continue;
    const sourceTimestamp = Number(item?.last_updated_at) * 1000;
    bySymbol.set(spec.symbol, {
      provider: 'coingecko',
      providerAssetId: spec.coinGeckoId,
      symbol: spec.symbol,
      price,
      observedAt: Number.isFinite(sourceTimestamp) && sourceTimestamp > 0 ? sourceTimestamp : retrievedAt,
      retrievedAt,
      timestampType: Number.isFinite(sourceTimestamp) && sourceTimestamp > 0 ? 'provider' : 'retrieved',
    });
  }
  return bySymbol;
}

async function fetchCoinLore() {
  const retrievedAt = Date.now();
  const payload = await fetchJson('https://api.coinlore.net/api/tickers/?start=0&limit=200', {
    provider: 'CoinLore',
  });
  return {
    provider: 'coinlore',
    retrievedAt,
    observations: normalizeCoinLore(payload, retrievedAt),
  };
}

async function fetchCoinGecko(env = {}) {
  const config = coinGeckoConfig(env);
  const retrievedAt = Date.now();
  const ids = ASSETS.map((asset) => asset.coinGeckoId).join(',');
  const params = new URLSearchParams({
    ids,
    vs_currencies: 'usd',
    include_last_updated_at: 'true',
    precision: 'full',
  });
  const payload = await fetchJson(`${config.baseUrl}/simple/price?${params.toString()}`, {
    provider: `CoinGecko ${config.tier}`,
    headers: config.headers,
  });
  return {
    provider: 'coingecko',
    tier: config.tier,
    retrievedAt,
    observations: normalizeCoinGecko(payload, retrievedAt),
  };
}

export function buildConsensus({ providerResults = [], now = Date.now() } = {}) {
  const successful = providerResults.filter((result) => result?.observations instanceof Map);
  const providerFailures = providerResults
    .filter((result) => result?.error)
    .map((result) => ({ provider: result.provider, error: result.error }));

  const assets = ASSETS.map((spec) => {
    const observations = successful
      .map((result) => result.observations.get(spec.symbol))
      .filter(Boolean)
      .map((observation) => ({
        ...observation,
        ageMs: Math.max(0, Number(now) - Number(observation.observedAt || 0)),
      }));

    const fresh = observations.filter((observation) => observation.ageMs <= MAX_OBSERVATION_AGE_MS);
    const prices = fresh.map((observation) => Number(observation.price)).filter((price) => Number.isFinite(price) && price > 0);
    const referencePrice = prices.length >= 2
      ? Math.round(((prices[0] + prices[1]) / 2) * 1e12) / 1e12
      : null;
    const dispersionBps = prices.length >= 2 ? calculateDispersionBps(prices[0], prices[1]) : null;
    const consensusStatus = classifyConsensus(dispersionBps);
    const stablecoinPeg = spec.stablecoin
      ? classifyStablecoinPeg(referencePrice, consensusStatus)
      : null;
    const pegDeviationBps = spec.stablecoin && Number.isFinite(Number(referencePrice))
      ? Math.round(Math.abs(Number(referencePrice) - 1) * 10_000 * 100) / 100
      : null;

    return {
      symbol: spec.symbol,
      name: spec.name,
      canonicalKey: `coingecko:${spec.coinGeckoId}`,
      comparisonOnly: true,
      providerCount: fresh.length,
      observations,
      referencePrice,
      referenceSemantics: referencePrice === null
        ? 'unavailable-without-two-fresh-independent-observations'
        : 'arithmetic-midpoint-for-provider-comparison-only-not-an-execution-price',
      dispersionBps,
      consensusStatus,
      stablecoin: spec.stablecoin,
      stablecoinPeg,
      pegDeviationBps,
    };
  });

  const core = assets.filter((asset) => CORE_SYMBOLS.has(asset.symbol));
  const coreComplete = core.every((asset) => asset.providerCount >= 2);
  const divergentCore = core.filter((asset) => asset.consensusStatus === 'divergent').map((asset) => asset.symbol);
  const watchCore = core.filter((asset) => asset.consensusStatus === 'watch').map((asset) => asset.symbol);
  const healthy = coreComplete && divergentCore.length === 0;
  const status = healthy ? (watchCore.length ? 'watch' : 'aligned') : 'degraded';

  return {
    schemaVersion: '1.0',
    healthy,
    status,
    generatedAt: Number(now),
    providerCount: successful.length,
    providerFailures,
    thresholds: {
      alignedMaxBps: ALIGNED_MAX_BPS,
      watchMaxBps: WATCH_MAX_BPS,
      observationFreshMs: MAX_OBSERVATION_AGE_MS,
      stablecoinWatchBps: STABLECOIN_WATCH_BPS,
      stablecoinDepegBps: STABLECOIN_DEPEG_BPS,
    },
    coreCoverage: {
      requiredSymbols: Array.from(CORE_SYMBOLS),
      complete: coreComplete,
      divergentSymbols: divergentCore,
      watchSymbols: watchCore,
    },
    assets,
    policy: {
      replacesCustomerMarketPrice: false,
      crossProviderIdentityReconciliation: 'explicit-core-map-only',
      averagingPolicy: 'No provider observations are overwritten. The arithmetic midpoint is exposed only as a comparison reference when two fresh independent observations exist.',
      stablecoinPolicy: 'Observed prices are never forced to USD 1.00. Peg status is derived from fresh provider observations and withheld when provider consensus is unreliable.',
      interpretation: 'Operational cross-provider market-data agreement only; not investment advice, valuation, best execution, or a guaranteed tradable price.',
    },
  };
}

export async function onRequestGet({ env }) {
  const requestId = crypto.randomUUID();
  const settled = await Promise.allSettled([fetchCoinLore(), fetchCoinGecko(env)]);
  const providerResults = settled.map((result, index) => {
    const provider = index === 0 ? 'coinlore' : 'coingecko';
    if (result.status === 'fulfilled') return result.value;
    return { provider, error: result.reason?.message || String(result.reason) };
  });

  const consensus = buildConsensus({ providerResults });
  const hasAnyObservations = consensus.assets.some((asset) => asset.observations.length > 0);
  if (!hasAnyObservations) {
    return json({
      ...consensus,
      requestId,
      error: 'Cross-provider market observations unavailable',
      code: 'MARKET_CONSENSUS_UNAVAILABLE',
    }, 503, { 'Retry-After': '20' });
  }

  return json({ ...consensus, requestId }, 200, {
    'X-KriptoAman-Market-Consensus': consensus.status,
    'X-KriptoAman-Market-Consensus-Providers': String(consensus.providerCount),
  });
}
