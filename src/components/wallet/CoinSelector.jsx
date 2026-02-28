import React from 'react';
import { COINS } from './multiCoinApi';

const COIN_ICONS = {
  BTC: '₿', ETH: 'Ξ', LTC: 'Ł', BNB: 'B', SOL: '◎', DOGE: 'Ð', MATIC: 'M',
};

export default function CoinSelector({ activeCoin, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {Object.values(COINS).map(coin => {
        const isActive = activeCoin === coin.id;
        return (
          <button
            key={coin.id}
            onClick={() => onChange(coin.id)}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-medium transition-all shrink-0 border ${
              isActive
                ? 'border-transparent text-white shadow'
                : 'border-slate-700/50 text-slate-400 hover:text-slate-300 bg-slate-800/60'
            }`}
            style={isActive ? { backgroundColor: coin.color + 'cc' } : {}}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
              style={{ background: isActive ? 'rgba(255,255,255,0.25)' : coin.color }}
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