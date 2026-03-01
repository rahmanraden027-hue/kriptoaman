import React from 'react';
import { COINS } from './multiCoinApi';

const COIN_ICONS = {
  BTC: '₿', ETH: 'Ξ', LTC: 'Ł', BNB: 'B', SOL: '◎', DOGE: 'Ð', MATIC: 'M',
  ARB: 'A',  OP: 'O',  BASE: 'Ⓑ', AVAX: '🔺', FTM: 'F',
  TRX: 'T', XRP: '✕', ATOM: '⚛', ADA: 'A', DOT: '●',
  ZKSYNC: 'Z', LINEA: 'L', SCROLL: 'S', CELO: 'C',
};

// Group coins by layer/category for organized display
const CHAIN_GROUPS = [
  { label: 'Layer 1 — Major',  ids: ['BTC', 'ETH', 'BNB', 'SOL', 'AVAX', 'MATIC'] },
  { label: 'Layer 1 — Alt',    ids: ['DOGE', 'LTC', 'TRX', 'XRP', 'ATOM', 'ADA', 'DOT', 'FTM', 'CELO'] },
  { label: 'Ethereum L2',      ids: ['ARB', 'OP', 'BASE', 'ZKSYNC', 'LINEA', 'SCROLL'] },
];

export default function CoinSelector({ activeCoin, onChange }) {
  const allCoinIds = CHAIN_GROUPS.flatMap(g => g.ids).filter(id => COINS[id]);

  return (
    <div className="space-y-2">
      {CHAIN_GROUPS.map(group => {
        const groupCoins = group.ids.filter(id => COINS[id]);
        if (groupCoins.length === 0) return null;
        return (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-slate-600 text-xs font-medium">{group.label}</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {groupCoins.map(id => {
                const coin = COINS[id];
                const isActive = activeCoin === id;
                return (
                  <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={`flex flex-col items-start py-1.5 px-2.5 rounded-xl text-xs font-medium transition-all shrink-0 border ${
                      isActive
                        ? 'border-transparent text-white shadow'
                        : 'border-slate-700/50 text-slate-400 hover:text-slate-300 bg-slate-800/60'
                    }`}
                    style={isActive ? { backgroundColor: coin.color + 'cc' } : {}}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                        style={{ background: isActive ? 'rgba(255,255,255,0.25)' : coin.color }}
                      >
                        {COIN_ICONS[id] || id[0]}
                      </span>
                      <span>{coin.symbol}</span>
                      {coin.badge && (
                        <span className="text-[9px] px-1 py-0.5 rounded font-bold leading-none"
                          style={{ background: isActive ? 'rgba(255,255,255,0.2)' : coin.color + '33', color: isActive ? 'white' : coin.color }}>
                          {coin.badge}
                        </span>
                      )}
                    </div>
                    {coin.platform && (
                      <span className={`text-[9px] leading-tight mt-0.5 ${isActive ? 'text-white/60' : 'text-slate-600'}`}>
                        {coin.platform}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}