/**
 * Multi-Chain Service
 * Unified API untuk mengakses balance, send, swap across all networks
 */

import { NETWORKS, COINS, getCoinBySymbol, getNetworkBySymbol, getCoinsForNetwork } from './multiChainConfig';

export class MultiChainService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get balance for a coin on a specific network
   */
  async getBalance(userEmail, coinSymbol, networkKey) {
    try {
      const cacheKey = `${userEmail}:${coinSymbol}:${networkKey}`;
      
      // Check cache (5 min)
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < 5 * 60 * 1000) return data;
      }

      const coin = getCoinBySymbol(coinSymbol);
      const network = NETWORKS[networkKey];

      if (!coin || !network) return null;
      if (!coin.networks.includes(networkKey)) return null;

      // Fetch from your backend API
      const response = await fetch(`/api/balance?email=${userEmail}&coin=${coinSymbol}&network=${networkKey}`);
      const data = await response.json();

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      console.error('Balance fetch error:', err);
      return null;
    }
  }

  /**
   * Get balances for all coins on a network
   */
  async getNetworkBalances(userEmail, networkKey) {
    try {
      const coins = getCoinsForNetwork(networkKey);
      const balances = await Promise.all(
        coins.map(coin => this.getBalance(userEmail, coin, networkKey))
      );
      return coins.reduce((acc, coin, i) => {
        if (balances[i]) acc[coin] = balances[i];
        return acc;
      }, {});
    } catch (err) {
      console.error('Network balances error:', err);
      return {};
    }
  }

  /**
   * Get total portfolio value across all networks
   */
  async getTotalPortfolioValue(userEmail) {
    try {
      const response = await fetch(`/api/portfolio/total?email=${userEmail}`);
      return await response.json();
    } catch (err) {
      console.error('Portfolio value error:', err);
      return { totalUsd: 0, byNetwork: {}, byAsset: {} };
    }
  }

  /**
   * Get trading pairs available on network
   */
  getAvailablePairs(networkKey) {
    const coins = getCoinsForNetwork(networkKey);
    const pairs = [];
    for (let i = 0; i < coins.length; i++) {
      for (let j = i + 1; j < coins.length; j++) {
        pairs.push(`${coins[i]}/${coins[j]}`);
      }
    }
    return pairs;
  }

  /**
   * Get price for trading pair
   */
  async getPrice(pair, networkKey) {
    try {
      const [from, to] = pair.split('/');
      const response = await fetch(
        `/api/price?from=${from}&to=${to}&network=${networkKey}`
      );
      return await response.json();
    } catch (err) {
      console.error('Price fetch error:', err);
      return null;
    }
  }

  /**
   * Execute cross-chain swap
   */
  async executeSwap(userEmail, fromCoin, toCoin, fromNetwork, toNetwork, amount) {
    try {
      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          fromCoin,
          toCoin,
          fromNetwork,
          toNetwork,
          amount,
        }),
      });
      const data = await response.json();
      this.clearCache(userEmail);
      return data;
    } catch (err) {
      console.error('Swap error:', err);
      throw err;
    }
  }

  /**
   * Send coin cross-chain
   */
  async send(userEmail, coin, network, toAddress, amount) {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, coin, network, toAddress, amount }),
      });
      const data = await response.json();
      this.clearCache(userEmail);
      return data;
    } catch (err) {
      console.error('Send error:', err);
      throw err;
    }
  }

  /**
   * Get transaction history across networks
   */
  async getTransactionHistory(userEmail, limit = 50) {
    try {
      const response = await fetch(`/api/tx-history?email=${userEmail}&limit=${limit}`);
      return await response.json();
    } catch (err) {
      console.error('Tx history error:', err);
      return [];
    }
  }

  /**
   * Clear cache for user
   */
  clearCache(userEmail) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(userEmail)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get network stats (TVL, 24h volume, etc)
   */
  async getNetworkStats(networkKey) {
    try {
      const response = await fetch(`/api/network-stats?network=${networkKey}`);
      return await response.json();
    } catch (err) {
      console.error('Network stats error:', err);
      return null;
    }
  }

  /**
   * Get recommended gas fees for network
   */
  async getGasFees(networkKey) {
    try {
      const response = await fetch(`/api/gas-fees?network=${networkKey}`);
      return await response.json();
    } catch (err) {
      console.error('Gas fees error:', err);
      return { standard: 0, fast: 0, instant: 0 };
    }
  }
}

export const multiChainService = new MultiChainService();