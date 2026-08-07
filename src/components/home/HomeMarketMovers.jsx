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
        const [m, t] = await Promise.all([
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h').then(r => r.json()),
          fetch('https://api.coingecko.com/api/v3/search/trending').then(r => r.json()).catch(() => ({ coins: [] })),
        ]);
        if (!alive) return;
        setCoins(Array.isArray(m) ? m : []);
        setTrending(Array.isArray(t?.coins) ? t.coins.map(c => c.item) : []);
      } catch { /* rate-limit */ } finally { if (alive) setLoading(false); }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const gainers = [...coins].filter(c => c.price_change_percentage_24h != null).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 10);
  const losers = [...coins].filter(c => c.price_change_percentage_24h != null).sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 10);
  const trendingCoins = trending.map(t => coins.find(c => c.id === t.id) || {
    id: t.id, symbol: (t.symbol || '').toUpperCase(), name: t.name, image: t.small || t.thumb,
    current_price: t.data?.price, price_change_percentage_24h: t.data?.price_change_percentage_24h,
  });

  let list = [];
  if (tab === 'gainers') list = gainers;
  else if (tab === 'losers') list = losers;
  else if (tab === 'trending') list = trendingCoins;
  else list = watchlist.map(sym => coins.find(c => c.symbol?.toUpperCase() === sym)).filter(Boolean);

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '180ms' }}>
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
        <Flame className="w-4 h-4 text-ka-emerald" /> Market Movers
      </h3>
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition tap-reset ${tab === key ? 'bg-ka-emerald text-black' : 'bg-ka-card text-ka-muted hover:text-white'}`}>
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
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
              <div key={c.id || sym} className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-ka-card/50 transition">
                <div className="flex items-center gap-2 min-w-0">
                  {c.image ? <img src={c.image} alt={sym} loading="lazy" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-ka-card" />}
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold truncate">{sym}</p>
                    <p className="ka-muted text-[10px] truncate max-w-[100px]">{c.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-white text-xs font-bold ka-num">{fmtPrice(c.current_price)}</p>
                    <p className={`text-[10px] font-bold ka-num ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>{up ? '+' : ''}{chg.toFixed(2)}%</p>
                  </div>
                  <button onClick={() => toggleWatch(sym)} className="tap-reset p-1" aria-label="Toggle watchlist">
                    <Star className={`w-3.5 h-3.5 ${watched ? 'text-ka-emerald fill-ka-emerald' : 'text-ka-muted'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}