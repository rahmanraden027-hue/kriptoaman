import React, { useState, useEffect, useRef } from 'react';

function generateOrders(midPrice, side, count = 8) {
  const orders = [];
  let price = midPrice;
  for (let i = 0; i < count; i++) {
    const spread = midPrice * (0.0005 + i * 0.0003);
    price = side === 'ask' ? midPrice + spread : midPrice - spread;
    const size = parseFloat((Math.random() * 5 + 0.1).toFixed(4));
    const total = parseFloat((price * size).toFixed(2));
    orders.push({ price: parseFloat(price.toFixed(price > 100 ? 2 : 4)), size, total });
  }
  return orders;
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

export default function DEXOrderBook({ midPrice = 1, fromSymbol = '?', toSymbol = '?' }) {
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const [spread, setSpread] = useState(0);
  const timerRef = useRef(null);

  const refresh = (base) => {
    const newAsks = generateOrders(base, 'ask').sort((a, b) => a.price - b.price);
    const newBids = generateOrders(base, 'bid').sort((a, b) => b.price - a.price);
    setAsks(newAsks);
    setBids(newBids);
    if (newAsks.length && newBids.length) {
      setSpread(parseFloat((newAsks[0].price - newBids[0].price).toFixed(newAsks[0].price > 100 ? 2 : 4)));
    }
  };

  useEffect(() => {
    refresh(midPrice);
    timerRef.current = setInterval(() => {
      const jitter = midPrice * (1 + (Math.random() - 0.5) * 0.002);
      refresh(jitter);
    }, 1500);
    return () => clearInterval(timerRef.current);
  }, [midPrice, fromSymbol, toSymbol]);

  const maxTotal = Math.max(...asks.map(o => o.total), ...bids.map(o => o.total), 1);

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
        <span className="text-white text-xs font-semibold">Order Book</span>
        <span className="text-slate-500 text-[10px]">{fromSymbol}/{toSymbol}</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1.5 text-[9px] text-slate-600 font-semibold uppercase">
        <span>Harga ({toSymbol})</span>
        <span className="text-center">Ukuran ({fromSymbol})</span>
        <span className="text-right">Total ({toSymbol})</span>
      </div>

      {/* Asks (sell orders - red) */}
      <div className="divide-y divide-slate-700/20">
        {asks.slice(0, 6).reverse().map((order, i) => (
          <div key={i} className="relative grid grid-cols-3 px-3 py-1 text-xs hover:bg-slate-700/20 transition-colors">
            <div className="absolute inset-y-0 right-0 bg-red-500/8"
              style={{ width: `${(order.total / maxTotal) * 100}%` }} />
            <span className="text-red-400 font-mono font-medium z-10">{fmtPrice(order.price)}</span>
            <span className="text-slate-300 font-mono text-center z-10">{fmtSize(order.size)}</span>
            <span className="text-slate-400 font-mono text-right z-10">{order.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="flex items-center justify-center gap-3 py-1.5 bg-slate-900/60 border-y border-slate-700/40">
        <span className="text-white font-bold text-xs font-mono">{fmtPrice(midPrice)}</span>
        <span className="text-slate-500 text-[10px]">spread: {fmtPrice(spread)}</span>
      </div>

      {/* Bids (buy orders - green) */}
      <div className="divide-y divide-slate-700/20">
        {bids.slice(0, 6).map((order, i) => (
          <div key={i} className="relative grid grid-cols-3 px-3 py-1 text-xs hover:bg-slate-700/20 transition-colors">
            <div className="absolute inset-y-0 right-0 bg-green-500/8"
              style={{ width: `${(order.total / maxTotal) * 100}%` }} />
            <span className="text-green-400 font-mono font-medium z-10">{fmtPrice(order.price)}</span>
            <span className="text-slate-300 font-mono text-center z-10">{fmtSize(order.size)}</span>
            <span className="text-slate-400 font-mono text-right z-10">{order.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}