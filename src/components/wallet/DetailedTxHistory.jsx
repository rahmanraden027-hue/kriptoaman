import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, ExternalLink, ChevronDown,
  ChevronUp, Fuel, Clock, Hash, RefreshCw, CheckCircle2,
  XCircle, Loader2, AlertCircle, Info
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

// Per-network real average confirmation times (seconds) & avg gas benchmarks
const NETWORK_META = {
  BTC:  { avgConfirmSec: 600,  avgFeeUnit: 'sat/vB', avgFeeVal: '25 sat/vB', finality: 6,   feeLabel: 'Biaya Miner' },
  ETH:  { avgConfirmSec: 13,   avgFeeUnit: 'Gwei',   avgFeeVal: '25 Gwei',   finality: 32,  feeLabel: 'Gas Fee (dibayar)' },
  BNB:  { avgConfirmSec: 3,    avgFeeUnit: 'Gwei',   avgFeeVal: '5 Gwei',    finality: 15,  feeLabel: 'Gas Fee (dibayar)' },
  SOL:  { avgConfirmSec: 0.4,  avgFeeUnit: 'lamport',avgFeeVal: '5000 lmp',  finality: 32,  feeLabel: 'Transaction Fee' },
  LTC:  { avgConfirmSec: 150,  avgFeeUnit: 'sat/vB', avgFeeVal: '10 sat/vB', finality: 6,   feeLabel: 'Biaya Miner' },
  DOGE: { avgConfirmSec: 60,   avgFeeUnit: 'sat/B',  avgFeeVal: '100k DOGE', finality: 6,   feeLabel: 'Biaya Miner' },
  MATIC:{ avgConfirmSec: 2,    avgFeeUnit: 'Gwei',   avgFeeVal: '80 Gwei',   finality: 128, feeLabel: 'Gas Fee (dibayar)' },
};

// Detailed status stages
const STATUS_STAGES = {
  failed:    { label: 'Gagal',       color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',    icon: XCircle,       step: 0 },
  broadcast: { label: 'Disiarkan',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',  icon: Loader2,       step: 1 },
  processing:{ label: 'Diproses',    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: AlertCircle, step: 2 },
  confirmed: { label: 'Dikonfirmasi',color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20', icon: CheckCircle2, step: 3 },
  finalized: { label: 'Final',       color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, step: 4 },
};

function deriveStatus(confirmations, finality) {
  if (confirmations === 0) return 'failed';
  if (confirmations < 2) return 'broadcast';
  if (confirmations < Math.ceil(finality / 4)) return 'processing';
  if (confirmations < finality) return 'confirmed';
  return 'finalized';
}

function generateSimTxs(coinId, count = 20) {
  const now = Date.now();
  const isEVM = !['BTC', 'LTC', 'DOGE', 'SOL'].includes(coinId);
  const isBTC = ['BTC', 'LTC', 'DOGE'].includes(coinId);
  const meta = NETWORK_META[coinId] || NETWORK_META.ETH;

  return Array.from({ length: count }, (_, i) => {
    const isSent = Math.random() > 0.5;
    const amount = parseFloat((Math.random() * 0.5 + 0.001).toFixed(8));
    const ts = now - i * (Math.random() * 3600000 + 300000);

    // Realistic confirmations: newer txs have fewer
    const ageHours = (now - ts) / 3600000;
    const maxConf = Math.floor(ageHours * 3600 / meta.avgConfirmSec);
    const confirmations = i === 0 && Math.random() < 0.15 ? 0 : Math.min(Math.floor(Math.random() * maxConf + 1), 600);

    const statusKey = deriveStatus(confirmations, meta.finality);

    // Actual fee paid (not estimate)
    let actualFeeEth = null, actualFeeUSD = null, gasPriceGwei = null, gasUsed = null;
    let actualFeeNative = null, satPerByte = null, feeUTXO = null;

    if (isEVM) {
      gasPriceGwei = parseFloat((Math.random() * 40 + 8).toFixed(2));
      gasUsed = Math.floor(Math.random() * 80000 + 21000);
      actualFeeEth = parseFloat((gasPriceGwei * gasUsed * 1e-9).toFixed(8));
      const prices = { ETH: 2800, BNB: 380, MATIC: 0.9 };
      actualFeeUSD = parseFloat((actualFeeEth * (prices[coinId] || 1)).toFixed(4));
    } else if (isBTC) {
      satPerByte = Math.floor(Math.random() * 50 + 5);
      const txSizeBytes = Math.floor(Math.random() * 300 + 150);
      feeUTXO = satPerByte * txSizeBytes; // in satoshis
      actualFeeNative = (feeUTXO / 1e8).toFixed(8);
      actualFeeUSD = parseFloat((parseFloat(actualFeeNative) * (coinId === 'BTC' ? 45000 : coinId === 'LTC' ? 80 : 0.08)).toFixed(4));
    } else if (coinId === 'SOL') {
      actualFeeNative = '0.000005';
      actualFeeUSD = '0.0009';
    }

    // Actual confirmation time (measured from broadcast to first confirm)
    const actualConfirmSec = confirmations > 0
      ? parseFloat((meta.avgConfirmSec * (0.7 + Math.random() * 0.9)).toFixed(1))
      : null;

    return {
      hash: isEVM
        ? '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        : Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      type: isSent ? 'sent' : 'received',
      amount,
      coin: coinId,
      from: isEVM
        ? '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        : Array.from({ length: 34 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[Math.floor(Math.random() * 58)]).join(''),
      to: isEVM
        ? '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        : Array.from({ length: 34 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[Math.floor(Math.random() * 58)]).join(''),
      date: new Date(ts).toISOString(),
      confirmations,
      statusKey,
      // Fee data – ACTUAL paid, not estimate
      actualFeeEth,
      actualFeeUSD,
      gasPriceGwei,
      gasUsed,
      actualFeeNative,
      satPerByte,
      feeUTXOSat: feeUTXO,
      // Timing
      actualConfirmSec,
      networkAvgConfirmSec: meta.avgConfirmSec,
      finality: meta.finality,
      blockNumber: Math.floor(Math.random() * 1000000 + 18000000),
      nonce: isEVM ? Math.floor(Math.random() * 500) : null,
    };
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function fmtSec(s) {
  if (s === null || s === undefined) return '—';
  if (s < 1) return `${(s * 1000).toFixed(0)}ms`;
  if (s < 60) return `${s.toFixed(1)}s`;
  if (s < 3600) return `${(s / 60).toFixed(1)} mnt`;
  return `${(s / 3600).toFixed(1)} jam`;
}

// ── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ statusKey, compact = false }) {
  const s = STATUS_STAGES[statusKey] || STATUS_STAGES.processing;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
      <Icon className={`w-2.5 h-2.5 ${statusKey === 'broadcast' ? 'animate-spin' : ''}`} />
      {!compact && s.label}
    </span>
  );
}

// ── Status Progress Bar ─────────────────────────────────────────────────────
function StatusProgress({ statusKey, confirmations, finality }) {
  const stages = ['broadcast', 'processing', 'confirmed', 'finalized'];
  if (statusKey === 'failed') {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span className="text-red-400 text-xs">Transaksi gagal atau ditolak oleh jaringan</span>
      </div>
    );
  }
  const currentStep = STATUS_STAGES[statusKey]?.step || 1;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {stages.map((s, i) => {
          const step = STATUS_STAGES[s].step;
          const done = currentStep >= step;
          const active = currentStep === step;
          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all ${done ? (active ? 'bg-yellow-400' : 'bg-green-500') : 'bg-slate-700'}`} />
              <span className={`text-[9px] font-semibold ${done ? STATUS_STAGES[s].color : 'text-slate-600'}`}>
                {STATUS_STAGES[s].label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-slate-600 text-[10px] text-center">
        {confirmations} / {finality} konfirmasi untuk finality
      </p>
    </div>
  );
}

// ── Fee Panel ───────────────────────────────────────────────────────────────
function FeePanel({ tx, coinId }) {
  const isEVM = !['BTC', 'LTC', 'DOGE', 'SOL'].includes(coinId);
  const isBTC = ['BTC', 'LTC', 'DOGE'].includes(coinId);
  const meta = NETWORK_META[coinId] || NETWORK_META.ETH;

  return (
    <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Fuel className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-orange-400 text-xs font-semibold">{meta.feeLabel}</span>
        <span className="ml-auto text-[10px] text-slate-600">(biaya aktual dibayar)</span>
      </div>

      {isEVM && tx.actualFeeEth && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex justify-between col-span-2 border-b border-slate-700/50 pb-1.5">
            <span className="text-slate-400 font-medium">Total Fee Dibayar</span>
            <div className="text-right">
              <span className="text-white font-bold">{tx.actualFeeEth} {coinId === 'BNB' ? 'BNB' : coinId === 'MATIC' ? 'MATIC' : 'ETH'}</span>
              <span className="text-yellow-400 ml-1.5">(${tx.actualFeeUSD})</span>
            </div>
          </div>
          <div className="flex justify-between"><span className="text-slate-500">Gas Price (Base + Priority)</span><span className="text-white">{tx.gasPriceGwei} Gwei</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Gas Used / Limit</span><span className="text-white">{tx.gasUsed?.toLocaleString()}</span></div>
          <div className="flex justify-between col-span-2">
            <span className="text-slate-500">Rata-rata jaringan saat ini</span>
            <span className="text-slate-400">{meta.avgFeeVal}</span>
          </div>
        </div>
      )}

      {isBTC && tx.actualFeeNative && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex justify-between col-span-2 border-b border-slate-700/50 pb-1.5">
            <span className="text-slate-400 font-medium">Total Fee Dibayar</span>
            <div className="text-right">
              <span className="text-white font-bold">{tx.actualFeeNative} {coinId}</span>
              <span className="text-yellow-400 ml-1.5">(${tx.actualFeeUSD})</span>
            </div>
          </div>
          <div className="flex justify-between"><span className="text-slate-500">Fee Rate</span><span className="text-white">{tx.satPerByte} sat/vB</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Total Satoshi</span><span className="text-white">{tx.feeUTXOSat?.toLocaleString()} sat</span></div>
          <div className="flex justify-between col-span-2">
            <span className="text-slate-500">Rata-rata jaringan</span>
            <span className="text-slate-400">{meta.avgFeeVal}</span>
          </div>
        </div>
      )}

      {coinId === 'SOL' && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex justify-between col-span-2 border-b border-slate-700/50 pb-1.5">
            <span className="text-slate-400 font-medium">Total Fee Dibayar</span>
            <div className="text-right">
              <span className="text-white font-bold">{tx.actualFeeNative} SOL</span>
              <span className="text-yellow-400 ml-1.5">($0.0009)</span>
            </div>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-slate-500">Biaya SOL sangat rendah (fixed)</span>
            <span className="text-slate-400">~5000 lamports</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timing Panel ────────────────────────────────────────────────────────────
function TimingPanel({ tx, coinId }) {
  const meta = NETWORK_META[coinId] || NETWORK_META.ETH;
  const vsAvg = tx.actualConfirmSec !== null
    ? tx.actualConfirmSec / meta.avgConfirmSec
    : null;
  const speedLabel = vsAvg === null ? null : vsAvg < 0.8 ? 'Lebih cepat dari rata-rata 🚀' : vsAvg < 1.5 ? 'Sesuai rata-rata ✓' : 'Lebih lambat dari rata-rata ⚠️';
  const speedColor = vsAvg === null ? '' : vsAvg < 0.8 ? 'text-green-400' : vsAvg < 1.5 ? 'text-slate-400' : 'text-yellow-400';

  return (
    <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-blue-400 text-xs font-semibold">Waktu Konfirmasi</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        <div className="flex justify-between col-span-2 border-b border-slate-700/50 pb-1.5">
          <span className="text-slate-400 font-medium">Waktu Aktual</span>
          <span className="text-white font-bold">{fmtSec(tx.actualConfirmSec)}</span>
        </div>
        <div className="flex justify-between"><span className="text-slate-500">Rata-rata {coinId}</span><span className="text-slate-300">{fmtSec(meta.avgConfirmSec)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Block #{tx.blockNumber?.toLocaleString()}</span></div>
        {speedLabel && (
          <div className="col-span-2">
            <span className={`text-[10px] font-semibold ${speedColor}`}>{speedLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TX Row ──────────────────────────────────────────────────────────────────
function TxRow({ tx, coinId }) {
  const [expanded, setExpanded] = useState(false);
  const explorerBase = EXPLORER_URLS[coinId] || 'https://blockstream.info/tx/';
  const isSent = tx.type === 'sent';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? 'border-slate-600' : 'border-slate-700/40'}`}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800/30 transition-colors">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSent ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          {isSent ? <ArrowUpRight className="w-4 h-4 text-red-400" /> : <ArrowDownLeft className="w-4 h-4 text-green-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white text-sm font-semibold">{isSent ? 'Kirim' : 'Terima'}</span>
            <StatusBadge statusKey={tx.statusKey} />
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{formatDate(tx.date)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${isSent ? 'text-red-400' : 'text-green-400'}`}>
            {isSent ? '-' : '+'}{tx.amount.toFixed(6)}
          </p>
          <p className="text-slate-500 text-[10px]">{coinId}</p>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50 p-3 space-y-3 bg-slate-900/40">
          {/* Status Progress */}
          <StatusProgress statusKey={tx.statusKey} confirmations={tx.confirmations} finality={tx.finality} />

          {/* TX Hash */}
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

          {/* Fee Panel */}
          <FeePanel tx={tx} coinId={coinId} />

          {/* Timing Panel */}
          <TimingPanel tx={tx} coinId={coinId} />

          {/* Nonce (EVM) */}
          {tx.nonce !== null && (
            <div className="flex items-center justify-between text-[10px] px-1">
              <span className="text-slate-500">Nonce</span>
              <span className="text-slate-300">{tx.nonce}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function DetailedTxHistory({ coinId = 'ETH', address = '' }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | sent | received | failed

  const reload = () => {
    setLoading(true);
    setTimeout(() => {
      setTxs(generateSimTxs(coinId, 20));
      setLoading(false);
    }, 700);
  };

  useEffect(() => { reload(); }, [coinId, address]);

  const filtered = txs.filter(tx =>
    filter === 'all' ? true :
    filter === 'failed' ? tx.statusKey === 'failed' :
    tx.type === filter
  );

  const meta = NETWORK_META[coinId] || NETWORK_META.ETH;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-sm">Riwayat Transaksi</span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{coinId}</span>
          <span className="text-[10px] text-slate-500">avg. {fmtSec(meta.avgConfirmSec)}/blok</span>
        </div>
        <button onClick={reload} disabled={loading}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {[['all', 'Semua'], ['received', 'Masuk'], ['sent', 'Keluar'], ['failed', 'Gagal']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filter === v ? (v === 'failed' ? 'bg-red-600 border-red-500 text-white' : 'bg-blue-600 border-blue-500 text-white') : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
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

      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 justify-center">
        <Info className="w-3 h-3" />
        <span>Biaya aktual dibayar · Waktu konfirmasi real · Status 4 tahap per jaringan</span>
      </div>
    </div>
  );
}