import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

function Gauge({ value }) {
  const v = Math.max(0, Math.min(100, value));
  const angle = 180 - (v / 100) * 180; // 180° left → 0° right
  // semicircle arc using stroke-dasharray
  const R = 52, C = Math.PI * R; // half circumference
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
        <p className="text-2xl font-extrabold ka-num leading-none" style={{ color }}>{value == null ? '--' : Math.round(value)}</p>
        <p className="text-[10px] font-semibold ka-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function HomeMarketOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('https://api.coingecko.com/api/v3/global').then(r => r.json()).catch(() => null),
      fetch('https://api.alternative.me/fng/?limit=1').then(r => r.json()).catch(() => null),
    ]).then(([g, fng]) => {
      if (!alive) return;
      const mc = g?.data?.total_market_cap?.usd ?? null;
      const btcDom = g?.data?.market_cap_percentage?.btc ?? null;
      const ethDom = g?.data?.market_cap_percentage?.eth ?? null;
      const fear = fng?.data?.[0]?.value ?? null;
      setData({ mc, btcDom, ethDom, fear });
    });
    return () => { alive = false; };
  }, []);

  const fmtMC = (v) => {
    if (v == null) return '--';
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="ka-surface p-4 ka-fade-up">
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-ka-emerald" /> Market Overview
      </h3>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-2xl bg-[#0b1410]/60 border border-ka-card-border p-3">
          <p className="ka-muted text-[10px] font-semibold uppercase tracking-wide">Market Cap</p>
          <p className="text-white font-bold ka-num text-base mt-0.5">{fmtMC(data?.mc)}</p>
        </div>
        <div className="rounded-2xl bg-[#0b1410]/60 border border-ka-card-border p-3">
          <p className="ka-muted text-[10px] font-semibold uppercase tracking-wide">BTC Dominance</p>
          <p className="text-white font-bold ka-num text-base mt-0.5">{data?.btcDom != null ? `${data.btcDom.toFixed(1)}%` : '--'}</p>
          <p className="ka-muted text-[10px] mt-0.5">ETH {data?.ethDom != null ? `${data.ethDom.toFixed(1)}%` : '--'}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0b1410]/60 border border-ka-card-border p-3">
        <p className="ka-muted text-[10px] font-semibold uppercase tracking-wide text-center mb-1">Fear &amp; Greed Index</p>
        {data === null ? <div className="h-16 ka-shimmer rounded-xl" /> : <Gauge value={data.fear} />}
      </div>
    </div>
  );
}