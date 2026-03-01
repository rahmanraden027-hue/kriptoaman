import React from 'react';
import { Wallet } from 'lucide-react';

const COIN_INFO = {
  BTC: { label: 'Bitcoin', color: '#F7931A', symbol: '₿' },
  ETH: { label: 'Ethereum', color: '#627EEA', symbol: 'Ξ' },
  SOL: { label: 'Solana', color: '#9945FF', symbol: '◎' },
  USDT: { label: 'USDT', color: '#26A17B', symbol: '₮' },
};

export default function AdminBalanceDisplay({ balances }) {
  if (!balances || Object.keys(balances).length === 0) return null;

  const coins = Object.entries(balances)
    .filter(([coin]) => COIN_INFO[coin])
    .sort(([a], [b]) => (balances[b] || 0) - (balances[a] || 0));

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center">
          <Wallet className="w-3 h-3 text-white" />
        </div>
        <h3 className="text-white font-bold text-sm">Saldo Admin</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {coins.map(([coin, amount]) => {
          const info = COIN_INFO[coin];
          return (
            <div
              key={coin}
              className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-3 hover:border-slate-700/60 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: info.color }}
                >
                  {info.symbol}
                </div>
                <span className="text-white text-xs font-semibold">{coin}</span>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-bold">
                  {amount.toLocaleString('en-US', {
                    maximumFractionDigits: coin === 'USDT' ? 0 : 4,
                    minimumFractionDigits: 0,
                  })}
                </p>
                <p className="text-slate-500 text-[10px]">{info.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}