import React from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import TradingViewChart from './TradingViewChart';
import { COIN_META } from '../home/coinMeta';

export default function TradingViewModal({ coin, price, change24h, onClose }) {
  const meta = COIN_META[coin.sym] || {};
  const up = (change24h ?? 0) >= 0;
  const fmt = (p) => (p == null ? '—' : p >= 1 ? `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `$${p.toFixed(6)}`);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0c0a]/97 backdrop-blur flex flex-col ka-fade-up" style={{ animationDuration: '0.25s' }}>
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-ka-card-border bg-[#0a0c0a]/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={meta.logo} alt={coin.sym} className="w-9 h-9 rounded-full shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{coin.sym}<span className="ka-muted font-normal">/USDT</span></p>
            <p className="ka-muted text-[10px] truncate">{coin.name}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold ka-num ${price != null ? (up ? 'text-ka-emerald' : 'text-[#e74c3c]') : 'text-white'}`}>{fmt(price)}</p>
          <p className={`text-[11px] font-semibold ka-num flex items-center justify-end gap-1 ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change24h != null ? `${up ? '+' : ''}${change24h.toFixed(2)}%` : '—'}
          </p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-ka-card border border-ka-card-border flex items-center justify-center ka-muted hover:text-white shrink-0 tap-reset" aria-label="Tutup">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <div className="ka-surface p-2 h-full">
          <TradingViewChart symbol={`${coin.sym}USDT`} height="100%" />
        </div>
      </div>
    </div>
  );
}