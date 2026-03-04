import React, { useEffect, useRef, useState } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

// Map CoinGecko id -> Binance symbol
const BINANCE_SYM = {
  bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', binancecoin: 'BNBUSDT',
  solana: 'SOLUSDT', ripple: 'XRPUSDT', cardano: 'ADAUSDT',
  dogecoin: 'DOGEUSDT', tron: 'TRXUSDT', 'avalanche-2': 'AVAXUSDT',
  polkadot: 'DOTUSDT', chainlink: 'LINKUSDT', 'matic-network': 'MATICUSDT',
  litecoin: 'LTCUSDT', uniswap: 'UNIUSDT',
};

function drawChart(canvas, candles, width, height) {
  if (!canvas || !candles.length) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  const pad = { top: 10, right: 10, bottom: 24, left: 60 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const maxP = Math.max(...highs);
  const minP = Math.min(...lows);
  const range = maxP - minP || 1;

  const toY = p => pad.top + chartH - ((p - minP) / range) * chartH;
  const candleW = Math.max(1, Math.floor(chartW / candles.length) - 1);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH * i) / 4;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    const price = maxP - (range * i) / 4;
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(price >= 1 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(6), pad.left - 4, y + 3);
  }

  // Candles
  candles.forEach((c, i) => {
    const x = pad.left + (i / candles.length) * chartW + candleW / 2;
    const isUp = c.close >= c.open;
    const color = isUp ? '#22c55e' : '#ef4444';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    // Wick
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, toY(c.high));
    ctx.lineTo(x, toY(c.low));
    ctx.stroke();

    // Body
    const bodyTop = toY(Math.max(c.open, c.close));
    const bodyBot = toY(Math.min(c.open, c.close));
    const bodyH = Math.max(1, bodyBot - bodyTop);
    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
  });

  // Time labels
  const step = Math.max(1, Math.floor(candles.length / 5));
  ctx.fillStyle = 'rgba(148,163,184,0.6)';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'center';
  candles.forEach((c, i) => {
    if (i % step === 0) {
      const x = pad.left + (i / candles.length) * chartW + candleW / 2;
      const d = new Date(c.time);
      const label = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      ctx.fillText(label, x, height - 6);
    }
  });
}

export default function CandlestickModal({ coin, currentPrice, change24h, onClose }) {
  const canvasRef = useRef(null);
  const [interval, setInterval] = useState('1h');
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dims, setDims] = useState({ w: 360, h: 220 });
  const wsRef = useRef(null);

  const sym = BINANCE_SYM[coin?.id];
  const isUp = (change24h ?? 0) >= 0;

  const fetchCandles = async (iv) => {
    if (!sym) return;
    setLoading(true);
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${iv}&limit=80`);
    const raw = await r.json();
    if (Array.isArray(raw)) {
      setCandles(raw.map(k => ({
        time: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCandles(interval); }, [interval, sym]);

  // WebSocket live last candle update
  useEffect(() => {
    if (!sym) return;
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}@kline_${interval}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const k = msg.k;
      if (!k) return;
      const newCandle = { time: k.t, open: +k.o, high: +k.h, low: +k.l, close: +k.c };
      setCandles(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        if (last.time === newCandle.time) {
          return [...prev.slice(0, -1), newCandle];
        }
        return [...prev.slice(1), newCandle];
      });
    };
    return () => ws.close();
  }, [sym, interval]);

  // Resize
  useEffect(() => {
    const update = () => {
      const w = Math.min(window.innerWidth - 32, 520);
      setDims({ w, h: Math.round(w * 0.52) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Draw
  useEffect(() => {
    if (!loading && candles.length && canvasRef.current) {
      drawChart(canvasRef.current, candles, dims.w, dims.h);
    }
  }, [candles, loading, dims]);

  if (!sym) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-end justify-center md:items-center" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/50 rounded-t-3xl md:rounded-3xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div>
            <p className="text-white font-bold text-base">{coin?.sym}/USDT</p>
            <p className="text-slate-400 text-xs">{coin?.name} · Live Binance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-bold text-sm">
                {currentPrice != null ? `$${currentPrice.toLocaleString('en-US', { maximumFractionDigits: 6 })}` : '—'}
              </p>
              <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change24h != null ? `${isUp ? '+' : ''}${change24h.toFixed(2)}%` : '—'}
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Interval selector */}
        <div className="flex gap-1.5 px-5 py-3">
          {INTERVALS.map(iv => (
            <button key={iv.value} onClick={() => setInterval(iv.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${interval === iv.value ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {iv.label}
            </button>
          ))}
          <button onClick={() => fetchCandles(interval)} className="ml-auto p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Canvas chart */}
        <div className="px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center bg-slate-800/50 rounded-2xl" style={{ height: dims.h }}>
              <div className="text-slate-400 text-sm animate-pulse">Memuat chart...</div>
            </div>
          ) : (
            <canvas ref={canvasRef} width={dims.w} height={dims.h}
              className="rounded-2xl bg-slate-800/40 w-full"
              style={{ display: 'block' }} />
          )}
        </div>
      </div>
    </div>
  );
}