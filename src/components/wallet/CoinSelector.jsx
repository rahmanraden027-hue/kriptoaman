import React from 'react';
import { COINS } from './multiCoinApi';

const COIN_ICONS = {
  BTC: '₿',
  ETH: 'Ξ',
  LTC: 'Ł',
};

export default function CoinSelector({ activeCoin, onChange }) {
  return (
    <div className="flex gap-2 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
      {Object.values(COINS).map(coin => {
        const isActive = activeCoin === coin.id;
        return (
          <button
            key={coin.id}
            onClick={() => onChange(coin.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: coin.color }}
            >
              {COIN_ICONS[coin.id]}
            </span>
            <span>{coin.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}