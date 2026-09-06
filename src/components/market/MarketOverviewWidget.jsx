import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Flame, RefreshCw, Globe, BarChart2, Activity } from 'lucide-react';

const CACHE_KEY = 'ka_market_overview_v2';
const SNAPSHOT_LIMIT = 500;

const fmt = (n, dec = 2) => {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  const value = Number(n);
  if (value >= 1e12) return `$${(value / 1e12).toFixed(dec)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(dec)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(dec)}M`;
  return `$${value.toLocaleString()}`;
};

const pct = (n) => {
  if (!Number.isFinite(Number(n))) return '—';
  const value = Number(n);
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const readCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return Array.isArray(cached?.data) && cached.data.length ? cached : null;
  } catch {
    return null;
  }
};

const saveCache = (payload) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      capturedAt: Number(payload?.capturedAt) || Date.now(),
      data: Array.isArray(payload?.data) ? payload.data : [],
    }));
  } catch {
    // Storage restrictions must not interrupt rendering.
  }
};

function CoinRow({ coin }) {
  const change = Number(coin.price_change_percentage_24h);
  const isUp = Number.isFinite(change) ? change >= 0 : true;
  const price = Number(coin.current_price);
  const priceStr = Number.isFinite(price)
    ? price < 0.01
      ? `$${price.toFixed(6)}`
      : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

  return (
    <div className="py-3 border-b border-slate-700/30 last:border-0">
      <div className="flex items-center gap-2">
        {coin.image ? (
          <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-bold uppercase">{coin.symbol}</span>
            <span className="text-slate-400 text-[10px] truncate">{coin.name}</span>
            {coin.market_cap_rank && <span className="text-[9px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded-full">#{coin.market_cap_rank}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-white text-xs font-bold">{priceStr}</div>
          <div className={`text-[10px] font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>{pct(change)}</div>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <div className="bg-slate-900/50 rounded-lg px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide">Market Cap</p>
          <p className="text-[11px] text-slate-200 font-semibold">{fmt(coin.market_cap)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide">Vol 24h</p>
          <p className="text-[11px] text-slate-200 font-semibold">{fmt(coin.total_volume)}</p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor, children, loading }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/30 bg-slate-900/40">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconColor}`}><Icon className="w-3.5 h-3.5" /></div>
        <span className="text-white text-sm font-bold">{title}</span>
      </div>
      <div className="px-4">
        {loading ? <div className="py-6 flex items-center justify-center"><RefreshCw className="w-4 h-4 text-slate-500 animate-spin" /></div> : children}
      </div>
    </div>
  );
}

function SnapshotStats({ rows }) {
  const stats = useMemo(() => {
    const valid = rows.filter(row => Number.isFinite(Number(row.market_cap)) && Number(row.market_cap) > 0);
    const marketCap = valid.reduce((sum, row) => sum + Number(row.market_cap || 0), 0);
    const volume = valid.reduce((sum, row) => sum + Number(row.total_volume || 0), 0);
    const btc = valid.find(row => String(row.symbol || '').toUpperCase() === 'BTC');
    const eth = valid.find(row => String(row.symbol || '').toUpperCase() === 'ETH');
    return {
      marketCap,
      volume,
      btcShare: marketCap > 0 ? (Number(btc?.market_cap || 0) / marketCap) * 100 : null,
      ethShare: marketCap > 0 ? (Number(eth?.market_cap || 0) / marketCap) * 100 : null,
    };
  }, [rows]);

  if (!rows.length) return null;
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/30 bg-slate-900/40">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400"><Globe className="w-3.5 h-3.5" /></div>
        <span className="text-white text-sm font-bold">Snapshot Pasar KriptoAman</span>
        <span className="ml-auto text-[9px] text-slate-500">Top {rows.length} aset</span>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><BarChart2 className="w-2.5 h-2.5" /> Market Cap Snapshot</p>
          <p className="text-sm text-white font-bold">{fmt(stats.marketCap)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Activity className="w-2.5 h-2.5" /> Volume Snapshot 24h</p>
          <p className="text-sm text-white font-bold">{fmt(stats.volume)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">BTC Share dalam Snapshot</p>
          <p className="text-sm text-orange-400 font-bold">{Number.isFinite(stats.btcShare) ? `${stats.btcShare.toFixed(1)}%` : '—'}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">ETH Share dalam Snapshot</p>
          <p className="text-sm text-blue-400 font-bold">{Number.isFinite(stats.ethShare) ? `${stats.ethShare.toFixed(1)}%` : '—'}</p>
        </div>
      </div>
    </div>
  );
}

export default function MarketOverviewWidget() {
  const cached = readCache();
  const [rows, setRows] = useState(cached?.data || []);
  const [capturedAt, setCapturedAt] = useState(cached?.capturedAt || null);
  const [loading, setLoading] = useState(!cached);
  const [usingCache, setUsingCache] = useState(Boolean(cached));
  const [error, setError] = useState(null);

  const load = async () => {
    if (!rows.length) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/market-snapshot-page?page=0&limit=${SNAPSHOT_LIMIT}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Market snapshot HTTP ${response.status}`);
      const payload = await response.json();
      const data = Array.isArray(payload?.data) ? payload.data : [];
      if (!data.length) throw new Error('Market snapshot empty');
      setRows(data);
      setCapturedAt(Number(payload?.capturedAt) || Date.now());
      setUsingCache(false);
      saveCache({ data, capturedAt: payload?.capturedAt });
    } catch {
      setUsingCache(true);
      if (!rows.length) setError('Snapshot pasar belum tersedia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const valid = rows.filter(c => Number.isFinite(Number(c.current_price)) && Number(c.current_price) > 0);
  const movers = valid.filter(c => Number.isFinite(Number(c.price_change_percentage_24h)));
  const gainers = [...movers].sort((a, b) => Number(b.price_change_percentage_24h) - Number(a.price_change_percentage_24h)).slice(0, 5);
  const losers = [...movers].sort((a, b) => Number(a.price_change_percentage_24h) - Number(b.price_change_percentage_24h)).slice(0, 5);
  const highVol = [...valid].filter(c => Number(c.total_volume) > 0).sort((a, b) => Number(b.total_volume) - Number(a.total_volume)).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> Market Overview</h2>
        <div className="flex items-center gap-2">
          {capturedAt && <span className="text-slate-500 text-[10px]">{new Date(capturedAt).toLocaleString('id-ID')}</span>}
          <button onClick={load} disabled={loading} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors" aria-label="Refresh market overview">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {usingCache && rows.length > 0 && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3" role="status">
          Menampilkan snapshot terakhir yang tersimpan. Data tidak ditampilkan sebagai live sampai pembaruan berhasil.
        </div>
      )}
      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

      <SnapshotStats rows={rows} />

      <SectionCard title="📈 Pergerakan Naik Teratas" icon={TrendingUp} iconColor="bg-green-500/20 text-green-400" loading={loading}>
        {gainers.map(c => <CoinRow key={c.id || c.symbol} coin={c} />)}
      </SectionCard>

      <SectionCard title="🔥 Volume 24 Jam Tertinggi" icon={Flame} iconColor="bg-orange-500/20 text-orange-400" loading={loading}>
        {highVol.map(c => <CoinRow key={c.id || c.symbol} coin={c} />)}
      </SectionCard>

      <SectionCard title="📉 Pergerakan Turun Teratas" icon={TrendingDown} iconColor="bg-red-500/20 text-red-400" loading={loading}>
        {losers.map(c => <CoinRow key={c.id || c.symbol} coin={c} />)}
      </SectionCard>
    </div>
  );
}
