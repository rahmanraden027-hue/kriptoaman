import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { COINS, getPrices } from './multiCoinApi';

const COIN_LIST = ['BTC', 'ETH', 'LTC'];

async function fetchHistory(coingeckoId, days = 7) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.prices || []).map(([ts, price]) => ({
    date: new Date(ts).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    price: parseFloat(price.toFixed(2)),
  }));
}

function formatPrice(p) {
  if (!p) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + p.toFixed(2);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white shadow">
      <div className="font-semibold">${payload[0].value.toLocaleString()}</div>
      <div className="text-slate-400">{payload[0].payload.date}</div>
    </div>
  );
};

function CoinChart({ coinId }) {
  const coin = COINS[coinId];
  const [history, setHistory] = useState([]);
  const [price, setPrice] = useState(null);
  const [change24h, setChange24h] = useState(null);
  const [range, setRange] = useState(7);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [hist, prices] = await Promise.all([
      fetchHistory(coin.coingeckoId, range).catch(() => []),
      getPrices(),
    ]);
    setHistory(hist);
    setPrice(prices[coinId]?.price || null);
    setChange24h(prices[coinId]?.change24h || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [coinId, range]);

  const isPositive = (change24h || 0) >= 0;
  const minPrice = history.length ? Math.min(...history.map(d => d.price)) : 0;
  const maxPrice = history.length ? Math.max(...history.map(d => d.price)) : 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{coin.symbol === 'BTC' ? '₿' : coin.symbol === 'ETH' ? 'Ξ' : 'Ł'}</span>
          <div>
            <div className="text-white text-sm font-semibold">{coin.name}</div>
            <div className="text-slate-500 text-xs">{coin.symbol}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-base">{formatPrice(price)}</div>
          {change24h !== null && (
            <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-1 mb-3">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
              range === d
                ? 'text-white font-medium'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={range === d ? { backgroundColor: coin.color + '33', color: coin.color } : {}}
          >
            {d === 7 ? '1M' : d === 30 ? '1B' : '3B'}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-28 bg-slate-700/30 rounded-lg animate-pulse" />
      ) : history.length > 0 ? (
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={coin.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={coin.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={coin.color}
              strokeWidth={2}
              fill={`url(#grad-${coinId})`}
              dot={false}
              activeDot={{ r: 3, fill: coin.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-28 flex items-center justify-center text-slate-600 text-xs">Data tidak tersedia</div>
      )}

      {/* Stats */}
      {!loading && history.length > 0 && (
        <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/40">
          <div>
            <div className="text-slate-600 text-xs">Terendah</div>
            <div className="text-slate-400 text-xs font-medium">{formatPrice(minPrice)}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-600 text-xs">Periode</div>
            <div className="text-slate-400 text-xs font-medium">{range} hari</div>
          </div>
          <div className="text-right">
            <div className="text-slate-600 text-xs">Tertinggi</div>
            <div className="text-slate-400 text-xs font-medium">{formatPrice(maxPrice)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CryptoPriceChart() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="text-white font-semibold text-sm">Performa Aset</h2>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      {COIN_LIST.map(id => (
        <CoinChart key={`${id}-${refreshKey}`} coinId={id} />
      ))}
    </div>
  );
}