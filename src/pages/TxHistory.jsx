import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock,
  CheckCircle2, XCircle, Search, Trash2, RefreshCw, ShieldCheck
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
    <div className="space-y-3 rounded-2xl border border-slate-700/40 bg-slate-800/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.bg}`}><Icon className={`h-4.5 w-4.5 ${cfg.color}`} /></div>
          <div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{cfg.label}</span><span className={`flex items-center gap-1 text-[10px] font-medium ${sta.color}`}><StatIcon className="h-3 w-3" />{sta.label}</span></div><div className="mt-0.5 text-xs text-slate-500">{formatDate(tx.date)}</div></div>
        </div>
        <div className="shrink-0 text-right">
          {tx.type === 'swap' ? <><div className="text-sm font-bold text-white">{parseFloat(tx.fromAmount || 0).toLocaleString()} {tx.fromToken}</div><div className="text-xs text-slate-400">→ {parseFloat(tx.toAmount || 0).toLocaleString()} {tx.toToken}</div></> : <><div className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>{tx.type === 'deposit' ? '+' : '-'}{parseFloat(tx.amount || 0).toLocaleString()} {tx.token}</div>{tx.earned && <div className="text-xs text-green-400">+{tx.earned} reward</div>}</>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-[10px]">
        {tx.protocol && <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-slate-300">{tx.protocol}</span>}
        {tx.dex && <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-slate-300">via {tx.dex}</span>}
        {tx.network && <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-slate-400">{tx.network}</span>}
        {tx.hash && <span className="max-w-full truncate rounded-full bg-sky-500/10 px-2 py-0.5 font-mono text-sky-300">{tx.hash}</span>}
      </div>
    </div>
  );
}

const FILTER_TYPES = ['Semua', 'Deposit', 'Swap', 'Penarikan'];
const FILTER_STATUS = ['Semua', 'Berhasil', 'Pending', 'Gagal'];
const TYPE_MAP = { Deposit: 'deposit', Swap: 'swap', Penarikan: 'withdraw' };
const STATUS_MAP = { Berhasil: 'success', Pending: 'pending', Gagal: 'failed' };

export default function TxHistory() {
  const [params] = useSearchParams();
  const initialHash = params.get('hash') || '';
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState(initialHash);
  const [filterType, setFilterType] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const reload = useCallback(() => { setTxs(loadTransactions()); }, []);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { if (initialHash) setSearch(initialHash); }, [initialHash]);

  const clearAll = () => {
    if (!window.confirm('Hapus semua riwayat transaksi lokal?')) return;
    localStorage.removeItem(TX_KEY);
    setTxs([]);
  };

  const filtered = txs.filter(tx => {
    const matchType = filterType === 'Semua' || tx.type === TYPE_MAP[filterType];
    const matchStatus = filterStatus === 'Semua' || tx.status === STATUS_MAP[filterStatus];
    const q = search.toLowerCase();
    const matchSearch = !search
      || String(tx.hash || '').toLowerCase().includes(q)
      || String(tx.id || '').toLowerCase().includes(q)
      || tx.protocol?.toLowerCase().includes(q)
      || tx.dex?.toLowerCase().includes(q)
      || tx.token?.toLowerCase().includes(q)
      || tx.fromToken?.toLowerCase().includes(q)
      || tx.toToken?.toLowerCase().includes(q)
      || tx.network?.toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  const totalDeposit = txs.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalWithdraw = txs.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalSwaps = txs.filter(t => t.type === 'swap' && t.status === 'success').length;

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10"><Clock className="h-4 w-4 text-sky-300" /></div><div><h1 className="font-bold text-white">Riwayat Transaksi Lokal</h1><div className="text-[10px] text-slate-500">{txs.length} aktivitas benar-benar tercatat pada perangkat ini</div></div></div>
          <div className="flex items-center gap-1.5"><button onClick={reload} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400"><RefreshCw className="h-4 w-4" /></button>{txs.length > 0 && <button onClick={clearAll} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>}</div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-[11px] leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Tidak ada data demo yang dibuat otomatis. Halaman ini hanya menampilkan aktivitas yang benar-benar tersimpan melalui aplikasi pada perangkat ini.</div>

        <div className="grid grid-cols-3 gap-2">{[
          { label: 'Total Deposit', value: `$${totalDeposit.toLocaleString()}`, color: 'text-green-400' },
          { label: 'Total Tarik', value: `$${totalWithdraw.toLocaleString()}`, color: 'text-orange-400' },
          { label: 'Total Swap', value: `${totalSwaps}x`, color: 'text-blue-400' },
        ].map(s => <div key={s.label} className="rounded-xl border border-slate-700/30 bg-slate-800/50 p-3 text-center"><div className={`text-base font-bold ${s.color}`}>{s.value}</div><div className="mt-0.5 text-[10px] text-slate-500">{s.label}</div></div>)}</div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2"><Search className="h-4 w-4 shrink-0 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari hash, protokol, token, jaringan..." className="min-h-11 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-600" /></div>

        <div className="flex gap-2 overflow-x-auto pb-1">{FILTER_TYPES.map(f => <button key={f} onClick={() => setFilterType(f)} className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs ${filterType === f ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>{f}</button>)}<div className="w-px shrink-0 bg-slate-700" />{FILTER_STATUS.map(f => <button key={f} onClick={() => setFilterStatus(f)} className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs ${filterStatus === f ? 'border-slate-500 bg-slate-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>{f}</button>)}</div>

        {filtered.length === 0 ? <div className="space-y-3 py-16 text-center"><Clock className="mx-auto h-10 w-10 text-slate-700" /><div className="text-sm text-slate-500">Belum ada transaksi yang sesuai.</div><div className="text-xs text-slate-600">Riwayat kosong tetap kosong sampai aplikasi benar-benar mencatat aktivitas.</div></div> : <div className="space-y-2.5">{filtered.map(tx => <TxCard key={tx.id} tx={tx} />)}</div>}
        <p className="text-center text-xs text-slate-600">Riwayat tersimpan secara lokal pada perangkat ini.</p>
      </div>
    </div>
  );
}
