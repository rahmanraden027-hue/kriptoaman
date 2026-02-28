import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { X, Plus, Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const BASE_PRICES = {
  BTC: 95200, ETH: 3420, BNB: 582, SOL: 172, AVAX: 38.5, MATIC: 0.46,
  DOT: 7.8, ATOM: 8.9, NEAR: 5.2, ADA: 0.48, LTC: 86, DOGE: 0.124,
  SHIB: 0.0000248, ARB: 1.12, OP: 1.85, FTM: 0.57, UNI: 8.4, LINK: 14.8,
  AAVE: 195, CRV: 0.51, INJ: 22, SUI: 3.8, APT: 12.5, XRP: 0.57, TRX: 0.124,
};

const CIRC_SUPPLY = {
  BTC: 19.7e6, ETH: 120e6, BNB: 145e6, SOL: 450e6, AVAX: 400e6, MATIC: 9900e6,
  DOT: 1400e6, ATOM: 390e6, NEAR: 1100e6, ADA: 35500e6, LTC: 75e6, DOGE: 143e9,
  SHIB: 589e12, ARB: 1250e6, OP: 1070e6, FTM: 2800e6, UNI: 600e6, LINK: 570e6,
  AAVE: 16e6, CRV: 1500e6, INJ: 100e6, SUI: 870e6, APT: 440e6, XRP: 54000e6, TRX: 87000e6,
};

function formatPrice(p) {
  if (!p) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return '$' + p.toFixed(2);
  if (p >= 0.01) return '$' + p.toFixed(4);
  return '$' + p.toFixed(8);
}

function formatMC(price, id) {
  const mc = price * (CIRC_SUPPLY[id] || 1e9);
  if (mc >= 1e12) return '$' + (mc / 1e12).toFixed(2) + 'T';
  if (mc >= 1e9) return '$' + (mc / 1e9).toFixed(1) + 'B';
  if (mc >= 1e6) return '$' + (mc / 1e6).toFixed(0) + 'M';
  return '$' + mc.toFixed(0);
}

function formatVol(price, id) {
  const vol = price * (CIRC_SUPPLY[id] || 1e9) * (0.02 + Math.random() * 0.04);
  if (vol >= 1e9) return '$' + (vol / 1e9).toFixed(1) + 'B';
  if (vol >= 1e6) return '$' + (vol / 1e6).toFixed(0) + 'M';
  return '$' + vol.toFixed(0);
}

function generateNormalized(basePrice, pts = 48) {
  const data = [];
  let p = basePrice * (0.92 + Math.random() * 0.08);
  const start = p;
  for (let i = 0; i < pts; i++) {
    p = p * (1 + (Math.random() - 0.48) * 0.025);
    data.push({ i, norm: parseFloat(((p / start - 1) * 100).toFixed(2)), raw: p });
  }
  return data;
}

// Merge datasets by index for overlay chart
function mergeChartData(coins, chartData) {
  const len = Math.max(...coins.map(id => chartData[id]?.length || 0), 48);
  return Array.from({ length: len }, (_, i) => {
    const point = { i };
    coins.forEach(id => {
      if (chartData[id]?.[i]) point[id] = chartData[id][i].norm;
    });
    return point;
  });
}

function CoinPicker({ all, selected, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = all.filter(c =>
    !selected.includes(c.id) &&
    (c.id.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl w-full max-w-md p-4 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">Tambah Aset Perbandingan</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari koin..."
            autoFocus className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-slate-600" />
        </div>
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/30">
          {filtered.map(c => (
            <button key={c.id} onClick={() => { onAdd(c.id); onClose(); }}
              className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-slate-800 rounded-xl transition-colors text-left">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: c.color }}>{c.icon}</div>
              <div>
                <div className="text-white text-sm font-semibold">{c.id}</div>
                <div className="text-slate-500 text-xs">{c.name}</div>
              </div>
              <div className="ml-auto text-slate-400 text-sm">{formatPrice(BASE_PRICES[c.id])}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const RANGES = ['1H', '1D', '7D', '1M'];

export default function CoinCompare({ allCoins, livePrices, onClose }) {
  const [selected, setSelected] = useState(['BTC', 'ETH']);
  const [showPicker, setShowPicker] = useState(false);
  const [chartData, setChartData] = useState({});
  const [range, setRange] = useState('1D');
  const [vol24, setVol24] = useState({});
  const timerRef = useRef(null);

  // Generate chart data per coin per range
  useEffect(() => {
    const pts = range === '1H' ? 60 : range === '1D' ? 48 : range === '7D' ? 84 : 60;
    const cd = {};
    selected.forEach(id => {
      const base = livePrices[id]?.price || BASE_PRICES[id] || 1;
      cd[id] = generateNormalized(base, pts);
    });
    setChartData(cd);

    // Simulate vol
    const v = {};
    selected.forEach(id => {
      const base = livePrices[id]?.price || BASE_PRICES[id] || 1;
      v[id] = formatVol(base, id);
    });
    setVol24(v);
  }, [range, selected.join(',')]);

  // Live tick on last candle
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setChartData(prev => {
        const updated = { ...prev };
        selected.forEach(id => {
          const arr = prev[id];
          if (!arr?.length) return;
          const last = arr[arr.length - 1];
          const delta = (Math.random() - 0.49) * 0.012;
          const newNorm = parseFloat((last.norm + delta).toFixed(2));
          updated[id] = [...arr.slice(1), { ...last, norm: newNorm }];
        });
        return updated;
      });
    }, 2000);
    return () => clearInterval(timerRef.current);
  }, [selected.join(',')]);

  const merged = mergeChartData(selected, chartData);

  const addCoin = (id) => { if (selected.length < 3) setSelected(prev => [...prev, id]); };
  const removeCoin = (id) => setSelected(prev => prev.filter(x => x !== id));

  const coinOf = (id) => allCoins.find(c => c.id === id);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-white font-bold text-sm">Bandingkan Aset</div>
            <div className="text-slate-500 text-xs">Hingga 3 koin secara berdampingan</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4">

          {/* Coin selector chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {selected.map(id => {
              const coin = coinOf(id);
              if (!coin) return null;
              return (
                <div key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
                  style={{ background: coin.color + '22', borderColor: coin.color + '55', color: coin.color }}>
                  <span>{coin.icon}</span>
                  <span>{id}</span>
                  {selected.length > 1 && (
                    <button onClick={() => removeCoin(id)} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
                  )}
                </div>
              );
            })}
            {selected.length < 3 && (
              <button onClick={() => setShowPicker(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-slate-600 text-slate-500 hover:text-white hover:border-slate-400 text-xs transition-all">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            )}
          </div>

          {/* Range selector */}
          <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === r ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
                {r}
              </button>
            ))}
          </div>

          {/* Overlay Chart - Normalized % performance */}
          <div className="bg-slate-900/60 border border-slate-700/30 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-xs font-semibold">Performa Relatif (%)</span>
              <div className="flex items-center gap-3">
                {selected.map(id => {
                  const coin = coinOf(id);
                  return coin ? (
                    <div key={id} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: coin.color }} />
                      <span className="text-[10px] text-slate-400">{id}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={merged} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  {selected.map(id => {
                    const coin = coinOf(id);
                    return coin ? (
                      <linearGradient key={id} id={`cmp-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={coin.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={coin.color} stopOpacity={0} />
                      </linearGradient>
                    ) : null;
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="i" hide />
                <YAxis tick={{ fill: '#475569', fontSize: 8 }} tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} width={44} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 10 }}
                  formatter={(v, name) => [`${v > 0 ? '+' : ''}${v}%`, name]}
                />
                {selected.map(id => {
                  const coin = coinOf(id);
                  return coin ? (
                    <Area key={id} type="monotone" dataKey={id} stroke={coin.color} strokeWidth={2}
                      fill={`url(#cmp-${id})`} dot={false} activeDot={{ r: 3 }} />
                  ) : null;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Side-by-side metric cards */}
          <div className={`grid gap-3 ${selected.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {selected.map(id => {
              const coin = coinOf(id);
              if (!coin) return null;
              const lp = livePrices[id];
              const price = lp?.price || BASE_PRICES[id] || 0;
              const change = lp?.change24h || 0;
              const isUp = change >= 0;
              const lastNorm = chartData[id]?.[chartData[id].length - 1]?.norm || 0;

              return (
                <div key={id} className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3 space-y-2.5"
                  style={{ borderTopColor: coin.color + '88', borderTopWidth: 2 }}>
                  {/* Coin header */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: coin.color }}>{coin.icon}</div>
                    <div>
                      <div className="text-white text-xs font-bold">{id}</div>
                      <div className="text-slate-600 text-[9px] truncate">{coin.name}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="text-white font-bold text-sm leading-tight">{formatPrice(price)}</div>
                    <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  </div>

                  {/* Metrics */}
                  {[
                    { label: 'Market Cap', value: formatMC(price, id) },
                    { label: 'Volume 24H', value: vol24[id] || '—' },
                    { label: `Perf. ${range}`, value: `${lastNorm > 0 ? '+' : ''}${lastNorm.toFixed(2)}%`, color: lastNorm >= 0 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Jaringan', value: coin.network },
                    { label: 'Kategori', value: coin.cat },
                  ].map(m => (
                    <div key={m.label} className="border-t border-slate-700/30 pt-1.5">
                      <div className="text-slate-600 text-[9px]">{m.label}</div>
                      <div className={`text-xs font-semibold truncate ${m.color || 'text-white'}`}>{m.value}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Winner badges */}
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 space-y-2">
            <div className="text-slate-400 text-xs font-semibold">📊 Ringkasan Perbandingan</div>
            {[
              {
                label: 'Harga Tertinggi',
                winner: selected.reduce((best, id) => {
                  const p = livePrices[id]?.price || BASE_PRICES[id] || 0;
                  const bp = livePrices[best]?.price || BASE_PRICES[best] || 0;
                  return p > bp ? id : best;
                }, selected[0])
              },
              {
                label: 'Performa Terbaik',
                winner: selected.reduce((best, id) => {
                  const n = chartData[id]?.[chartData[id].length - 1]?.norm || 0;
                  const bn = chartData[best]?.[chartData[best].length - 1]?.norm || 0;
                  return n > bn ? id : best;
                }, selected[0])
              },
              {
                label: 'Market Cap Terbesar',
                winner: selected.reduce((best, id) => {
                  const mc = (livePrices[id]?.price || BASE_PRICES[id] || 0) * (CIRC_SUPPLY[id] || 1e9);
                  const bmc = (livePrices[best]?.price || BASE_PRICES[best] || 0) * (CIRC_SUPPLY[best] || 1e9);
                  return mc > bmc ? id : best;
                }, selected[0])
              },
            ].map(({ label, winner }) => {
              const coin = coinOf(winner);
              return (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  {coin && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                      style={{ background: coin.color + '33', border: `1px solid ${coin.color}55` }}>
                      <span>{coin.icon}</span>{winner}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showPicker && (
        <CoinPicker allCoins={allCoins} selected={selected} onAdd={addCoin} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}