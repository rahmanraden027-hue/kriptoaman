import { useEffect, useRef, useState } from 'react';

const MARKET_ASSET_LIMIT = 350;
const PAGE_SIZE = 250;
const MARKET_CACHE_KEY = 'ka_market_snapshot_v2';
const MARKET_CACHE_MAX_AGE = 30 * 60 * 1000;
const REFRESH_INTERVAL = 2 * 60 * 1000;
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
      const results = await Promise.allSettled([
        fetchCoinGeckoPage(1),
        fetchCoinGeckoPage(2),
      ]);
      const data = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
        .slice(0, MARKET_ASSET_LIMIT);

      if (data.length < 300) {
        throw new Error(`CoinGecko returned only ${data.length} assets`);
      }
      return data;
    };

    const fetchCryptoCompare = async () => {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/top/totalvolfull?limit=${MARKET_ASSET_LIMIT - 1}&tsym=USD`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) {
        throw new Error(`CryptoCompare market request failed: ${response.status}`);
      }

      const payload = await response.json();
      if (!Array.isArray(payload?.Data)) {
        throw new Error('CryptoCompare returned invalid data');
      }

      return payload.Data.map((item, index) => {
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

    const load = async () => {
      const providers = [
        ['coingecko', fetchCoinGecko],
        ['cryptocompare', fetchCryptoCompare],
      ];

      for (const [provider, fetchProvider] of providers) {
        try {
          const data = await fetchProvider();
          if (!alive || !Array.isArray(data) || data.length === 0) return;

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
