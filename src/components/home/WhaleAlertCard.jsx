import React, { useEffect, useState } from 'react';
import { Waves, RefreshCw } from 'lucide-react';
import Skeleton from './Skeleton';

const CACHE_KEY = 'ka_market_activity_v2';

function fmtBig(v) {
  if (v == null) return '--';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${(v / 1e3).toFixed(1)}K`;
}

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
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage restrictions must not interrupt rendering.
  }
};

export default function WhaleAlertCard() {
  const cached = readCache();
  const [whales, setWhales] = useState(cached?.data || []);
  const [loading, setLoading] = useState(!cached);
  const [capturedAt, setCapturedAt] = useState(cached?.capturedAt || null);
  const [usingCache, setUsingCache] = useState(Boolean(cached));

  const load = async () => {
    if (!whales.length) setLoading(true);
    try {
      const response = await fetch('/api/market-snapshot-page?page=0&limit=100', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Market snapshot HTTP ${response.status}`);
      const payload = await response.json();
      const data = Array.isArray(payload?.data) ? payload.data : [];
      const list = data
        .filter(c => {
          const market_cap_rank = Number(c.market_cap_rank);
          const market_cap = Number(c.market_cap);
          const total_volume = Number(c.total_volume);
          return market_cap_rank > 0
            && market_cap_rank <= 100
            && market_cap > 100_000_000
            && total_volume > 5_000_000;
        })
        .map(c => ({ ...c, turnover: Number(c.total_volume) / Number(c.market_cap) }))
        .filter(c => Number.isFinite(c.turnover))
        .sort((a, b) => b.turnover - a.turnover)
        .slice(0, 6);
      if (!list.length) throw new Error('Market activity snapshot empty');
      const nextCapturedAt = Number(payload?.capturedAt) || Date.now();
      setWhales(list);
      setCapturedAt(nextCapturedAt);
      setUsingCache(false);
      saveCache({ capturedAt: nextCapturedAt, data: list });
    } catch {
      setUsingCache(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, []);

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <Waves className="w-4 h-4 text-ka-emerald" /> Aktivitas Aset Pasar Utama
        </h3>
        <button onClick={load} className="ka-muted hover:text-ka-emerald transition tap-reset" aria-label="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {usingCache && capturedAt && (
        <p className="text-[9px] text-amber-300 mb-2" role="status">
          Snapshot tersimpan · {new Date(capturedAt).toLocaleString('id-ID')}
        </p>
      )}
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : whales.length === 0 ? (
        <div className="py-6 text-center ka-muted text-xs">Snapshot aktivitas belum tersedia</div>
      ) : (
        <div className="space-y-1">
          {whales.map(c => {
            const sym = (c.symbol || '').toUpperCase();
            const up = (c.price_change_percentage_24h || 0) >= 0;
            return (
              <div key={c.id || sym} className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-ka-card/50 transition">
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
          <p className="ka-muted text-[11px] pt-2 leading-relaxed">Sumber: Database Pasar KriptoAman. Daftar dibatasi pada aset berkapitalisasi besar dalam 100 peringkat market cap teratas dengan ambang volume minimum US$5 juta per 24 jam. Rasio volume/kapitalisasi adalah indikator aktivitas pasar, bukan verifikasi legitimasi aset dan bukan rekomendasi investasi.</p>
        </div>
      )}
    </div>
  );
}
