import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Send, Download, RefreshCw } from 'lucide-react';
import { useAdminNotifications } from './useAdminNotifications';

const MOCK_TRANSACTIONS = [
  {
    id: 1,
    coin: 'BTC',
    type: 'received',
    amount: 2.5,
    from: '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  },
  {
    id: 2,
    coin: 'ETH',
    type: 'sent',
    amount: 5.2,
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: 'q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6',
  },
  {
    id: 3,
    coin: 'SOL',
    type: 'received',
    amount: 125.8,
    from: '9B5X5...',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: 'j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6',
  },
  {
    id: 4,
    coin: 'USDT',
    type: 'sent',
    amount: 50000,
    to: '0x8ba1f1...',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: 'z1x2c3v4b5n6m7a8s9d0f1g2h3j4k5l6',
  },
  {
    id: 5,
    coin: 'BTC',
    type: 'sent',
    amount: 0.8,
    to: '1A1z...',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: 'p1o2i3u4y5t6r5e4w3q2a1s0d9f8g7h6',
  },
  {
    id: 6,
    coin: 'ETH',
    type: 'received',
    amount: 8.5,
    from: '0x9ff2...',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    txHash: 'l1k2j3h4g5f6d7s8a9q0w1e2r3t4y5u6',
  },
];

const COIN_INFO = {
  BTC: { color: '#F7931A', symbol: '₿', decimals: 8 },
  ETH: { color: '#627EEA', symbol: 'Ξ', decimals: 18 },
  SOL: { color: '#9945FF', symbol: '◎', decimals: 9 },
  USDT: { color: '#26A17B', symbol: '₮', decimals: 6 },
};

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours}j yang lalu`;
  if (days < 7) return `${days}h yang lalu`;
  return date.toLocaleDateString('id-ID');
}

function shortenAddress(addr) {
  if (!addr) return '—';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminTransactionHistory() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const filtered = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Riwayat Transaksi</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-900/40 rounded-lg p-1">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'received', label: 'Masuk' },
          { id: 'sent', label: 'Keluar' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors ${
              filter === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-500 text-xs">Tidak ada transaksi</p>
          </div>
        ) : (
          filtered.map(tx => {
            const info = COIN_INFO[tx.coin];
            const isReceived = tx.type === 'received';
            const addr = isReceived ? tx.from : tx.to;

            return (
              <div
                key={tx.id}
                className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-3 hover:border-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isReceived ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {isReceived ? (
                      <ArrowDownLeft className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: info.color }}
                      >
                        {info.symbol}
                      </div>
                      <p className="text-white text-xs font-semibold truncate">
                        {tx.coin} {isReceived ? 'Diterima' : 'Dikirim'}
                      </p>
                    </div>
                    <p className="text-slate-500 text-[10px] truncate">
                      {shortenAddress(addr)}
                    </p>
                  </div>

                  {/* Amount & time */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${isReceived ? 'text-green-400' : 'text-red-400'}`}>
                      {isReceived ? '+' : '-'}{tx.amount.toLocaleString('en-US', {
                        maximumFractionDigits: tx.coin === 'USDT' ? 0 : 4,
                      })}
                    </p>
                    <p className="text-slate-500 text-[10px]">{formatTime(tx.timestamp)}</p>
                  </div>
                </div>

                {/* Status bar */}
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <p className="text-slate-600 text-[9px]">
                    Confirmed · {shortenAddress(tx.txHash)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 border-t border-slate-700/30">
        <p className="text-slate-500 text-[10px]">
          {filtered.length} transaksi • Lihat lebih banyak di blok explorer
        </p>
      </div>
    </div>
  );
}