import { useState, useEffect } from 'react';
import { getPrices } from './multiCoinApi';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Cache for market data
const marketDataCache = {};
const cacheExpiry = 60000; // 1 minute

// Fetch market data for a specific token by contract address
export async function fetchTokenMarketData(contractAddress, chainId = 1) {
  const cacheKey = `${contractAddress}-${chainId}`;
  const cached = marketDataCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < cacheExpiry) {
    return cached.data;
  }

  try {
    // Try to fetch from CoinGecko by contract address
    const res = await fetch(
      `${COINGECKO_API}/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`,
      { method: 'GET' }
    );

    if (!res.ok) return null;
    
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

      // Cache the result
      marketDataCache[cacheKey] = {
        data: result,
        timestamp: Date.now(),
      };

      return result;
    }
  } catch (error) {
    console.error('Error fetching token market data:', error);
  }

  return null;
}

// Hook to use market data for a token
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

// Hook to fetch crypto prices (BTC, ETH, SOL, etc.)
export function useCryptoPrices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPrices().then(p => {
      setPrices(p);
      setLoading(false);
    });

    // Refresh prices every 30 seconds
    const interval = setInterval(() => {
      getPrices().then(setPrices);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
}