import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, Filter, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const COIN_INFO = {
  BTC: { color: '#F7931A', symbol: '₿' },
  ETH: { color: '#627EEA', symbol: 'Ξ' },
  SOL: { color: '#9945FF', symbol: '◎' },
  USDT: { color: '#26A17B', symbol: '₮' },
  BNB: { color: '#F3BA2F', symbol: 'Ⓑ' },
  XRP: { color: '#23292F', symbol: '✕' },
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Berhasil' },
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Tertunda' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Gagal' },
};

// Generate sample transactions
const generateSampleTransactions = () => {
  const coins = ['BTC', 'ETH', 'SOL', 'USDT', 'BNB'];
  const types = ['deposit', 'withdrawal', 'transfer'];
  const statuses = ['completed', 'pending', 'failed'];
  const transactions = [];

  for (let i = 0; i < 25; i++) {
    const coin = coins[Math.floor(Math.random() * coins.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = (Math.random() * 10 + 0.1).toFixed(4);
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    transactions.push({
      id: `tx_${i}`,
      type,
      coin,
      amount: parseFloat(amount),
      status,
      date: date.toISOString(),
      address: `${coin === 'BTC' ? '1' : '0x'}${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`,
      hash: `${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`,
      isAdmin: Math.random() > 0.6,
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export default function ComprehensiveTransactionHistory() {
  const [transactions] = useState(generateSampleTransactions());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [expanded, setExpanded] = useState(true);

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (searchQuery && !tx.coin.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !tx.hash.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (filterType !== 'all' && tx.type !== filterType) return false;
        if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
        if (filterWallet === 'admin' && !tx.isAdmin) return false;
        if (filterWallet === 'user' && tx.isAdmin) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.date) - new Date(a.date);
          case 'date-asc':
            return new Date(a.date) - new Date(b.date);
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          default:
            return 0;
        }
      });
  }, [transactions, searchQuery, filterType, filterStatus, filterWallet, sortBy]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: 'Setor',
      withdrawal: 'Tarik',
      transfer: 'Transfer',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Kemarin';
    } else if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    } else {
      return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    }
  };

  const stats = {
    total: filtered.length,
    completed: filtered.filter((tx) => tx.status === 'completed').length,
    pending: filtered.filter((tx) => tx.status === 'pending').length,
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-purple-600 flex items-center justify-center">
            <Clock className="w-3 h-3 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-sm">Riwayat Transaksi</h3>
            <p className="text-purple-300 text-[10px]">{stats.total} transaksi</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-green-400 text-xs font-bold">{stats.completed} Berhasil</p>
          <p className="text-yellow-400 text-[10px]">{stats.pending} Tertunda</p>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-purple-700/50 max-h-96 overflow-y-auto">
          {/* Search & Filters */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari coin atau hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Filter Rows */}
            <div className="grid grid-cols-2 gap-2">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="deposit">Setor</option>
                <option value="withdrawal">Tarik</option>
                <option value="transfer">Transfer</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Berhasil</option>
                <option value="pending">Tertunda</option>
                <option value="failed">Gagal</option>
              </select>

              {/* Wallet Filter */}
              <select
                value={filterWallet}
                onChange={(e) => setFilterWallet(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="all">Semua Dompet</option>
                <option value="user">Dompet Saya</option>
                <option value="admin">Admin</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="date-desc">Terbaru</option>
                <option value="date-asc">Terlama</option>
                <option value="amount-desc">Jumlah (↓)</option>
                <option value="amount-asc">Jumlah (↑)</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((tx) => {
                const statusConfig = STATUS_CONFIG[tx.status];
                const StatusIcon = statusConfig.icon;
                const coinInfo = COIN_INFO[tx.coin] || { color: '#999999', symbol: '○' };

                return (
                  <div
                    key={tx.id}
                    className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3 hover:border-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: coinInfo.color }}
                          >
                            {coinInfo.symbol}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 ${statusConfig.bg}`}>
                            <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(tx.type)}
                              <p className="text-white text-xs font-semibold">{getTypeLabel(tx.type)}</p>
                              {tx.isAdmin && (
                                <span className="text-[8px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-[10px] mt-0.5 truncate">{tx.address}</p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className={`text-xs font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.coin}
                            </p>
                            <p className="text-slate-500 text-[10px]">{formatDate(tx.date)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Tidak ada transaksi yang sesuai</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}