import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock,
  CheckCircle2, XCircle, Search, Filter, Trash2, RefreshCw
} from 'lucide-react';

const TX_KEY = 'app_tx_history';

export function addTransaction(tx) {
  try {
    const history = JSON.parse(localStorage.getItem(TX_KEY)) || [];
    const entry = {
      id: Date.now() + Math.random(),
      date: new Date().toISOString(),
      status: 'success',
      ...tx,
    };
    localStorage.setItem(TX_KEY, JSON.stringify([entry, ...history].slice(0, 200)));
    return entry;
  } catch {}
}

export function loadTransactions() {
  try { return JSON.parse(localStorage.getItem(TX_KEY)) || []; } catch { return []; }
}

// ── Seed demo data if empty ───────────────────────────────────────────────────
function seedDemoData() {
  const existing = loadTransactions();
  if (existing.length > 0) return;

  const demos = [
    { type: 'deposit', protocol: 'Aave', amount: 500, token: 'USDT', network: 'Ethereum', apy: 5.82, status: 'success' },
    { type: 'swap', fromToken: 'ETH', toToken: 'USDT', fromAmount: 0.15, toAmount: 512.4, network: 'Ethereum', dex: '1inch', status: 'success' },
    { type: 'withdraw', protocol: 'Compound', amount: 200, token: 'USDT', network: 'Ethereum', earned: 1.23, status: 'success' },
    { type: 'swap', fromToken: 'BNB', toToken: 'USDC', fromAmount: 1.2, toAmount: 698.4, network: 'BNB Chain', dex: 'PancakeSwap', status: 'success' },
    { type: 'deposit', protocol: 'Curve 3Pool', amount: 1000, token: 'USDT', network: 'Multi-chain', apy: 7.24, status: 'success' },
    { type: 'swap', fromToken: 'SOL', toToken: 'USDC', fromAmount: 5, toAmount: 860, network: 'Solana', dex: 'Jupiter', status: 'pending' },
    { type: 'withdraw', protocol: 'Yearn Finance', amount: 350, token: 'USDT', network: 'Ethereum', earned: 4.87, status: 'success' },
    { type: 'deposit', protocol: 'Beefy Finance', amount: 250, token: 'USDT', network: 'BNB Chain', apy: 9.38, status: 'success' },
    { type: 'swap', fromToken: 'MATIC', toToken: 'ETH', fromAmount: 500, toAmount: 0.212, network: 'Polygon', dex: 'QuickSwap', status: 'failed' },
    { type: 'deposit', protocol: 'Kamino Finance', amount: 300, token: 'USDC', network: 'Solana', apy: 11.4, status: 'success' },
  ].map((tx, i) => ({
    ...tx,
    id: Date.now() - i * 86400000 * (0.5 + Math.random()),
    date: new Date(Date.now() - i * 86400000 * (0.5 + Math.random())).toISOString(),
  }));

  localStorage.setItem(TX_KEY, JSON.stringify(demos));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  deposit:  { label: 'Deposit',   icon: ArrowDownLeft,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  withdraw: { label: 'Penarikan', icon: ArrowUpRight,   color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  swap:     { label: 'Swap',      icon: ArrowLeftRight, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
};

const STATUS_CONFIG = {
  success: { label: 'Berhasil', icon: CheckCircle2, color: 'text-green-400' },
  pending: { label: 'Pending',  icon: Clock,        color: 'text-yellow-400' },
  failed:  { label: 'Gagal',    icon: XCircle,      color: 'text-red-400' },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function TxCard({ tx }) {
  const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.deposit;
  const sta = STATUS_CONFIG[tx.status] || STATUS_CONFIG.success;
  const Icon = cfg.icon;
  const StatIcon = sta.icon;

  return (
    <div className={`bg-slate-800/50 border rounded-2xl p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left: type icon + title */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cfg.bg}`}>
            <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{cfg.label}</span>
              <span className={`flex items-center gap-1 text-[10px] font-medium ${sta.color}`}>
                <StatIcon className="w-3 h-3" />{sta.label}
              </span>
            </div>
            <div className="text-slate-500 text-xs mt-0.5">{formatDate(tx.date)}</div>
          </div>
        </div>

        {/* Right: amount */}
        <div className="text-right shrink-0">
          {tx.type === 'swap' ? (
            <>
              <div className="text-white font-bold text-sm">
                {parseFloat(tx.fromAmount).toLocaleString()} {tx.fromToken}
              </div>
              <div className="text-slate-400 text-xs">→ {parseFloat(tx.toAmount).toLocaleString()} {tx.toToken}</div>
            </>
          ) : (
            <>
              <div className={`font-bold text-sm ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                {tx.type === 'deposit' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()} {tx.token}
              </div>
              {tx.earned && <div className="text-green-400 text-xs">+{tx.earned} reward</div>}
            </>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        {tx.protocol && (
          <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">{tx.protocol}</span>
        )}
        {tx.dex && (
          <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">via {tx.dex}</span>
        )}
        {tx.network && (
          <span className="px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-400">{tx.network}</span>
        )}
        {tx.apy && (
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{tx.apy}% APY</span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const FILTER_TYPES = ['Semua', 'Deposit', 'Swap', 'Penarikan'];
const FILTER_STATUS = ['Semua', 'Berhasil', 'Pending', 'Gagal'];
const TYPE_MAP = { 'Deposit': 'deposit', 'Swap': 'swap', 'Penarikan': 'withdraw' };
const STATUS_MAP = { 'Berhasil': 'success', 'Pending': 'pending', 'Gagal': 'failed' };

export default function TxHistory() {
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const reload = useCallback(() => {
    seedDemoData();
    setTxs(loadTransactions());
  }, []);

  useEffect(() => { reload(); }, []);

  const clearAll = () => {
    if (!window.confirm('Hapus semua riwayat transaksi?')) return;
    localStorage.removeItem(TX_KEY);
    setTxs([]);
  };

  const filtered = txs.filter(tx => {
    const matchType = filterType === 'Semua' || tx.type === TYPE_MAP[filterType];
    const matchStatus = filterStatus === 'Semua' || tx.status === STATUS_MAP[filterStatus];
    const q = search.toLowerCase();
    const matchSearch = !search
      || tx.protocol?.toLowerCase().includes(q)
      || tx.dex?.toLowerCase().includes(q)
      || tx.token?.toLowerCase().includes(q)
      || tx.fromToken?.toLowerCase().includes(q)
      || tx.toToken?.toLowerCase().includes(q)
      || tx.network?.toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  // Stats
  const totalDeposit = txs.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + (t.amount || 0), 0);
  const totalWithdraw = txs.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + (t.amount || 0), 0);
  const totalSwaps = txs.filter(t => t.type === 'swap' && t.status === 'success').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md mx-auto p-4 pb-24 space-y-4">

        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">Riwayat Transaksi</h1>
              <div className="text-slate-500 text-[10px]">{txs.length} aktivitas tercatat</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={reload} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            {txs.length > 0 && (
              <button onClick={clearAll} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Deposit', value: `$${totalDeposit.toLocaleString()}`, color: 'text-green-400' },
            { label: 'Total Tarik', value: `$${totalWithdraw.toLocaleString()}`, color: 'text-orange-400' },
            { label: 'Total Swap', value: `${totalSwaps}x`, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 text-center">
              <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-[10px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari protokol, token, jaringan..."
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-slate-600" />
        </div>

        {/* Filter: type */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTER_TYPES.map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${filterType === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}>
              {f}
            </button>
          ))}
          <div className="w-px bg-slate-700 shrink-0" />
          {FILTER_STATUS.map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${filterStatus === f ? 'bg-slate-600 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-700 mx-auto" />
            <div className="text-slate-500 text-sm">Belum ada transaksi ditemukan</div>
            <div className="text-slate-600 text-xs">Aktivitas dari Savings & DEX akan muncul di sini</div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(tx => <TxCard key={tx.id} tx={tx} />)}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs">Riwayat tersimpan di perangkat lokal Anda</p>
      </div>
    </div>
  );
}