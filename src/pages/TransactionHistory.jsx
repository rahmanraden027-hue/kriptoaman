import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadTradeHistory } from '../components/wallet/dexApi';
import {
  ArrowLeft, ArrowDownUp, CheckCircle2, Clock, AlertCircle,
  Search, SortAsc, SortDesc, Trash2, Filter, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PROTOCOL_LOGOS = { uniswap: '🦄', thorchain: '⚡', '1inch': '🔀' };
const PROTOCOL_NAMES = { uniswap: 'Uniswap V3', thorchain: 'THORChain', '1inch': '1inch' };

function StatusBadge({ status }) {
  if (status === 'completed') return (
    <span className="flex items-center gap-1 text-green-400 text-xs bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Completed
    </span>
  );
  if (status === 'pending') return (
    <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> Failed
    </span>
  );
}

function TradeCard({ trade, expanded, onToggle }) {
  const date = new Date(trade.date);
  const isCrossChain = trade.fromToken !== trade.toToken && trade.protocol === 'thorchain';

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 hover:border-violet-500/30 rounded-xl overflow-hidden transition-all">
      {/* Summary Row */}
      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isCrossChain ? 'bg-orange-500/20' : 'bg-violet-500/20'}`}>
          {isCrossChain ? <Zap className="w-4 h-4 text-orange-400" /> : <ArrowDownUp className="w-4 h-4 text-violet-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white text-sm font-medium truncate">
              {trade.fromToken} → {trade.toToken}
            </span>
            <StatusBadge status={trade.status || 'completed'} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-slate-500 text-xs">
              {PROTOCOL_LOGOS[trade.protocol] || '🔀'} {PROTOCOL_NAMES[trade.protocol] || trade.protocol}
            </span>
            <span className="text-slate-500 text-xs">
              {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' · '}
              {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-slate-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-700/50 px-4 py-3 space-y-2 bg-slate-900/40">
          <DetailRow label="Dikirim" value={`${typeof trade.fromAmount === 'number' ? trade.fromAmount.toFixed(6) : trade.fromAmount} ${trade.fromToken}`} sub={trade.fromUSD ? `$${trade.fromUSD.toFixed(2)}` : null} />
          <DetailRow label="Diterima" value={`${typeof trade.toAmount === 'number' ? trade.toAmount.toFixed(6) : trade.toAmount} ${trade.toToken}`} sub={trade.toUSD ? `$${trade.toUSD.toFixed(2)}` : null} highlight />
          <DetailRow label="Gas Fee" value={`$${trade.gasFee || '0.00'}`} warn />
          {trade.slippage && <DetailRow label="Slippage Toleransi" value={`${trade.slippage}%`} />}
          <DetailRow label="Protokol" value={`${PROTOCOL_LOGOS[trade.protocol] || '🔀'} ${PROTOCOL_NAMES[trade.protocol] || trade.protocol}`} />
          <DetailRow label="Tanggal" value={date.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} />
          {trade.id && (
            <div className="flex justify-between text-xs pt-1">
              <span className="text-slate-500">ID Transaksi</span>
              <span className="text-slate-400 font-mono">#{trade.id}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, sub, highlight, warn }) {
  return (
    <div className="flex items-start justify-between text-xs gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <div className="text-right">
        <span className={warn ? 'text-yellow-400' : highlight ? 'text-violet-300' : 'text-slate-200'}>{value}</span>
        {sub && <span className="text-slate-500 ml-1">({sub})</span>}
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const [history, setHistory] = useState(() => loadTradeHistory());
  const [search, setSearch] = useState('');
  const [filterToken, setFilterToken] = useState('all');
  const [filterProtocol, setFilterProtocol] = useState('all');
  const [sortDir, setSortDir] = useState('desc'); // desc = newest first
  const [expandedId, setExpandedId] = useState(null);

  // Collect unique tokens and protocols from history
  const tokens = useMemo(() => {
    const set = new Set();
    history.forEach(t => { set.add(t.fromToken); set.add(t.toToken); });
    return ['all', ...Array.from(set)];
  }, [history]);

  const protocols = useMemo(() => {
    const set = new Set(history.map(t => t.protocol).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [history]);

  const filtered = useMemo(() => {
    return history
      .filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !q || t.fromToken?.toLowerCase().includes(q) || t.toToken?.toLowerCase().includes(q) || t.protocol?.toLowerCase().includes(q);
        const matchToken = filterToken === 'all' || t.fromToken === filterToken || t.toToken === filterToken;
        const matchProtocol = filterProtocol === 'all' || t.protocol === filterProtocol;
        return matchSearch && matchToken && matchProtocol;
      })
      .sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortDir === 'desc' ? db - da : da - db;
      });
  }, [history, search, filterToken, filterProtocol, sortDir]);

  const clearAll = () => {
    localStorage.removeItem('dex_trade_history');
    setHistory([]);
  };

  // Summary stats
  const totalGas = history.reduce((s, t) => s + parseFloat(t.gasFee || 0), 0);
  const totalVol = history.reduce((s, t) => s + (t.fromUSD || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-lg mx-auto p-4 pb-10 space-y-5">
        {/* Header */}
        <div className="pt-4 flex items-center gap-3">
          <Link to={createPageUrl('Wallet')}>
            <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">Riwayat Transaksi</h1>
            <p className="text-slate-500 text-xs">{history.length} swap tercatat</p>
          </div>
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Swap', value: history.length, unit: '' },
              { label: 'Volume', value: `$${totalVol.toFixed(0)}`, unit: '' },
              { label: 'Total Gas', value: `$${totalGas.toFixed(2)}`, unit: '' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 text-center">
                <div className="text-white font-bold text-base">{s.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari token atau protokol..."
              className="bg-slate-800 border-slate-700 text-white pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Token filter */}
            <select
              value={filterToken}
              onChange={e => setFilterToken(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-2 outline-none focus:border-violet-500"
            >
              {tokens.map(t => <option key={t} value={t}>{t === 'all' ? '🪙 Semua Token' : t}</option>)}
            </select>
            {/* Protocol filter */}
            <select
              value={filterProtocol}
              onChange={e => setFilterProtocol(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-2 outline-none focus:border-violet-500"
            >
              {protocols.map(p => <option key={p} value={p}>{p === 'all' ? '🔀 Semua Protokol' : (PROTOCOL_NAMES[p] || p)}</option>)}
            </select>
            {/* Sort */}
            <button
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
            >
              {sortDir === 'desc' ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
              {sortDir === 'desc' ? 'Terbaru' : 'Terlama'}
            </button>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
              <ArrowDownUp className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">
              {history.length === 0 ? 'Belum ada transaksi' : 'Tidak ada hasil yang cocok'}
            </p>
            {history.length > 0 && (
              <button onClick={() => { setSearch(''); setFilterToken('all'); setFilterProtocol('all'); }} className="text-violet-400 text-xs hover:underline">
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(trade => (
              <TradeCard
                key={trade.id}
                trade={trade}
                expanded={expandedId === trade.id}
                onToggle={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
              />
            ))}
          </div>
        )}

        {/* Clear */}
        {history.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-slate-600 hover:text-red-400 text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus semua riwayat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}