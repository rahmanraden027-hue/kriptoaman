import { useEffect, useRef, useState } from 'react';

const IDS = 'bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,chainlink,polkadot,matic-network,litecoin,shiba-inu,pepe,tron,uniswap';

/**
 * useCoinMarkets — fetches real 7-day sparkline + 24h stats for all tracked
 * coins from CoinGecko's /coins/markets endpoint. Single call, refreshed
 * every 60s. Returns a map keyed by symbol (BTC, ETH, ...).
 */
export default function useCoinMarkets() {
  const [markets, setMarkets] = useState({});
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=24h&precision=2`
        );
        if (!r.ok) throw new Error('bad');
        const data = await r.json();
        if (!alive || !Array.isArray(data)) return;
        const map = {};
        data.forEach(c => {
          const sym = (c.symbol || '').toUpperCase();
          if (!sym) return;
          map[sym] = {
            sym,
            name: c.name,
            image: c.image,
            price: c.current_price,
            change24h: c.price_change_percentage_24h,
            marketCap: c.market_cap,
            volume: c.total_volume,
            high24h: c.high_24h,
            low24h: c.low_24h,
            rank: c.market_cap_rank,
            sparkline: c.sparkline_in_7d?.price || [],
          };
        });
        setMarkets(map);
      } catch (e) {
        /* network / rate-limit — keep previous data */
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    timer.current = setInterval(load, 60000);
    return () => { alive = false; if (timer.current) clearInterval(timer.current); };
  }, []);

  return { markets, loading };
}