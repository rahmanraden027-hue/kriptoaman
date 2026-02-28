import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw,
  PieChart as PieIcon, BarChart2, Building2,
} from 'lucide-react';
import { COINS, getPrices, getBalance, formatAmount } from './multiCoinApi';
import CEXPanel from './CEXPanel';

const WALLET_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE', 'MATIC', 'LTC'];
const COIN_ICONS   = { BTC: '₿', ETH: 'Ξ', LTC: 'Ł', BNB: 'B', SOL: '◎', DOGE: 'Ð', MATIC: 'M' };
const RANGE_OPTIONS = [
  { label: '7H', days: 7 },
  { label: '1B', days: 30 },
  { label: '3B', days: 90 },
];



async function fetchCoinHistory(coingeckoId, days) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.prices || []).map(([ts, price]) => ({
    date: new Date(ts).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    ts, price: parseFloat(price.toFixed(4)),
  }));
}

function formatUSD(val) {
  if (!val && val !== 0) return '—';
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
  if (val >= 1000)    return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + val.toFixed(2);
}

// ── Tooltips ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <div className="text-slate-400 mb-1.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-semibold">{formatUSD(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-slate-700 mt-1.5 pt-1.5">
        <span className="text-slate-300">Total: </span>
        <span className="text-white font-bold">{formatUSD(total)}</span>
      </div>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs shadow">
      <div className="text-white font-semibold">{payload[0].name}</div>
      <div className="text-slate-300">{formatUSD(payload[0].value)}</div>
      <div className="text-slate-400">{payload[0].payload.pct?.toFixed(1)}%</div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PortfolioChart({ addresses = {} }) {
  const [range, setRange] = useState(7);
  const [chartData, setChartData] = useState([]);
  const [coinValues, setCoinValues] = useState({});
  const [totalWallet, setTotalWallet] = useState(null);
  const [totalChange, setTotalChange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState('area'); // area | pie | cex
  const [cexTotal, setCexTotal] = useState(0);
  const [cexConnCount, setCexConnCount] = useState(0);
  const grandTotal = (totalWallet || 0) + cexTotal;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [prices, ...balResults] = await Promise.all([
        getPrices(),
        ...WALLET_COINS.map(coin =>
          addresses[coin]?.address
            ? getBalance(coin, addresses[coin].address).catch(() => null).then(b => ({ coin, b }))
            : Promise.resolve({ coin, b: null })
        ),
      ]);

      const balMap = {};
      balResults.forEach(({ coin, b }) => { balMap[coin] = b; });

      const vals = {};
      let total = 0;
      WALLET_COINS.forEach(coinId => {
        const bal = balMap[coinId];
        const p   = prices[coinId]?.price || 0;
        const amt = bal ? parseFloat(formatAmount(coinId, bal.balance || 0)) : 0;
        vals[coinId] = { usd: amt * p, amount: amt, price: p, change24h: prices[coinId]?.change24h };
        total += amt * p;
      });
      setCoinValues(vals);
      setTotalWallet(total);

      if (total > 0) {
        const w = WALLET_COINS.reduce((s, c) => s + (vals[c].usd / total) * (vals[c].change24h || 0), 0);
        setTotalChange(w);
      }

      const histories = await Promise.all(
        WALLET_COINS.map(coinId => fetchCoinHistory(COINS[coinId].coingeckoId, range).catch(() => []))
      );

      const dateMap = {};
      WALLET_COINS.forEach((coinId, idx) => {
        histories[idx].forEach(({ date, price }) => {
          if (!dateMap[date]) dateMap[date] = { date };
          dateMap[date][coinId] = parseFloat(((vals[coinId].amount) * price).toFixed(2));
        });
      });

      setChartData(
        Object.values(dateMap)
          .sort((a, b) => a.date < b.date ? -1 : 1)
          .map(d => ({ ...d, total: WALLET_COINS.reduce((s, c) => s + (d[c] || 0), 0) }))
      );
      setLoading(false);
    }
    load();
  }, [range, refreshKey, JSON.stringify(addresses)]);

  const pieData = [
    ...WALLET_COINS.map(coinId => ({
      name: COINS[coinId].symbol,
      value: parseFloat((coinValues[coinId]?.usd || 0).toFixed(2)),
      color: COINS[coinId].color,
      pct: grandTotal > 0 ? ((coinValues[coinId]?.usd || 0) / grandTotal) * 100 : 0,
    })),
    ...(cexTotal > 0 ? [{ name: 'CEX', value: parseFloat(cexTotal.toFixed(2)), color: '#64748b', pct: grandTotal > 0 ? (cexTotal / grandTotal) * 100 : 0 }] : []),
  ].filter(d => d.value > 0);

  const isPositive = (totalChange || 0) >= 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4 space-y-4">

      {/* Header — Grand Total */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-xs mb-0.5">Total Portofolio {cexTotal > 0 ? '(Wallet + CEX)' : ''}</div>
          {loading ? (
            <div className="h-7 w-36 bg-slate-700/50 rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold text-white">{formatUSD(grandTotal)}</span>
              {totalChange !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{totalChange.toFixed(2)}% 24h
                </span>
              )}
            </div>
          )}
          {cexTotal > 0 && !loading && (
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>Wallet: <span className="text-slate-300 font-medium">{formatUSD(totalWallet)}</span></span>
              <span>CEX: <span className="text-slate-300 font-medium">{formatUSD(cexTotal)}</span></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button onClick={() => setViewMode('area')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'area' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Grafik">
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('pie')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'pie' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Distribusi">
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('cex')}
              className={`p-1.5 rounded-md transition-colors relative ${viewMode === 'cex' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="CEX">
              <Building2 className="w-3.5 h-3.5" />
              {cexConnCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />}
            </button>
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Range selector */}
      {viewMode === 'area' && (
        <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5 w-fit">
          {RANGE_OPTIONS.map(({ label, days }) => (
            <button key={days} onClick={() => setRange(days)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${range === days ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Charts */}
      {viewMode === 'area' && (
        loading ? (
          <div className="h-44 bg-slate-700/20 rounded-xl animate-pulse" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={176}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                {WALLET_COINS.map(coinId => (
                  <linearGradient key={coinId} id={`pg-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COINS[coinId].color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={COINS[coinId].color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              {WALLET_COINS.map(coinId => (
                <Area key={coinId} type="monotone" dataKey={coinId} name={COINS[coinId].symbol}
                  stroke={COINS[coinId].color} strokeWidth={1.5}
                  fill={`url(#pg-${coinId})`} dot={false}
                  activeDot={{ r: 3, fill: COINS[coinId].color }} stackId="1" />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex items-center justify-center text-slate-600 text-sm">Data tidak tersedia</div>
        )
      )}

      {viewMode === 'pie' && (
        pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={176}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-slate-300 text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex items-center justify-center text-slate-600 text-sm">Tidak ada saldo terdeteksi</div>
        )
      )}

      {viewMode === 'cex' && (
        <CEXPanel
          onTotalChange={(total, conns) => { setCexTotal(total); setCexConnCount(conns.length); }}
        />
      )}

      {/* Per-coin breakdown (area + pie view) */}
      {viewMode !== 'cex' && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/40 sm:grid-cols-4">
          {WALLET_COINS.map(coinId => {
            const coin = COINS[coinId];
            const v    = coinValues[coinId];
            const pct  = grandTotal > 0 && v ? ((v.usd / grandTotal) * 100).toFixed(1) : '0.0';
            return (
              <div key={coinId} className="text-center">
                <div className="text-base font-bold" style={{ color: coin.color }}>{COIN_ICONS[coinId]}</div>
                <div className="text-slate-300 text-xs font-medium">{formatUSD(v?.usd || 0)}</div>
                <div className="text-slate-600 text-xs">{pct}%</div>
              </div>
            );
          })}
          {cexTotal > 0 && (
            <div className="text-center">
              <div className="text-base font-bold text-slate-400">🏦</div>
              <div className="text-slate-300 text-xs font-medium">{formatUSD(cexTotal)}</div>
              <div className="text-slate-600 text-xs">{grandTotal > 0 ? ((cexTotal / grandTotal) * 100).toFixed(1) : 0}%</div>
            </div>
          )}
        </div>
      )}


    </div>
  );
}