import { useEffect, useRef, useState } from 'react';

const MARKET_ASSET_LIMIT = 2500;
const MIN_ACCEPTED_ASSETS = 2001;
const PAGE_SIZE = 250;
const MARKET_CACHE_KEY = 'ka_market_snapshot_v3';
const MARKET_CACHE_MAX_AGE = 60 * 60 * 1000;
const REFRESH_INTERVAL = 15 * 60 * 1000;
const CRYPTOCOMPARE_IMAGE_BASE = 'https://www.cryptocompare.com';

/**
 * Loads up to 350 crypto assets with provider failover.
 * CoinGecko remains the primary source; CryptoCompare is used when CoinGecko
 * is rate-limited, blocked by CORS, or returns an incomplete result.
 */
export default function useCoinMarkets() {
  const [markets, setMarkets] = useState({});
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('cache');
  const [lastUpdated, setLastUpdated] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;

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
      setLastUpdated(savedAt);
      setLoading(false);
      return true;
    };

    try {
      const cached = JSON.parse(localStorage.getItem(MARKET_CACHE_KEY) || 'null');
      if (
        cached?.savedAt &&
        Date.now() - cached.savedAt < MARKET_CACHE_MAX_AGE &&
        Array.isArray(cached.data)
      ) {
        applyData(cached.data, cached.source || 'cache', cached.savedAt);
      }
    } catch {
      localStorage.removeItem(MARKET_CACHE_KEY);
    }

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
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) {
        throw new Error(`CoinGecko market request failed: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('CoinGecko returned invalid data');
      return data;
    };

    const fetchCoinGecko = async () => {
      const data = [];
      for (let page = 1; page <= Math.ceil(MARKET_ASSET_LIMIT / PAGE_SIZE); page += 1) {
        try {
          const rows = await fetchCoinGeckoPage(page);
          data.push(...rows);
          if (rows.length < PAGE_SIZE || data.length >= MARKET_ASSET_LIMIT) break;
        } catch {
          if (data.length >= MIN_ACCEPTED_ASSETS) break;
          throw new Error(`CoinGecko stopped at page ${page}`);
        }
      }

      if (data.length < MIN_ACCEPTED_ASSETS) {
        throw new Error(`CoinGecko returned only ${data.length} assets`);
      }
      return data.slice(0, MARKET_ASSET_LIMIT);
    };

    const fetchCryptoComparePage = async (page) => {
      const params = new URLSearchParams({
        limit: '99',
        page: String(page),
        tsym: 'USD',
      });
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/top/totalvolfull?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) {
        throw new Error(`CryptoCompare market request failed: ${response.status}`);
      }

      const payload = await response.json();
      if (!Array.isArray(payload?.Data)) {
        throw new Error('CryptoCompare returned invalid data');
      }
      return payload.Data;
    };

    const fetchCryptoCompare = async () => {
      const rows = [];
      const maxPages = Math.ceil(MARKET_ASSET_LIMIT / 100) + 2;
      for (let page = 0; page < maxPages; page += 1) {
        try {
          const pageRows = await fetchCryptoComparePage(page);
          if (pageRows.length === 0) break;
          rows.push(...pageRows);
          if (rows.length >= MARKET_ASSET_LIMIT + 100) break;
        } catch {
          if (rows.length >= MIN_ACCEPTED_ASSETS) break;
          throw new Error(`CryptoCompare stopped at page ${page}`);
        }
      }

      if (rows.length < MIN_ACCEPTED_ASSETS) {
        throw new Error(`CryptoCompare returned only ${rows.length} assets`);
      }

      return rows.map((item, index) => {
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
      const params = new URLSearchParams({
        start: String(start),
        limit: '100',
      });
      const response = await fetch(
        `https://api.coinlore.net/api/tickers/?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) {
        throw new Error(`CoinLore market request failed: ${response.status}`);
      }
      const payload = await response.json();
      if (!Array.isArray(payload?.data)) {
        throw new Error('CoinLore returned invalid data');
      }
      return payload.data;
    };

    const fetchCoinLore = async () => {
      const rows = [];
      const batchSize = 5;

      for (let batchStart = 0; batchStart < MARKET_ASSET_LIMIT; batchStart += batchSize * 100) {
        const starts = Array.from(
          { length: batchSize },
          (_, index) => batchStart + index * 100,
        ).filter((start) => start < MARKET_ASSET_LIMIT);

        const results = await Promise.allSettled(
          starts.map((start) => fetchCoinLorePage(start)),
        );
        const batchRows = results
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value);

        rows.push(...batchRows);
        if (batchRows.length === 0 || rows.length >= MARKET_ASSET_LIMIT) break;
      }

      if (rows.length < MIN_ACCEPTED_ASSETS) {
        throw new Error(`CoinLore returned only ${rows.length} assets`);
      }

      return rows.slice(0, MARKET_ASSET_LIMIT).map((item, index) => ({
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
      const providers = [
        ['coinlore', fetchCoinLore],
        ['coingecko', fetchCoinGecko],
        ['cryptocompare', fetchCryptoCompare],
      ];

      for (const [provider, fetchProvider] of providers) {
        try {
          const data = await fetchProvider();
          if (!alive || !Array.isArray(data) || data.length === 0) return;

          const { normalized } = normalize(data);
          if (normalized.length < MIN_ACCEPTED_ASSETS) {
            throw new Error(
              `${provider} returned only ${normalized.length} unique assets after deduplication`,
            );
          }

          const savedAt = Date.now();
          applyData(data, provider, savedAt);
          localStorage.setItem(
            MARKET_CACHE_KEY,
            JSON.stringify({ savedAt, source: provider, data }),
          );
          return;
        } catch {
          // Continue to the next provider and preserve the last good cache.
        }
      }

      if (alive) setLoading(false);
    };

    load();
    timer.current = setInterval(load, REFRESH_INTERVAL);

    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return {
    markets,
    coins,
    loading,
    source,
    lastUpdated,
    dataAvailable: coins.length > 0,
  };
}
