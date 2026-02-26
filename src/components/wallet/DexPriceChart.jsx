import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const PERIODS = [
  { label: '1J', days: 1 },
  { label: '7J', days: 7 },
  { label: '30J', days: 30 },
];

async function fetchPriceHistory(fromId, toId, days) {
  const [fromRes, toRes] = await Promise.all([
    fetch(`https://api.coingecko.com/api/v3/coins/${fromId}/market_chart?vs_currency=usd&days=${days}`),
    fetch(`https://api.coingecko.com/api/v3/coins/${toId}/market_chart?vs_currency=usd&days=${days}`),
  ]);
  const fromData = await fromRes.json();
  const toData = await toRes.json();

  const fromPrices = fromData.prices || [];
  const toPrices = toData.prices || [];
  const len = Math.min(fromPrices.length, toPrices.length, 60);

  return Array.from({ length: len }, (_, i) => {
    const idx = Math.floor(i * fromPrices.length / len);
    const jdx = Math.floor(i * toPrices.length / len);
    const [ts, fp] = fromPrices[idx];
    const [, tp] = toPrices[jdx];
    const ratio = tp > 0 ? fp / tp : 0;
    const date = new Date(ts);
    const label = days === 1
      ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    return { label, ratio };
  });
}

export default function DexPriceChart({ fromToken, toToken }) {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fromToken?.coingeckoId || !toToken?.coingeckoId || fromToken.symbol === toToken.symbol) return;
    setLoading(true);
    setError(null);
    fetchPriceHistory(fromToken.coingeckoId, toToken.coingeckoId, period.days)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Gagal memuat chart'); setLoading(false); });
  }, [fromToken, toToken, period]);

  if (!fromToken || !toToken || fromToken.symbol === toToken.symbol) return null;

  const first = data[0]?.ratio;
  const last = data[data.length - 1]?.ratio;
  const change = first && last ? ((last - first) / first) * 100 : 0;
  const positive = change >= 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-xs font-medium">{fromToken.symbol}/{toToken.symbol}</p>
          {last > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-white text-sm font-bold">{last.toFixed(6)}</span>
              <span className={`flex items-center gap-0.5 text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                period.label === p.label
                  ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-20 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="h-20 flex items-center justify-center">
          <p className="text-slate-600 text-xs">{error}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={72}>
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={positive ? '#8b5cf6' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={positive ? '#8b5cf6' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={v => [v.toFixed(6), `${fromToken.symbol}/${toToken.symbol}`]}
            />
            <Area
              type="monotone"
              dataKey="ratio"
              stroke={positive ? '#8b5cf6' : '#ef4444'}
              strokeWidth={1.5}
              fill="url(#chartGrad)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}