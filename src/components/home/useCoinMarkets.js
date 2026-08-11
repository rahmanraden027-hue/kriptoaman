import { useEffect, useRef, useState } from 'react';

const MARKET_ASSET_LIMIT = 350;
const PAGE_SIZE = 250;
const MARKET_CACHE_KEY = 'ka_market_snapshot_v1';
const MARKET_CACHE_MAX_AGE = 30 * 60 * 1000;

/**
 * Loads the top 350 crypto assets by market cap from CoinGecko.
 * Two requests are used because the public endpoint caps each page at 250.
 * Results are refreshed every two minutes to reduce rate-limit pressure.
 */
export default function useCoinMarkets() {
  const [markets, setMarkets] = useState({});
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;

    const normalize = (data) => {
      const map = {};
      const normalized = data.map((coin, index) => {
        const sym = (coin.symbol || '').toUpperCase();
        const entry = {
          id: coin.id,
          sym,
          name: coin.name,
          image: coin.image,
          color: '#10b981',
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          marketCap: coin.market_cap,
          volume: coin.total_volume,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
          rank: coin.market_cap_rank || index + 1,
          sparkline: coin.sparkline_in_7d?.price || [],
        };

        if (sym && !map[sym]) map[sym] = entry;
        return entry;
      }).filter(coin => coin.id && coin.sym);

      return { map, normalized };
    };

    try {
      const cached = JSON.parse(localStorage.getItem(MARKET_CACHE_KEY) || 'null');
      if (cached?.savedAt && Date.now() - cached.savedAt < MARKET_CACHE_MAX_AGE && Array.isArray(cached.data)) {
        const { map, normalized } = normalize(cached.data);
        setCoins(normalized);
        setMarkets(map);
        setLoading(false);
      }
    } catch {
      localStorage.removeItem(MARKET_CACHE_KEY);
    }

    const fetchPage = async (page) => {
      const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
      url.search = new URLSearchParams({
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: String(PAGE_SIZE),
        page: String(page),
        sparkline: 'true',
        price_change_percentage: '24h',
        precision: 'full',
      }).toString();

      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko market request failed: ${response.status}`);
      return response.json();
    };

    const load = async () => {
      try {
        const results = await Promise.allSettled([fetchPage(1), fetchPage(2)]);
        const data = results
          .filter(result => result.status === 'fulfilled' && Array.isArray(result.value))
          .flatMap(result => result.value)
          .slice(0, MARKET_ASSET_LIMIT);
        if (!alive || !Array.isArray(data) || data.length === 0) return;

        const { map, normalized } = normalize(data);

        setCoins(normalized);
        setMarkets(map);
        if (data.length >= 300) {
          localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
        }
      } catch {
        // Keep the last successful snapshot when offline or rate-limited.
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    timer.current = setInterval(load, 120000);
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return { markets, coins, loading };
}
