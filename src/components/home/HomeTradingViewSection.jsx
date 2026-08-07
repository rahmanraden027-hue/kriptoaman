import React, { useState } from 'react';
import TradingViewChart from '../market/TradingViewChart';
import { CandlestickChart } from 'lucide-react';

const SYMBOLS = [
  { label: 'BTC', value: 'BTCUSDT' },
  { label: 'ETH', value: 'ETHUSDT' },
  { label: 'SOL', value: 'SOLUSDT' },
  { label: 'BNB', value: 'BNBUSDT' },
];

export default function HomeTradingViewSection() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  return (
    <div className="ka-surface p-3 ka-fade-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <CandlestickChart className="w-4 h-4 text-ka-emerald" /> Grafik Live
        </h3>
        <div className="flex gap-1">
          {SYMBOLS.map(s => (
            <button key={s.value} onClick={() => setSymbol(s.value)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition tap-reset ${symbol === s.value ? 'bg-ka-emerald text-black' : 'bg-ka-card text-ka-muted hover:text-white'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-ka-card-border">
        <TradingViewChart symbol={symbol} height={360} />
      </div>
    </div>
  );
}