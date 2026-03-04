import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Flame, Star, RefreshCw, Globe, BarChart2, DollarSign, Activity } from 'lucide-react';

const fmt = (n, dec = 2) => {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(dec)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(dec)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(dec)}M`;
  return `$${n.toLocaleString()}`;
};

const pct = (n) => {
  if (n == null) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
};

function CoinRow({ coin }) {
  const change = coin.price_change_percentage_24h;
  const isUp = change >= 0;
  const priceStr = coin.current_price < 0.01
    ? `$${coin.current_price.toFixed(6)}`
    : `$${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="py-3 border-b border-slate-700/30 last:border-0">
      <div className="flex items-center gap-2">
        <img
          src={coin.image}
          alt={coin.symbol}
          className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-bold uppercase">{coin.symbol}</span>
            <span className="text-slate-400 text-[10px] truncate">{coin.name}</span>
            {coin.market_cap_rank && (
              <span className="text-[9px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded-full">#{coin.market_cap_rank}</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-white text-xs font-bold">{priceStr}</div>
          <div className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {pct(change)}
          </div>
        </div>
      </div>
      {/* Detail Row */}
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <div className="bg-slate-900/50 rounded-lg px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide">Market Cap</p>
          <p className="text-[11px] text-slate-200 font-semibold">{fmt(coin.market_cap)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide">Vol 24h</p>
          <p className="text-[11px] text-slate-200 font-semibold">{fmt(coin.total_volume)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase tracking-wide">High/Low 24h</p>
          <p className="text-[11px] text-slate-200 font-semibold">
            <span className="text-green-400">{coin.high_24h < 1 ? coin.high_24h?.toFixed(4) : coin.high_24h?.toLocaleString(undefined,{maximumFractionDigits:2})}</span>
            <span className="text-slate-500 mx-0.5">/</span>
            <span className="text-red-400">{coin.low_24h < 1 ? coin.low_24h?.toFixed(4) : coin.low_24h?.toLocaleString(undefined,{maximumFractionDigits:2})}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor, children, loading }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-700/30 bg-slate-900/40`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-white text-sm font-bold">{title}</span>
      </div>
      <div className="px-4">
        {loading ? (
          <div className="py-6 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
          </div>
        ) : children}
      </div>
    </div>
  );
}

export default function MarketOverviewWidget() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [newListings, setNewListings] = useState([]);
  const [highVol, setHighVol] = useState([]);
  const [lowVol, setLowVol] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [page1, page2] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h&sparkline=false').then(r => r.json()),
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=2&price_change_percentage=24h&sparkline=false').then(r => r.json()),
      ]);

      const allCoins = [...(Array.isArray(page1) ? page1 : []), ...(Array.isArray(page2) ? page2 : [])];
      const valid = allCoins.filter(c => c.price_change_percentage_24h != null && c.current_price > 0);

      // Sort by % change
      const sorted = [...valid].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      setGainers(sorted.slice(0, 5));
      setLosers(sorted.slice(-5).reverse());

      // Sort by volume desc
      const byVol = [...valid].sort((a, b) => b.total_volume - a.total_volume);
      setHighVol(byVol.slice(0, 5));

      // Sort by volume asc (low volume = merugi)
      const lowVolCoins = byVol.filter(c => c.total_volume > 0).slice(-20).sort((a, b) => a.total_volume - b.total_volume);
      setLowVol(lowVolCoins.slice(0, 5));

      // New listings: sorted by ID (CoinGecko order = newest last on high pages) - use page2
      const newCoins = Array.isArray(page2) ? [...page2].sort((a, b) => b.atl_date?.localeCompare(a.atl_date || '') || 0).slice(0, 5) : [];
      setNewListings(newCoins.length > 0 ? newCoins : allCoins.slice(-5).reverse());

      setLastUpdated(new Date());
    } catch (e) {
      setError('Gagal memuat data pasar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base">📊 Market Overview</h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-slate-500 text-[10px]">
              {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Terbesar Market Cap - Untung */}
      <SectionCard title="📈 Market Cap Terbesar — Untung" icon={TrendingUp} iconColor="bg-green-500/20 text-green-400" loading={loading}>
        {gainers.map(c => <CoinRow key={c.id} coin={c} showMarketCap={true} showVolume={false} />)}
      </SectionCard>

      {/* Listing Baru */}
      <SectionCard title="⭐ Listing Baru" icon={Star} iconColor="bg-yellow-500/20 text-yellow-400" loading={loading}>
        {newListings.map(c => <CoinRow key={c.id} coin={c} showMarketCap={true} showVolume={true} />)}
      </SectionCard>

      {/* Vol 24 Jam Terbesar */}
      <SectionCard title="🔥 Volume 24 Jam Tertinggi" icon={Flame} iconColor="bg-orange-500/20 text-orange-400" loading={loading}>
        {highVol.map(c => <CoinRow key={c.id} coin={c} showMarketCap={false} showVolume={true} />)}
      </SectionCard>

      {/* Vol 24 Jam Merugi / Terendah */}
      <SectionCard title="📉 Volume 24 Jam Terendah — Merugi" icon={TrendingDown} iconColor="bg-red-500/20 text-red-400" loading={loading}>
        {losers.map(c => <CoinRow key={c.id} coin={c} showMarketCap={true} showVolume={true} />)}
      </SectionCard>
    </div>
  );
}