import { useState, useEffect } from 'react';
import { getReadOnlyMarketPrices } from '@/lib/readOnlyMarketPrices';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// In-memory cache for optional contract-token display data.
const marketDataCache = {};
const cacheExpiry = 60000; // 1 minute freshness; persisted fallback has no hard expiry.

const contractCacheKey = (contractAddress, chainId) => `ka_contract_market_${chainId}_${String(contractAddress || '').toLowerCase()}`;

const readPersistedContractCache = (contractAddress, chainId) => {
  try {
    const cached = JSON.parse(localStorage.getItem(contractCacheKey(contractAddress, chainId)) || 'null');
    return cached?.data ? cached : null;
  } catch {
    return null;
  }
};

const persistContractCache = (contractAddress, chainId, data) => {
  try {
    localStorage.setItem(contractCacheKey(contractAddress, chainId), JSON.stringify({
      savedAt: Date.now(),
      data,
    }));
  } catch {
    // Storage restrictions must never interrupt wallet rendering.
  }
};

// Fetch optional display-only market data for a token by contract address.
// If the external lookup is unavailable, preserve the last successful observation.
export async function fetchTokenMarketData(contractAddress, chainId = 1) {
  if (!contractAddress) return null;
  const cacheKey = `${contractAddress}-${chainId}`;
  const cached = marketDataCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < cacheExpiry) return cached.data;

  const persisted = readPersistedContractCache(contractAddress, chainId);

  try {
    // Existing contract-token lookup remains optional and display-only.
    const res = await fetch(
      `${COINGECKO_API}/simple/token_price/ethereum?...`,
      {
        method: 'GET',
        headers: {
          'x-cg-pro-api-key': import.meta.env.COINGECKO_API_KEY,
        },
      },
    );

    if (!res.ok) return persisted?.data || null;

    const data = await res.json();
    const tokenData = data[contractAddress.toLowerCase()];

    if (tokenData) {
      const result = {
        price: tokenData.usd || 0,
        change24h: tokenData.usd_24h_change || 0,
        marketCap: tokenData.usd_market_cap || null,
        volume24h: tokenData.usd_24h_vol || null,
        lastUpdated: tokenData.last_updated_at || null,
      };

      marketDataCache[cacheKey] = { data: result, timestamp: Date.now() };
      persistContractCache(contractAddress, chainId, result);
      return result;
    }
  } catch (error) {
    console.error('Error fetching token market data:', error);
  }

  return persisted?.data || null;
}

export function useTokenMarketData(contractAddress, chainId = 1) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contractAddress) return;
    setLoading(true);
    fetchTokenMarketData(contractAddress, chainId).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [contractAddress, chainId]);

  return { data, loading };
}

// Read-only portfolio display pricing uses the KriptoAman persisted market path.
// This does not provide or alter execution quotes for swaps/trades.
export function useCryptoPrices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () => getReadOnlyMarketPrices().then(p => {
      if (!alive) return;
      setPrices(p);
      setLoading(false);
    });

    load();
    const interval = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return { prices, loading };
}
