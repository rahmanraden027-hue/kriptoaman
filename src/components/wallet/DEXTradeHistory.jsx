import React, { useState, useEffect, useRef } from 'react';

function generateTrade(midPrice, fromSym, toSym) {
  const side = Math.random() > 0.5 ? 'buy' : 'sell';
  const slip = (Math.random() - 0.5) * 0.002;
  const price = parseFloat((midPrice * (1 + slip)).toFixed(midPrice > 100 ? 2 : 4));
  const size = parseFloat((Math.random() * 3 + 0.05).toFixed(4));
  const total = parseFloat((price * size).toFixed(2));
  const secsAgo = Math.floor(Math.random() * 30);
  return { side, price, size, total, secsAgo, fromSym, toSym, id: Date.now() + Math.random() };
}

function fmtPrice(p) {
  if (!p) return '—';
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
}

function fmtSize(s) {
  return s < 0.001 ? s.toExponential(2) : s.toFixed(4);
}

export default function DEXTradeHistory({ midPrice = 1, fromSymbol = '?', toSymbol = '?' }) {
  const [trades, setTrades] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    // Initial burst
    const initial = Array.from({ length: 12 }, () => generateTrade(midPrice, fromSymbol, toSymbol))
      .map((t, i) => ({ ...t, secsAgo: i * 5 }));
    setTrades(initial);

    timerRef.current = setInterval(() => {
      const jitter = midPrice * (1 + (Math.random() - 0.5) * 0.003);
      const newTrade = generateTrade(jitter, fromSymbol, toSymbol);
      setTrades(prev => [newTrade, ...prev].slice(0, 20));
    }, 1800);
    return () => clearInterval(timerRef.current);
  }, [midPrice, fromSymbol, toSymbol]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
        <span className="text-white text-xs font-semibold">Riwayat Perdagangan</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-[10px]">Live</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-4 px-3 py-1.5 text-[9px] text-slate-600 font-semibold uppercase">
        <span>Harga</span>
        <span className="text-center">Ukuran</span>
        <span className="text-center">Total</span>
        <span className="text-right">Waktu</span>
      </div>

      {/* Trades */}
      <div className="max-h-52 overflow-y-auto divide-y divide-slate-700/20">
        {trades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-4 px-3 py-1.5 text-xs hover:bg-slate-700/20 transition-colors">
            <span className={`font-mono font-medium ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
              {fmtPrice(trade.price)}
            </span>
            <span className="text-slate-300 font-mono text-center">{fmtSize(trade.size)}</span>
            <span className="text-slate-400 font-mono text-center">
              {trade.total.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </span>
            <span className="text-slate-600 text-right text-[10px]">
              {trade.secsAgo === 0 ? 'Baru' : `${trade.secsAgo}d`}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 py-2 border-t border-slate-700/40 text-[10px]">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /><span className="text-slate-500">Beli</span></div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-slate-500">Jual</span></div>
      </div>
    </div>
  );
}