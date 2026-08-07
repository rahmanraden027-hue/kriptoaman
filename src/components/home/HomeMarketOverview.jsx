import React, { useEffect, useState } from 'react';
import { TrendingUp, Activity, Layers, RefreshCw } from 'lucide-react';

function Gauge({ value, label }) {
  const v = Math.max(0, Math.min(100, value));
  const angle = 180 - (v / 100) * 180;
  const R = 52, C = Math.PI * R;
  const dash = (v / 100) * C;
  // Dynamic color across the fear→greed spectrum
  const color = v >= 75 ? '#2ecc71' : v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : v >= 25 ? '#f97316' : '#e74c3c';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-32">
        <path d="M 8 62 A 52 52 0 0 1 112 62" fill="none" stroke="#1f2a25" strokeWidth="8" strokeLinecap="round" />
        <path d="M 8 62 A 52 52 0 0 1 112 62" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`} />
        <line x1="60" y1="62" x2="60" y2="18" stroke="#a0b3a9" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${-angle} 60 62)`} />
        <circle cx="60" cy="62" r="3.5" fill="#a0b3a9" />
      </svg>
      <div className="-mt-6 text-center">
        <p className="text-2xl font-extrabold ka-num leading-none" style={{ color }}>{Math.round(v)}</p>
        <p className="text-[10px] font-semibold mt-0.5" style={{ color }}>{label || '—'}</p>
      </div>
    </div>
  );
}

export default function HomeMarketOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('https://api.coingecko.com/api/v3/global').then(r => r.json()).catch(() => null),
      fetch('https://api.alternative.me/fng/?limit=1').then(r => r.json()).catch(() => null),
    ]).then(([g, fng]) => {
      setData({
        mc: g?.data?.total_market_cap?.usd ?? null,
        mcChange: g?.data?.market_cap_change_percentage_24h_usd ?? null,
        vol: g?.data?.total_volume?.usd ?? null,
        btc: g?.data?.market_cap_percentage?.btc ?? null,
        eth: g?.data?.market_cap_percentage?.eth ?? null,
        active: g?.data?.active_cryptocurrencies ?? null,
        markets: g?.data?.markets ?? null,
        fear: fng?.data?.[0]?.value ?? null,
        fearLabel: fng?.data?.[0]?.value_classification ?? null,
        fearUpdated: fng?.data?.[0]?.timestamp ?? null,
      });
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const fmtBig = (v) => {
    if (v == null) return '--';
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };
  const fmtNum = (v) => (v == null ? '--' : v.toLocaleString('en-US'));

  const updatedText = data?.fearUpdated
    ? new Date(data.fearUpdated * 1000).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    : '--';

  const Stat = ({ label, value, sub, up }) => (
    <div className="rounded-2xl bg-[#0b1410]/60 border border-ka-card-border p-3">
      <p className="ka-muted text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-white font-bold ka-num text-sm mt-0.5">{value}</p>
      {sub && (
        <p className={`text-[10px] mt-0.5 font-semibold ${up === undefined ? 'ka-muted' : up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>{sub}</p>
      )}
    </div>
  );

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '240ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-ka-emerald" /> Market Overview
        </h3>
        <button onClick={load} className="ka-muted hover:text-ka-emerald transition tap-reset" aria-label="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="space-y-2.5 mb-3">
          <div className="grid grid-cols-2 gap-2.5">{[0, 1].map(i => <div key={i} className="h-16 ka-shimmer rounded-2xl" />)}</div>
          <div className="grid grid-cols-3 gap-2.5">{[0, 1, 2].map(i => <div key={i} className="h-16 ka-shimmer rounded-2xl" />)}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Stat
              label="Kapitalisasi Pasar"
              value={fmtBig(data?.mc)}
              sub={data?.mcChange != null ? `${data.mcChange >= 0 ? '+' : ''}${data.mcChange.toFixed(2)}% (24j)` : '--'}
              up={data?.mcChange != null ? data.mcChange >= 0 : undefined}
            />
            <Stat label="Volume 24 Jam" value={fmtBig(data?.vol)} sub="likuiditas global" />
          </div>
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Dominasi BTC" value={data?.btc != null ? `${data.btc.toFixed(1)}%` : '--'} />
            <Stat label="Dominasi ETH" value={data?.eth != null ? `${data.eth.toFixed(1)}%` : '--'} />
            <Stat label="Kripto Aktif" value={fmtNum(data?.active)} sub={data?.markets != null ? `${fmtNum(data.markets)} pasar` : '--'} />
          </div>
        </>
      )}

      <div className="rounded-2xl bg-[#0b1410]/60 border border-ka-card-border p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="ka-muted text-[10px] font-semibold uppercase tracking-wide">Fear &amp; Greed Index</p>
          <span className="text-[10px] ka-muted flex items-center gap-1">
            <Activity className="w-3 h-3" /> {data?.fearLabel || '--'}
          </span>
        </div>
        {loading && !data ? (
          <div className="h-16 ka-shimmer rounded-xl" />
        ) : data?.fear == null ? (
          <div className="h-16 flex items-center justify-center ka-muted text-xs">Indeks tidak tersedia</div>
        ) : (
          <Gauge value={data.fear} label={data.fearLabel} />
        )}
        <p className="text-center text-[10px] ka-muted mt-1 flex items-center justify-center gap-1">
          <Layers className="w-3 h-3" /> Diperbarui: {updatedText}
        </p>
      </div>
    </div>
  );
}