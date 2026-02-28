import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

function generateCandles(basePrice, count = 48, volatility = 0.02) {
  const data = [];
  let price = basePrice * (0.93 + Math.random() * 0.07);
  for (let i = 0; i < count; i++) {
    const open = price;
    const move = (Math.random() - 0.48) * volatility;
    const close = open * (1 + move);
    price = close;
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const label = i % 8 === 0 ? `${i}h` : '';
    data.push({ t: i, label, o: open, c: close, h: high, l: low, p: parseFloat(close.toFixed(close > 100 ? 2 : 4)) });
  }
  return data;
}

function fmtPrice(p) {
  if (!p) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return '$' + p.toFixed(2);
  return '$' + p.toFixed(4);
}

const RANGES = ['1H', '4H', '1D', '1W'];

export default function DEXPriceChart({ fromToken, toToken, basePrice, color = '#628EEA' }) {
  const [range, setRange] = useState('1D');
  const [data, setData] = useState([]);
  const [livePrice, setLivePrice] = useState(basePrice || 1);
  const [change, setChange] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const pts = range === '1H' ? 60 : range === '4H' ? 48 : range === '1D' ? 48 : 56;
    const volatility = range === '1H' ? 0.006 : range === '4H' ? 0.012 : range === '1D' ? 0.022 : 0.04;
    const base = basePrice || 1;
    const candles = generateCandles(base, pts, volatility);
    setData(candles);
    const first = candles[0]?.p || base;
    const last = candles[candles.length - 1]?.p || base;
    setLivePrice(last);
    setChange(((last - first) / first) * 100);
  }, [range, fromToken, toToken, basePrice]);

  // Live tick updates
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setData(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.49) * 0.004;
        const newP = parseFloat((last.p * (1 + delta)).toFixed(last.p > 100 ? 2 : 4));
        const updated = [...prev.slice(1), { ...last, t: last.t + 1, p: newP, c: newP }];
        setLivePrice(newP);
        const first = updated[0]?.p || newP;
        setChange(((newP - first) / first) * 100);
        return updated;
      });
    }, 2000);
    return () => clearInterval(timerRef.current);
  }, []);

  const isUp = change >= 0;
  const low = data.length ? Math.min(...data.map(d => d.p)) : 0;
  const high = data.length ? Math.max(...data.map(d => d.p)) : 0;
  const pairLabel = `${fromToken?.symbol || '?'}/${toToken?.symbol || '?'}`;

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">{pairLabel}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium">DEX</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white font-bold text-base">{fmtPrice(livePrice)}</span>
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-900/60 rounded-xl p-1">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${range === r ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-1 pb-2">
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id={`dex-grad-${fromToken?.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.35} />
                <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 8 }} interval={0} />
            <YAxis tick={{ fill: '#475569', fontSize: 8 }} domain={['auto', 'auto']} width={48} tickFormatter={v => fmtPrice(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 10 }}
              formatter={v => [fmtPrice(v), pairLabel]}
              labelFormatter={() => ''}
            />
            <ReferenceLine y={livePrice} stroke={isUp ? '#22c55e' : '#ef4444'} strokeDasharray="3 3" strokeOpacity={0.4} />
            <Area type="monotone" dataKey="p" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={1.5}
              fill={`url(#dex-grad-${fromToken?.symbol})`} dot={false} activeDot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-px border-t border-slate-700/40">
        {[
          { label: 'Terendah', value: fmtPrice(low), color: 'text-red-400' },
          { label: 'Tertinggi', value: fmtPrice(high), color: 'text-green-400' },
          { label: 'Volume 24H', value: `$${(Math.random() * 50 + 5).toFixed(1)}M`, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/40 px-3 py-2 text-center">
            <div className="text-slate-600 text-[9px]">{s.label}</div>
            <div className={`text-xs font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}