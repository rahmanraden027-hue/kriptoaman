import { useEffect, useRef, useState } from 'react';

const MARKET_ASSET_LIMIT = 5000;
const FALLBACK_ASSET_LIMIT = 2500;
const MIN_ACCEPTED_ASSETS = 2001;
const PAGE_SIZE = 250;
const SERVER_PAGE_SIZE = 500;
const SERVER_PAGE_CONCURRENCY = 2;
const MARKET_CACHE_KEY = 'ka_market_snapshot_v4';
const MARKET_CACHE_FRESH_AGE = 30 * 60 * 1000;
const REFRESH_INTERVAL = 15 * 60 * 1000;
const REQUEST_TIMEOUT = 12 * 1000;
const CRYPTOCOMPARE_IMAGE_BASE = 'https://www.cryptocompare.com';

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
  sparkline_in_7d: { price: [] },
}));

/**
 * Loads the KriptoAman Market Database in 500-asset pages up to 5,000 assets.
 * The first page is rendered immediately and remaining pages hydrate in bounded
 * background batches. Public provider fallbacks stay capped at 2,500 assets to
 * limit rate-limit pressure, bandwidth and mobile recovery cost.
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
          const sym = (coin.symbol || '').toUpperCase();
          const entry = {
            id: coin.id || sym.toLowerCase(),
            sym,
            name: coin.name || sym,
            image: coin.image || '',
            color: '#10b981',
            price: Number.isFinite(Number(coin.current_price)) ? Number(coin.current_price) : null,
            change24h: Number.isFinite(Number(coin.price_change_percentage_24h))
              ? Number(coin.price_change_percentage_24h)
              : null,
            marketCap: Number(coin.market_cap) || 0,
            volume: Number(coin.total_volume) || 0,
            high24h: Number(coin.high_24h) || null,
            low24h: Number(coin.low_24h) || null,
            rank: Number(coin.market_cap_rank) || index + 1,
            sparkline: Array.isArray(coin.sparkline_in_7d?.price)
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
        // Quota or privacy-mode failures must not invalidate fresh data.
      }
    };

    try {
      const cached = JSON.parse(localStorage.getItem(MARKET_CACHE_KEY) || 'null');
      if (cached?.savedAt && Array.isArray(cached.data) && cached.data.length > 0) {
        applyData(cached.data, 'cache', cached.savedAt);
      }
    } catch {
      localStorage.removeItem(MARKET_CACHE_KEY);
    }

    const fetchServerPage = async (page) => {
      const response = await fetchWithTimeout(
        `/api/market-snapshot-page?page=${page}&limit=${SERVER_PAGE_SIZE}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) {
        throw new Error(`KriptoAman market page request failed: ${response.status}`);
      }
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
          if (Number(pagePayload.capturedAt) !== Number(firstPayload.capturedAt)) {
            return;
          }
          combined.push(...pagePayload.data);
        }

        combined = combined.slice(0, MARKET_ASSET_LIMIT);
        if (!alive || generation !== loadGeneration) return;
        applyData(combined, 'server', capturedAt);
        saveCache(combined, capturedAt, 'server');
      }
    };

    const fetchCoinGeckoPage = async (page) => {
      const params = new URLSearchParams({
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: String(PAGE_SIZE),
        page: String(page),
        sparkline: 'true',
        price_change_percentage: '24h',
        precision: 'full',
      });
      const response = await fetchWithTimeout(
        `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error(`CoinGecko market request failed: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('CoinGecko returned invalid data');
      return data;
    };

    const fetchCoinGecko = async () => {
      const data = [];
      for (let page = 1; page <= Math.ceil(FALLBACK_ASSET_LIMIT / PAGE_SIZE); page += 1) {
        try {
          const rows = await fetchCoinGeckoPage(page);
          data.push(...rows);
          if (rows.length < PAGE_SIZE || data.length >= FALLBACK_ASSET_LIMIT) break;
        } catch {
          if (data.length >= MIN_ACCEPTED_ASSETS) break;
          throw new Error(`CoinGecko stopped at page ${page}`);
        }
      }
      if (data.length < MIN_ACCEPTED_ASSETS) {
        throw new Error(`CoinGecko returned only ${data.length} assets`);
      }
      return data.slice(0, FALLBACK_ASSET_LIMIT);
    };

    const fetchCryptoComparePage = async (page) => {
      const params = new URLSearchParams({ limit: '99', page: String(page), tsym: 'USD' });
      const response = await fetchWithTimeout(
        `https://min-api.cryptocompare.com/data/top/totalvolfull?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error(`CryptoCompare market request failed: ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.Data)) throw new Error('CryptoCompare returned invalid data');
      return payload.Data;
    };

    const fetchCryptoCompare = async () => {
      const rows = [];
      const maxPages = Math.ceil(FALLBACK_ASSET_LIMIT / 100) + 2;
      for (let page = 0; page < maxPages; page += 1) {
        try {
          const pageRows = await fetchCryptoComparePage(page);
          if (pageRows.length === 0) break;
          rows.push(...pageRows);
          if (rows.length >= FALLBACK_ASSET_LIMIT + 100) break;
        } catch {
          if (rows.length >= MIN_ACCEPTED_ASSETS) break;
          throw new Error(`CryptoCompare stopped at page ${page}`);
        }
      }
      if (rows.length < MIN_ACCEPTED_ASSETS) {
        throw new Error(`CryptoCompare returned only ${rows.length} assets`);
      }
      return rows.slice(0, FALLBACK_ASSET_LIMIT).map((item, index) => {
        const info = item.CoinInfo || {};
        const raw = item.RAW?.USD || {};
        return {
          id: (info.Internal || info.Name || '').toLowerCase(),
          symbol: info.Name || '',
          name: info.FullName || info.Name || '',
          image: info.ImageUrl ? `${CRYPTOCOMPARE_IMAGE_BASE}${info.ImageUrl}` : '',
          current_price: raw.PRICE,
          price_change_percentage_24h: raw.CHANGEPCT24HOUR,
          market_cap: raw.MKTCAP,
          total_volume: raw.TOTALVOLUME24HTO,
          high_24h: raw.HIGH24HOUR,
          low_24h: raw.LOW24HOUR,
          market_cap_rank: index + 1,
          sparkline_in_7d: { price: [] },
        };
      });
    };

    const fetchCoinLorePage = async (start) => {
      const params = new URLSearchParams({ start: String(start), limit: '100' });
      const response = await fetchWithTimeout(
        `https://api.coinlore.net/api/tickers/?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error(`CoinLore market request failed: ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.data)) throw new Error('CoinLore returned invalid data');
      return payload.data;
    };

    const fetchCoinLore = async () => {
      const rows = [];
      const batchSize = 5;
      for (let batchStart = 0; batchStart < FALLBACK_ASSET_LIMIT; batchStart += batchSize * 100) {
        const starts = Array.from(
          { length: batchSize },
          (_, index) => batchStart + index * 100,
        ).filter((start) => start < FALLBACK_ASSET_LIMIT);
        const results = await Promise.allSettled(starts.map((start) => fetchCoinLorePage(start)));
        const batchRows = results
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value);
        rows.push(...batchRows);
        if (batchRows.length === 0 || rows.length >= FALLBACK_ASSET_LIMIT) break;
      }
      if (rows.length < MIN_ACCEPTED_ASSETS) {
        throw new Error(`CoinLore returned only ${rows.length} assets`);
      }
      return rows.slice(0, FALLBACK_ASSET_LIMIT).map((item, index) => ({
        id: `coinlore-${item.id || item.symbol || index}`,
        symbol: item.symbol || '',
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
      }));
    };

    const load = async () => {
      const generation = ++loadGeneration;

      try {
        const firstPayload = await fetchServerPage(0);
        if (!alive || generation !== loadGeneration) return;
        const savedAt = Number(firstPayload.capturedAt) || Date.now();
        applyData(firstPayload.data, 'server', savedAt);
        saveCache(firstPayload.data, savedAt, 'server');
        void hydrateServerPages(firstPayload, generation);
        return;
      } catch {
        // Fall through to bounded public-provider recovery.
      }

      const providers = [
        ['coinlore', fetchCoinLore],
        ['coingecko', fetchCoinGecko],
        ['cryptocompare', fetchCryptoCompare],
      ];

      for (const [provider, fetchProvider] of providers) {
        try {
          const data = await fetchProvider();
          if (!alive || generation !== loadGeneration || !Array.isArray(data) || data.length === 0) return;
          const { normalized } = normalize(data);
          if (normalized.length < MIN_ACCEPTED_ASSETS) {
            throw new Error(`${provider} returned only ${normalized.length} unique assets after deduplication`);
          }
          const savedAt = Date.now();
          applyData(data, provider, savedAt);
          saveCache(data, savedAt, provider);
          return;
        } catch {
          // Continue to the next provider and preserve the last good cache.
        }
      }

      if (alive && generation === loadGeneration) {
        setLoading(false);
        setIsStale(true);
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
