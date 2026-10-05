import { useEffect, useRef, useState } from 'react';

const MARKET_ASSET_LIMIT = 5000;
const SERVER_PAGE_SIZE = 500;
const SERVER_PAGE_CONCURRENCY = 2;
const MARKET_CACHE_KEY = 'ka_market_snapshot_v5';
const MARKET_CACHE_FRESH_AGE = 30 * 60 * 1000;
const REFRESH_INTERVAL = 15 * 60 * 1000;
const REQUEST_TIMEOUT = 12 * 1000;

const finiteNumberOrNull = (value) => (
  value !== null
  && value !== undefined
  && value !== ''
  && Number.isFinite(Number(value))
    ? Number(value)
    : null
);

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    return await fetch(url, { ...options, cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const compactSnapshot = (data) => data.map((coin) => ({
  id: coin.id,
  symbol: coin.symbol,
  name: coin.name,
  image: coin.image || '',
  current_price: coin.current_price,
  price_change_percentage_24h: coin.price_change_percentage_24h,
  market_cap: coin.market_cap,
  total_volume: coin.total_volume,
  high_24h: coin.high_24h,
  low_24h: coin.low_24h,
  market_cap_rank: coin.market_cap_rank,
  sparkline_in_7d: {
    price: Array.isArray(coin.sparkline_in_7d?.price)
      ? coin.sparkline_in_7d.price.slice(-168)
      : [],
  },
}));

/**
 * Browser data boundary:
 * - reads only KriptoAman-owned API paths;
 * - may render the last verified local cache if the API is temporarily unavailable;
 * - never calls CoinGecko/CoinLore/CryptoCompare/exchange endpoints directly.
 *
 * Upstream venue/provider access belongs to server-side KriptoAman collectors only.
 */
export default function useCoinMarkets() {
  const [markets, setMarkets] = useState({});
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('cache');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [cacheAgeMs, setCacheAgeMs] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    let loadGeneration = 0;

    const normalize = (data) => {
      const map = {};
      const seen = new Set();
      const normalized = data
        .map((coin, index) => {
          const sym = String(coin?.symbol || '').toUpperCase();
          const entry = {
            id: coin?.id || sym.toLowerCase(),
            sym,
            name: coin?.name || sym,
            image: coin?.image || '',
            color: '#10b981',
            price: finiteNumberOrNull(coin?.current_price),
            change24h: finiteNumberOrNull(coin?.price_change_percentage_24h),
            marketCap: finiteNumberOrNull(coin?.market_cap),
            volume: finiteNumberOrNull(coin?.total_volume),
            high24h: finiteNumberOrNull(coin?.high_24h),
            low24h: finiteNumberOrNull(coin?.low_24h),
            rank: Number(coin?.market_cap_rank) || index + 1,
            sparkline: Array.isArray(coin?.sparkline_in_7d?.price)
              ? coin.sparkline_in_7d.price
              : [],
          };
          if (!entry.id || !sym || seen.has(sym)) return null;
          seen.add(sym);
          map[sym] = entry;
          return entry;
        })
        .filter(Boolean)
        .slice(0, MARKET_ASSET_LIMIT);

      return { map, normalized };
    };

    const applyData = (data, provider, savedAt = Date.now()) => {
      if (!alive || !Array.isArray(data) || data.length === 0) return false;
      const { map, normalized } = normalize(data);
      if (normalized.length === 0) return false;

      setCoins(normalized);
      setMarkets(map);
      setSource(provider);
      const age = Math.max(0, Date.now() - savedAt);
      setLastUpdated(savedAt);
      setCacheAgeMs(age);
      setIsStale(age > MARKET_CACHE_FRESH_AGE);
      setLoading(false);
      return true;
    };

    const saveCache = (data, savedAt, provider) => {
      try {
        localStorage.setItem(
          MARKET_CACHE_KEY,
          JSON.stringify({ savedAt, source: provider, data: compactSnapshot(data) }),
        );
      } catch {
        // Quota/privacy-mode failures must not invalidate fresh server data.
      }
    };

    try {
      const cached = JSON.parse(localStorage.getItem(MARKET_CACHE_KEY) || 'null');
      if (cached?.savedAt && Array.isArray(cached.data) && cached.data.length > 0) {
        applyData(cached.data, 'kriptoaman-cache', cached.savedAt);
      }
    } catch {
      localStorage.removeItem(MARKET_CACHE_KEY);
    }

    const fetchServerPage = async (page) => {
      const response = await fetchWithTimeout(
        `/api/market-snapshot-page?page=${page}&limit=${SERVER_PAGE_SIZE}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error(`KriptoAman market page request failed: ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.data) || payload.data.length === 0) {
        throw new Error(`KriptoAman market page ${page} returned no assets`);
      }
      return payload;
    };

    const hydrateServerPages = async (firstPayload, generation) => {
      const capturedAt = Number(firstPayload.capturedAt) || Date.now();
      const maxPages = Math.min(
        Number(firstPayload.totalPages) || 1,
        Math.ceil(MARKET_ASSET_LIMIT / SERVER_PAGE_SIZE),
      );
      let combined = firstPayload.data.slice(0, MARKET_ASSET_LIMIT);

      for (let startPage = 1; startPage < maxPages; startPage += SERVER_PAGE_CONCURRENCY) {
        if (!alive || generation !== loadGeneration) return;
        const pages = Array.from(
          { length: SERVER_PAGE_CONCURRENCY },
          (_, offset) => startPage + offset,
        ).filter((page) => page < maxPages);
        const results = await Promise.allSettled(pages.map((page) => fetchServerPage(page)));

        for (const result of results) {
          if (result.status !== 'fulfilled') continue;
          const pagePayload = result.value;
          if (Number(pagePayload.capturedAt) !== Number(firstPayload.capturedAt)) return;
          combined.push(...pagePayload.data);
        }

        combined = combined.slice(0, MARKET_ASSET_LIMIT);
        if (!alive || generation !== loadGeneration) return;
        applyData(combined, 'kriptoaman-market-db', capturedAt);
        saveCache(combined, capturedAt, 'kriptoaman-market-db');
      }
    };

    const load = async () => {
      const generation = ++loadGeneration;
      try {
        const firstPayload = await fetchServerPage(0);
        if (!alive || generation !== loadGeneration) return;
        const savedAt = Number(firstPayload.capturedAt) || Date.now();
        applyData(firstPayload.data, 'kriptoaman-market-db', savedAt);
        saveCache(firstPayload.data, savedAt, 'kriptoaman-market-db');
        void hydrateServerPages(firstPayload, generation);
      } catch {
        if (alive && generation === loadGeneration) {
          setLoading(false);
          setIsStale(true);
        }
      }
    };

    const refreshWhenOnline = () => load();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load();
    };

    load();
    timer.current = setInterval(load, REFRESH_INTERVAL);
    window.addEventListener('online', refreshWhenOnline);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      alive = false;
      loadGeneration += 1;
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener('online', refreshWhenOnline);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  return {
    markets,
    coins,
    loading,
    source,
    lastUpdated,
    isStale,
    cacheAgeMs,
    assetLimit: MARKET_ASSET_LIMIT,
    dataAvailable: coins.length > 0,
  };
}
