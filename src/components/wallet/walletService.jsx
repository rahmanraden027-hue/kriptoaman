// Unified wallet data service for integration & performance
import { base44 } from '@/api/base44Client';

const CACHE_DURATION = 30000; // 30 seconds
let cache = {
  userBalance: null,
  adminBalance: null,
  transactions: null,
  lastFetch: {}
};

export const walletService = {
  // Get user balance with caching
  async getUserBalance(forceRefresh = false) {
    const cacheKey = 'userBalance';
    const now = Date.now();

    if (!forceRefresh && cache[cacheKey] && 
        (now - (cache.lastFetch[cacheKey] || 0)) < CACHE_DURATION) {
      return cache[cacheKey];
    }

    try {
      const data = localStorage.getItem('user_wallet_assets');
      const assets = data ? JSON.parse(data) : [];
      
      const balance = {
        assets,
        totalUSD: assets.reduce((sum, asset) => {
          const prices = { BTC: 45000, ETH: 2500, SOL: 150, USDT: 1, BNB: 600, XRP: 2.5 };
          return sum + (asset.amount * (prices[asset.coin] || 0));
        }, 0),
        lastUpdated: new Date().toISOString(),
      };

      cache[cacheKey] = balance;
      cache.lastFetch[cacheKey] = now;
      return balance;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      return cache[cacheKey] || { assets: [], totalUSD: 0 };
    }
  },

  // Get admin balance
  async getAdminBalance(forceRefresh = false) {
    const cacheKey = 'adminBalance';
    const now = Date.now();

    if (!forceRefresh && cache[cacheKey] && 
        (now - (cache.lastFetch[cacheKey] || 0)) < CACHE_DURATION) {
      return cache[cacheKey];
    }

    try {
      const user = await base44.auth.me();
      const balance = user?.balances || {
        BTC: 2.5,
        ETH: 15,
        SOL: 200,
        USDT: 50000,
      };

      cache[cacheKey] = balance;
      cache.lastFetch[cacheKey] = now;
      return balance;
    } catch (error) {
      console.error('Error fetching admin balance:', error);
      return cache[cacheKey] || {};
    }
  },

  // Get user transactions
  async getUserTransactions(limit = 50) {
    try {
      const stored = localStorage.getItem('user_transactions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  },

  // Add transaction
  async addTransaction(tx) {
    try {
      const stored = localStorage.getItem('user_transactions') || '[]';
      const transactions = JSON.parse(stored);
      
      const newTx = {
        id: `tx_${Date.now()}`,
        ...tx,
        timestamp: new Date().toISOString(),
      };

      transactions.push(newTx);
      localStorage.setItem('user_transactions', JSON.stringify(transactions));
      
      // Invalidate cache
      cache.transactions = null;
      return newTx;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  // Update asset
  async updateAsset(assetId, updates) {
    try {
      const stored = localStorage.getItem('user_wallet_assets') || '[]';
      const assets = JSON.parse(stored);
      
      const index = assets.findIndex(a => a.id === assetId);
      if (index === -1) throw new Error('Asset not found');

      assets[index] = { ...assets[index], ...updates };
      localStorage.setItem('user_wallet_assets', JSON.stringify(assets));
      
      // Invalidate cache
      cache.userBalance = null;
      return assets[index];
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  },

  // Bulk operations
  async getAllWalletData() {
    try {
      const [userBalance, adminBalance, transactions] = await Promise.all([
        this.getUserBalance(),
        this.getAdminBalance(),
        this.getUserTransactions(),
      ]);

      return {
        userBalance,
        adminBalance,
        transactions,
      };
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      return {
        userBalance: { assets: [], totalUSD: 0 },
        adminBalance: {},
        transactions: [],
      };
    }
  },

  // Clear cache
  clearCache() {
    cache = {
      userBalance: null,
      adminBalance: null,
      transactions: null,
      lastFetch: {}
    };
  },
};