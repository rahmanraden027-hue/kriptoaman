import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { COINS } from './multiCoinApi';

const CACHE = {};

export default function MiniPriceChart({ coinId, color }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const geckoId = COINS[coinId]?.coingeckoId;
    if (!geckoId) { setLoading(false); return; }

    if (CACHE[geckoId]) {
      setData(CACHE[geckoId]);
      setLoading(false);
      return;
    }

    fetch(`https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=7&interval=daily`)
      .then(r => r.json())
      .then(json => {
        const points = (json.prices || []).map(([ts, price]) => ({ price }));
        CACHE[geckoId] = points;
        setData(points);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [coinId]);

  if (loading) return (
    <div className="h-20 flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
    </div>
  );

  if (!data || data.length < 2) return (
    <div className="h-20 flex items-center justify-center text-slate-600 text-xs">Tidak ada data grafik</div>
  );

  const isPositive = data[data.length - 1]?.price >= data[0]?.price;
  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${coinId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            content={({ active, payload }) => active && payload?.length ? (
              <div className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white">
                ${payload[0].value?.toLocaleString('en-US', { maximumFractionDigits: 4 })}
              </div>
            ) : null}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={1.5}
            fill={`url(#grad-${coinId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}