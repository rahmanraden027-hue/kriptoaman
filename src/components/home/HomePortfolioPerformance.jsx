import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';

const PERIODS = [
  { key: '1D', days: 1 },
  { key: '1W', days: 7 },
  { key: '1M', days: 30 },
  { key: '1Y', days: 365 },
];

export default function HomePortfolioPerformance({ user, prices }) {
  const [period, setPeriod] = useState('1W');
  const [ratios, setRatios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    base44.entities.UserBalance.filter({ userEmail: user.email })
      .then(b => setTotal(b.reduce((s, x) => s + (x.amount || 0) * (prices[x.coin]?.price || 0), 0)))
      .catch(() => {})
      .finally(() => {});
  }, [user?.email, prices]);

  useEffect(() => {
    let alive = true;
    const days = PERIODS.find(p => p.key === period)?.days || 7;
    setLoading(true);
    fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`)
      .then(r => r.json())
      .then(d => {
        if (!alive || !Array.isArray(d?.prices)) return;
        const last = d.prices[d.prices.length - 1][1] || 1;
        setRatios(d.prices.map(([ts, p]) => ({ t: ts, r: p / last })));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [period]);

  const series = ratios.map(o => ({ t: o.t, v: total * o.r }));
  const first = series[0]?.v || 0;
  const last = series[series.length - 1]?.v || 0;
  const chgPct = first > 0 ? ((last - first) / first) * 100 : 0;
  const up = chgPct >= 0;
  const color = up ? '#2ecc71' : '#e74c3c';

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '120ms' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <LineChartIcon className="w-4 h-4 text-ka-emerald" /> Performa Portfolio
        </h3>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition tap-reset ${period === p.key ? 'bg-ka-emerald text-black' : 'bg-ka-card text-ka-muted hover:text-white'}`}>
              {p.key}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-white font-extrabold ka-num text-lg">${last.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        {first > 0 && (
          <p className={`text-xs font-bold ka-num ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>{up ? '+' : ''}{chgPct.toFixed(2)}%</p>
        )}
      </div>
      <div className="h-28 -mx-2">
        {loading || series.length < 2 ? (
          <div className="h-28 ka-shimmer rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                content={({ payload }) => payload && payload[0] ? (
                  <div className="rounded-lg bg-[#0a0c0a] border border-ka-card-border px-2 py-1 text-[10px]">
                    <p className="text-white font-bold ka-num">${payload[0].value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                  </div>
                ) : null}
              />
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#perfGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="ka-muted text-[9px] mt-1">Estimasi berbasis tren harga BTC untuk periode terpilih.</p>
    </div>
  );
}