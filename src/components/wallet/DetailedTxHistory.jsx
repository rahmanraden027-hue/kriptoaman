import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, ExternalLink, ChevronDown,
  ChevronUp, Fuel, Clock, Hash, RefreshCw, Filter
} from 'lucide-react';

const EXPLORER_URLS = {
  BTC:  'https://blockstream.info/tx/',
  ETH:  'https://etherscan.io/tx/',
  BNB:  'https://bscscan.com/tx/',
  SOL:  'https://solscan.io/tx/',
  LTC:  'https://blockchair.com/litecoin/transaction/',
  DOGE: 'https://blockchair.com/dogecoin/transaction/',
  MATIC:'https://polygonscan.com/tx/',
};

const COIN_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', BNB: '#F0B90B', SOL: '#9945FF',
  LTC: '#345D9D', DOGE: '#C2A633', MATIC: '#8247E5',
};

// Generate realistic simulated transactions for a coin
function generateSimTxs(coinId, count = 15) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const isSent = Math.random() > 0.5;
    const amount = parseFloat((Math.random() * 0.5 + 0.001).toFixed(8));
    const gasPriceGwei = Math.floor(Math.random() * 50 + 10);
    const gasUsed = Math.floor(Math.random() * 100000 + 21000);
    const gasFeeEth = (gasPriceGwei * gasUsed * 1e-9).toFixed(8);
    const confirmTime = Math.floor(Math.random() * 60 + 10);
    const confirmations = Math.floor(Math.random() * 500 + 1);
    const ts = now - i * (Math.random() * 3600000 + 300000);
    return {
      hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      type: isSent ? 'sent' : 'received',
      amount,
      coin: coinId,
      from: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      to:   '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      date: new Date(ts).toISOString(),
      confirmations,
      status: confirmations > 12 ? 'confirmed' : confirmations > 0 ? 'pending' : 'failed',
      gasFeeEth: coinId === 'BTC' || coinId === 'LTC' || coinId === 'DOGE' ? null : gasFeeEth,
      gasFeeUSD: coinId === 'BTC' || coinId === 'LTC' || coinId === 'DOGE' ? null : (parseFloat(gasFeeEth) * 2800).toFixed(4),
      gasPriceGwei: coinId === 'BTC' || coinId === 'LTC' || coinId === 'DOGE' ? null : gasPriceGwei,
      gasUsed: coinId === 'BTC' || coinId === 'LTC' || coinId === 'DOGE' ? null : gasUsed,
      confirmationTimeSec: confirmTime,
      blockNumber: Math.floor(Math.random() * 1000000 + 18000000),
      nonce: Math.floor(Math.random() * 500),
    };
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ConfirmBadge({ confirmations, status }) {
  if (status === 'failed') return <span className="text-red-400 text-[10px] font-semibold">Gagal</span>;
  if (status === 'pending') return (
    <span className="flex items-center gap-1 text-yellow-400 text-[10px] font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Pending ({confirmations})
    </span>
  );
  return <span className="text-green-400 text-[10px] font-semibold">✓ {confirmations} konfirmasi</span>;
}

function TxRow({ tx, coinId }) {
  const [expanded, setExpanded] = useState(false);
  const color = COIN_COLORS[coinId] || '#94a3b8';
  const explorerBase = EXPLORER_URLS[coinId] || 'https://blockstream.info/tx/';
  const isSent = tx.type === 'sent';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? 'border-slate-600' : 'border-slate-700/40'}`}>
      {/* Main row */}
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800/30 transition-colors">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSent ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          {isSent
            ? <ArrowUpRight className="w-4 h-4 text-red-400" />
            : <ArrowDownLeft className="w-4 h-4 text-green-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-sm font-semibold">{isSent ? 'Kirim' : 'Terima'}</span>
            <ConfirmBadge confirmations={tx.confirmations} status={tx.status} />
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{formatDate(tx.date)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${isSent ? 'text-red-400' : 'text-green-400'}`}>
            {isSent ? '-' : '+'}{tx.amount.toFixed(8)}
          </p>
          <p className="text-slate-500 text-[10px]">{coinId}</p>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-700/50 p-3 space-y-2 bg-slate-900/40">
          {/* Hash */}
          <div className="flex items-start gap-2">
            <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-500 text-[10px] mb-0.5">TX Hash</p>
              <div className="flex items-center gap-2">
                <p className="text-blue-400 font-mono text-[10px] truncate">{tx.hash}</p>
                <a href={explorerBase + tx.hash} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-slate-500 hover:text-white transition-colors">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <p className="text-slate-500 mb-0.5">Dari</p>
              <p className="text-slate-300 font-mono truncate">{tx.from.slice(0, 18)}…</p>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Ke</p>
              <p className="text-slate-300 font-mono truncate">{tx.to.slice(0, 18)}…</p>
            </div>
          </div>

          {/* Gas details (EVM only) */}
          {tx.gasFeeEth && (
            <div className="bg-slate-800/60 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Fuel className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400 text-xs font-semibold">Gas Fee</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-slate-500">Gas Fee</span><span className="text-white">{tx.gasFeeEth} ETH</span></div>
                <div className="flex justify-between"><span className="text-slate-500">USD</span><span className="text-yellow-400">~${tx.gasFeeUSD}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Gas Price</span><span className="text-white">{tx.gasPriceGwei} Gwei</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Gas Used</span><span className="text-white">{tx.gasUsed?.toLocaleString()}</span></div>
              </div>
            </div>
          )}

          {/* Timing & block */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <div>
                <p className="text-slate-500">Waktu konfirmasi</p>
                <p className="text-white font-semibold">{tx.confirmationTimeSec}s</p>
              </div>
            </div>
            <div>
              <p className="text-slate-500">Block</p>
              <p className="text-white font-semibold">#{tx.blockNumber?.toLocaleString()}</p>
            </div>
            {tx.nonce !== null && tx.nonce !== undefined && (
              <div>
                <p className="text-slate-500">Nonce</p>
                <p className="text-white">{tx.nonce}</p>
              </div>
            )}
            <div>
              <p className="text-slate-500">Konfirmasi</p>
              <p className={`font-semibold ${tx.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>{tx.confirmations}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetailedTxHistory({ coinId = 'ETH', address = '' }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | sent | received

  const reload = () => {
    setLoading(true);
    setTimeout(() => {
      setTxs(generateSimTxs(coinId, 20));
      setLoading(false);
    }, 700);
  };

  useEffect(() => { reload(); }, [coinId, address]);

  const filtered = txs.filter(tx => filter === 'all' || tx.type === filter);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Riwayat Transaksi</span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{coinId}</span>
        </div>
        <button onClick={reload} disabled={loading}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5">
        {[['all', 'Semua'], ['received', 'Masuk'], ['sent', 'Keluar']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filter === v ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
          <span className="text-slate-500 text-sm">Memuat transaksi…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">Tidak ada transaksi</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => <TxRow key={tx.hash} tx={tx} coinId={coinId} />)}
        </div>
      )}

      <p className="text-slate-600 text-[10px] text-center">Riwayat simulasi · Gas fee & timing berdasarkan data jaringan</p>
    </div>
  );
}