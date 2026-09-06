import React, { useEffect, useState } from 'react';
import { Flame, TrendingUp, TrendingDown, Star } from 'lucide-react';
import Skeleton from './Skeleton';

const TABS = [
  { key: 'gainers', label: 'Gainers', icon: TrendingUp },
  { key: 'losers', label: 'Losers', icon: TrendingDown },
  { key: 'trending', label: 'Trending', icon: Flame },
  { key: 'watchlist', label: 'Watchlist', icon: Star },
];

function fmtPrice(v) {
  if (v == null) return '--';
  if (v >= 1) return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(6)}`;
}

export default function HomeMarketMovers() {
  const [tab, setTab] = useState('gainers');
  const [coins, setCoins] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snapshotAt, setSnapshotAt] = useState(null);
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ka_watchlist') || '[]'); } catch { return []; }
  });

  const toggleWatch = (sym) => {
    setWatchlist(w => {
      const next = w.includes(sym) ? w.filter(x => x !== sym) : [...w, sym];
      localStorage.setItem('ka_watchlist', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/market-snapshot-page?page=0&limit=100', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Market snapshot HTTP ${response.status}`);
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        if (!alive || rows.length === 0) return;

        setCoins(rows);
        setTrending(
          [...rows]
            .filter(c => Number.isFinite(Number(c?.total_volume)))
            .sort((a, b) => Number(b.total_volume || 0) - Number(a.total_volume || 0))
            .slice(0, 20),
        );
        setSnapshotAt(Number(payload?.capturedAt) || null);
      } catch {
        // Preserve the last rendered snapshot if the KriptoAman read path is temporarily unavailable.
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const qualifiedCoins = coins.filter(c =>
    c.current_price != null &&
    c.price_change_percentage_24h != null &&
    c.market_cap_rank > 0 && c.market_cap_rank <= 100 &&
    (c.market_cap || 0) >= 100_000_000 &&
    (c.total_volume || 0) >= 1_000_000
  );

  const gainers = [...qualifiedCoins]
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 10);
  const losers = [...qualifiedCoins]
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, 10);
  const trendingCoins = trending
    .map(t => coins.find(c => c.id === t.id) || t)
    .filter(c => c.current_price != null);

  let list = [];
  if (tab === 'gainers') list = gainers;
  else if (tab === 'losers') list = losers;
  else if (tab === 'trending') list = trendingCoins;
  else list = watchlist.map(sym => coins.find(c => c.symbol?.toUpperCase() === sym)).filter(Boolean);

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '180ms' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-ka-emerald" /> Market Movers
        </h3>
        <span className="text-[9px] ka-muted whitespace-nowrap">Top 100 market cap</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-bold whitespace-nowrap transition tap-reset ${tab === key ? 'bg-ka-emerald text-black' : 'bg-ka-card text-ka-muted hover:text-white'}`}>
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      {loading && list.length === 0 ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : list.length === 0 ? (
        <div className="text-center py-6 ka-muted text-xs">
          {tab === 'watchlist' ? 'Belum ada watchlist. Tambahkan dengan menekan bintang pada koin.' : 'Data tidak tersedia'}
        </div>
      ) : (
        <div className="space-y-1">
          {list.slice(0, 8).map(c => {
            const sym = (c.symbol || '').toUpperCase();
            const chg = c.price_change_percentage_24h ?? 0;
            const up = chg >= 0;
            const watched = watchlist.includes(sym);
            return (
              <div key={c.id || sym} className="flex items-center justify-between gap-2 py-2 px-1 rounded-lg hover:bg-ka-card/50 transition">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {c.image ? <img src={c.image} alt={sym} loading="lazy" className="w-7 h-7 rounded-full shrink-0" /> : <div className="w-7 h-7 rounded-full bg-ka-card shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-bold truncate">{sym}</p>
                    <p className="ka-muted text-[10px] truncate max-w-[150px] sm:max-w-[220px]">{c.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right min-w-[78px]">
                    <p className="text-white text-xs font-bold ka-num">{fmtPrice(c.current_price)}</p>
                    <p className={`text-[10px] font-bold ka-num ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>{up ? '+' : ''}{chg.toFixed(2)}%</p>
                  </div>
                  <button onClick={() => toggleWatch(sym)} className="tap-reset p-1.5" aria-label={`Toggle ${sym} watchlist`}>
                    <Star className={`w-4 h-4 ${watched ? 'text-ka-emerald fill-ka-emerald' : 'text-ka-muted'}`} />
                  </button>
                </div>
              </div>
            );
          })}
          <p className="ka-muted text-[10px] leading-relaxed pt-2 border-t border-ka-card-border">
            Sumber: KriptoAman Market Database. Gainers/Losers disaring dari 100 aset teratas dengan kapitalisasi ≥ $100 juta dan volume 24 jam ≥ $1 juta. Trending menggunakan volume tertinggi pada snapshot yang sama. {snapshotAt ? `Snapshot: ${new Date(snapshotAt).toLocaleString('id-ID')}. ` : ''}Data informatif, bukan rekomendasi investasi.
          </p>
        </div>
      )}
    </div>
  );
}
