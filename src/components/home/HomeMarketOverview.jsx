import React, { useEffect, useState } from 'react';
import { TrendingUp, Activity, Layers } from 'lucide-react';

function Gauge({ value }) {
  const v = Math.max(0, Math.min(100, value));
  const angle = 180 - (v / 100) * 180;
  const R = 52, C = Math.PI * R;
  const dash = (v / 100) * C;
  const label = v >= 75 ? 'Greed' : v >= 55 ? 'Optimism' : v >= 45 ? 'Netral' : v >= 25 ? 'Takut' : 'Fear Ekstrem';
  const color = v >= 75 ? '#2ecc71' : v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : '#e74c3c';

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
        <p className="text-[10px] font-semibold ka-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function HomeMarketOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('https://api.coingecko.com/api/v3/global').then(r => r.json()).catch(() => null),
      fetch('https://api.alternative.me/fng/?limit=1').then(r => r.json()).catch(() => null),
    ]).then(([g, fng]) => {
      if (!alive) return;
      setData({
        mc: g?.data?.total_market_cap?.usd ?? null,
        mcChange: g?.data?.market_cap_change_percentage_24h_usd ?? null,
        vol: g?.data?.total_volume?.usd ?? null,
        btc: g?.data?.market_cap_percentage?.btc ?? null,
        eth: g?.data?.market_cap_percentage?.eth ?? null,
        active: g?.data?.active_cryptocurrencies ?? null,
        fear: fng?.data?.[0]?.value ?? null,
        fearLabel: fng?.data?.[0]?.value_classification ?? null,
      });
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const fmtBig = (v) => {
    if (v == null) return '--';
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };
  const fmtNum = (v) => (v == null ? '--' : v.toLocaleString('en-US'));

  const Stat = ({ label, value, sub, up }) => (
    <div className="rounded-2xl bg-[#0b1410]/60 border border-ka-card-border p-3">
      <p className="ka-muted text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-white font-bold ka-num text-base mt-0.5">{value}</p>
      {sub && (
        <p className={`text-[10px] mt-0.5 font-semibold ${up === undefined ? 'ka-muted' : up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>{sub}</p>
      )}
    </div>
  );

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '240ms' }}>
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-ka-emerald" /> Market Overview
      </h3>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-16 ka-shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <Stat
            label="Market Cap"
            value={fmtBig(data?.mc)}
            sub={data?.mcChange != null ? `${data.mcChange >= 0 ? '+' : ''}${data.mcChange.toFixed(2)}%` : '--'}
            up={data?.mcChange != null ? data.mcChange >= 0 : undefined}
          />
          <Stat label="Volume 24j" value={fmtBig(data?.vol)} sub="likuiditas global" />
          <Stat label="BTC Dom" value={data?.btc != null ? `${data.btc.toFixed(1)}%` : '--'} sub="dominasi" />
          <Stat label="ETH Dom" value={data?.eth != null ? `${data.eth.toFixed(1)}%` : '--'} sub="dominasi" />
        </div>
      )}

      <div className="rounded-2xl bg-[#0b1410]/60 border border-ka-card-border p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="ka-muted text-[10px] font-semibold uppercase tracking-wide">Fear &amp; Greed Index</p>
          <span className="text-[10px] ka-muted flex items-center gap-1">
            <Activity className="w-3 h-3" /> {data?.fearLabel || '--'}
          </span>
        </div>
        {loading || data?.fear == null ? (
          <div className="h-16 ka-shimmer rounded-xl" />
        ) : (
          <Gauge value={data.fear} />
        )}
        <p className="text-center text-[10px] ka-muted mt-1 flex items-center justify-center gap-1">
          <Layers className="w-3 h-3" /> {data?.active != null ? `${fmtNum(data.active)} aset aktif` : '--'}
        </p>
      </div>
    </div>
  );
}