import React, { useEffect, useState } from 'react';
import { Waves, RefreshCw } from 'lucide-react';
import Skeleton from './Skeleton';

function fmtBig(v) {
  if (v == null) return '--';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${(v / 1e3).toFixed(1)}K`;
}

export default function WhaleAlertCard() {
  const [whales, setWhales] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h');
      const data = await r.json();
      if (!Array.isArray(data)) return;
      const list = data
        .filter(c => c.market_cap > 0)
        .map(c => ({ ...c, turnover: c.total_volume / c.market_cap }))
        .sort((a, b) => b.turnover - a.turnover)
        .slice(0, 6);
      setWhales(list);
    } catch { /* rate-limit */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, []);

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <Waves className="w-4 h-4 text-ka-emerald" /> Aktivitas Volume Pasar
        </h3>
        <button onClick={load} className="ka-muted hover:text-ka-emerald transition tap-reset" aria-label="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="space-y-1">
          {whales.map(c => {
            const sym = (c.symbol || '').toUpperCase();
            const up = (c.price_change_percentage_24h || 0) >= 0;
            return (
              <div key={c.id} className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-ka-card/50 transition">
                <div className="flex items-center gap-2 min-w-0">
                  {c.image ? <img src={c.image} alt={sym} loading="lazy" className="w-6 h-6 rounded-full" /> : null}
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold truncate">{sym}</p>
                    <p className="ka-muted text-[10px]">Vol {fmtBig(c.total_volume)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-bold ka-num ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>{up ? '+' : ''}{(c.price_change_percentage_24h || 0).toFixed(1)}%</p>
                  <p className="ka-muted text-[10px] ka-num">Turnover {(c.turnover * 100).toFixed(0)}%</p>
                </div>
              </div>
            );
          })}
          <p className="ka-muted text-[9px] pt-1 leading-relaxed">Sumber: CoinGecko. Rasio volume/kapitalisasi adalah indikator aktivitas pasar, bukan bukti transaksi whale atau rekomendasi investasi.</p>
        </div>
      )}
    </div>
  );
}
