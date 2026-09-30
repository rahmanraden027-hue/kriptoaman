import { useState, useEffect } from 'react';
import { getReadOnlyMarketPrices } from '@/lib/readOnlyMarketPrices';

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
    const params = new URLSearchParams({
      address: String(contractAddress).toLowerCase(),
      chainId: String(chainId),
    });
    const res = await fetch(`/api/token-price?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) return persisted?.data || null;

    const payload = await res.json();
    const tokenData = payload?.data;

    if (tokenData && Number.isFinite(Number(tokenData.price))) {
      const result = {
        price: Number(tokenData.price),
        change24h: Number.isFinite(Number(tokenData.change24h)) ? Number(tokenData.change24h) : null,
        marketCap: Number.isFinite(Number(tokenData.marketCap)) ? Number(tokenData.marketCap) : null,
        volume24h: Number.isFinite(Number(tokenData.volume24h)) ? Number(tokenData.volume24h) : null,
        lastUpdated: tokenData.lastUpdated || null,
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
