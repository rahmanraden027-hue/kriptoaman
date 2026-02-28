import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus, X, RefreshCw, CheckCircle2, AlertCircle, Clock,
  Eye, EyeOff, ChevronDown, ChevronUp, Trash2, Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CEX_LIST = [
  { id: 'binance',  name: 'Binance',  logo: '🟡', color: '#F0B90B', needsPassphrase: false },
  { id: 'coinbase', name: 'Coinbase', logo: '🔵', color: '#0052FF', needsPassphrase: false },
  { id: 'kraken',   name: 'Kraken',   logo: '🟣', color: '#5741D9', needsPassphrase: false },
  { id: 'okx',      name: 'OKX',      logo: '⚫', color: '#555',    needsPassphrase: true  },
  { id: 'bybit',    name: 'Bybit',    logo: '🟠', color: '#F7A600', needsPassphrase: false },
  { id: 'kucoin',   name: 'KuCoin',   logo: '🟢', color: '#23AF91', needsPassphrase: true  },
];

const PRICE_MAP = {
  BTC: 95200, ETH: 3420, BNB: 582, SOL: 172, USDT: 1, USDC: 1, BUSD: 1, TUSD: 1, DAI: 1,
  DOGE: 0.124, MATIC: 0.46, XRP: 0.57, ADA: 0.48, LTC: 86, AVAX: 38.5, ARB: 1.12,
  DOT: 7.2, LINK: 14.5, UNI: 8.2, ATOM: 8.1, NEAR: 5.3, APT: 11.2, OP: 1.8,
};

function formatUSD(val) {
  if (!val && val !== 0) return '—';
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
  if (val >= 1000)    return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + val.toFixed(2);
}

function calcBalanceUSD(balances) {
  if (!balances) return 0;
  let parsed = balances;
  if (typeof balances === 'string') { try { parsed = JSON.parse(balances); } catch { return 0; } }
  return Object.entries(parsed).reduce((s, [sym, amt]) => s + (parseFloat(amt) || 0) * (PRICE_MAP[sym] || 0), 0);
}

// ── Add Connection Form ───────────────────────────────────────────────────────
function AddConnectionForm({ onSave, onClose }) {
  const [exchange, setExchange] = useState('binance');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [label, setLabel] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const cex = CEX_LIST.find(c => c.id === exchange);

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) return;
    setSaving(true);
    await base44.entities.CexConnection.create({
      exchange,
      label: label || cex.name,
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      api_passphrase: passphrase.trim() || null,
      status: 'pending',
    });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-base">Tambah Koneksi CEX</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Exchange picker */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Exchange</label>
          <div className="grid grid-cols-3 gap-2">
            {CEX_LIST.map(c => (
              <button key={c.id} onClick={() => setExchange(c.id)}
                className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${exchange === c.id ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-700 bg-slate-800/60 text-slate-400'}`}>
                <span>{c.logo}</span> {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Label (opsional)</label>
          <input value={label} onChange={e => setLabel(e.target.value)}
            placeholder={`${cex?.name} Utama`}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
        </div>

        {/* API Key */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">API Key</label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="Paste API Key..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 font-mono" />
        </div>

        {/* API Secret */}
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">API Secret</label>
          <div className="relative">
            <input value={apiSecret} onChange={e => setApiSecret(e.target.value)}
              type={showSecret ? 'text' : 'password'}
              placeholder="Paste API Secret..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-white text-sm outline-none focus:border-blue-500 font-mono" />
            <button onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Passphrase (OKX, KuCoin) */}
        {cex?.needsPassphrase && (
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Passphrase <span className="text-yellow-400">(wajib untuk {cex.name})</span></label>
            <input value={passphrase} onChange={e => setPassphrase(e.target.value)}
              type="password" placeholder="API Passphrase..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
          </div>
        )}

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-xs text-slate-400 flex gap-2">
          <span className="text-yellow-400 mt-0.5">⚠</span>
          <span>Gunakan API Key dengan permission <strong className="text-slate-300">Read-Only</strong>. Jangan aktifkan izin withdraw atau trade.</span>
        </div>

        <Button onClick={handleSave} disabled={saving || !apiKey || !apiSecret}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : '✓ Simpan Koneksi'}
        </Button>
      </div>
    </div>
  );
}

// ── Balance breakdown ─────────────────────────────────────────────────────────
function BalanceList({ balancesJson }) {
  if (!balancesJson) return null;
  let parsed = {};
  try { parsed = typeof balancesJson === 'string' ? JSON.parse(balancesJson) : balancesJson; } catch { return null; }
  const items = Object.entries(parsed).filter(([, a]) => parseFloat(a) > 0)
    .map(([sym, amt]) => ({ sym, amt: parseFloat(amt), usd: parseFloat(amt) * (PRICE_MAP[sym] || 0) }))
    .sort((a, b) => b.usd - a.usd);

  return (
    <div className="mt-2 space-y-1">
      {items.map(({ sym, amt, usd }) => (
        <div key={sym} className="flex items-center justify-between text-xs px-2 py-1 bg-slate-900/50 rounded-lg">
          <span className="text-slate-300 font-medium">{amt.toLocaleString(undefined, { maximumFractionDigits: 8 })} {sym}</span>
          <span className="text-slate-500">{usd > 0 ? formatUSD(usd) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

// ── Connection Card ───────────────────────────────────────────────────────────
function ConnectionCard({ conn, onSync, onDelete, syncing }) {
  const [expanded, setExpanded] = useState(false);
  const cex = CEX_LIST.find(c => c.id === conn.exchange);
  const total = calcBalanceUSD(conn.last_balances);

  const statusIcon = {
    active:  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    error:   <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
    pending: <Clock className="w-3.5 h-3.5 text-yellow-400" />,
  }[conn.status] || null;

  const lastSync = conn.last_synced
    ? new Date(conn.last_synced).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Belum pernah';

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-3">
        <span className="text-xl leading-none">{cex?.logo}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-sm">{conn.label || cex?.name}</span>
            {statusIcon}
          </div>
          <div className="text-slate-500 text-xs">Sync: {lastSync}</div>
          {conn.status === 'error' && conn.error_message && (
            <div className="text-red-400 text-xs mt-0.5 truncate">{conn.error_message}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-white font-bold text-sm">{formatUSD(total)}</div>
        </div>
        <div className="flex items-center gap-1 ml-1">
          <button onClick={() => onSync(conn.id)} disabled={syncing}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors" title="Sync">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(conn.id)}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && <div className="border-t border-slate-700/30 px-3 pb-3"><BalanceList balancesJson={conn.last_balances} /></div>}
    </div>
  );
}

// ── Main CEXPanel ─────────────────────────────────────────────────────────────
export default function CEXPanel({ onTotalChange }) {
  const [connections, setConnections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await base44.entities.CexConnection.list('-created_date');
    setConnections(data);
    setLoading(false);
    // Notify parent of total
    const total = data.reduce((s, c) => s + calcBalanceUSD(c.last_balances), 0);
    onTotalChange?.(total, data);
  };

  useEffect(() => { load(); }, []);

  const handleSync = async (id) => {
    setSyncingId(id);
    await base44.functions.invoke('syncCexBalances', { connection_id: id });
    await load();
    setSyncingId(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.CexConnection.delete(id);
    await load();
  };

  const handleSyncAll = async () => {
    for (const c of connections) {
      setSyncingId(c.id);
      await base44.functions.invoke('syncCexBalances', { connection_id: c.id });
    }
    setSyncingId(null);
    await load();
  };

  const grandTotal = connections.reduce((s, c) => s + calcBalanceUSD(c.last_balances), 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-xs">Total CEX</div>
          <div className="text-white font-bold text-lg">{formatUSD(grandTotal)}</div>
        </div>
        <div className="flex gap-2">
          {connections.length > 0 && (
            <button onClick={handleSyncAll} disabled={!!syncingId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors">
              <Wifi className="w-3.5 h-3.5" /> Sync Semua
            </button>
          )}
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 bg-slate-700/30 rounded-xl animate-pulse" />)}
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">🏦</div>
          <div className="text-sm font-medium text-slate-400 mb-1">Belum ada koneksi CEX</div>
          <div className="text-xs">Hubungkan akun Binance, Coinbase, dll untuk sinkronisasi otomatis</div>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map(c => (
            <ConnectionCard key={c.id} conn={c} onSync={handleSync} onDelete={handleDelete} syncing={syncingId === c.id} />
          ))}
        </div>
      )}

      {showForm && <AddConnectionForm onSave={load} onClose={() => setShowForm(false)} />}
    </div>
  );
}