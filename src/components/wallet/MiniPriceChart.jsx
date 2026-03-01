import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';
import { COINS } from './multiCoinApi';
import { getMarketChart } from '../market/marketDataService';

export default function MiniPriceChart({ coinId, color, days = 7, height = 80, showAxes = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    getMarketChart(coinId, days)
      .then(points => setData(points))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [coinId, days]);

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
    </div>
  );

  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center text-slate-600 text-xs" style={{ height }}>
      Tidak ada data grafik
    </div>
  );

  const isPositive = (data[data.length - 1]?.price ?? data[data.length - 1]?.close ?? 0) >=
                     (data[0]?.price ?? data[0]?.close ?? 0);
  const chartColor = isPositive ? '#22c55e' : '#ef4444';
  const dataKey = data[0]?.price !== undefined ? 'price' : 'close';

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${coinId}-${days}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxes && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />}
          {showAxes && <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9 }} interval="preserveStartEnd" />}
          <YAxis domain={['auto', 'auto']} hide={!showAxes} width={showAxes ? 50 : 0} tick={{ fill: '#475569', fontSize: 9 }} />
          <Tooltip
            content={({ active, payload }) => active && payload?.length ? (
              <div className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white">
                ${payload[0].value?.toLocaleString('en-US', { maximumFractionDigits: 4 })}
              </div>
            ) : null}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={chartColor}
            strokeWidth={1.5}
            fill={`url(#grad-${coinId}-${days})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}