import React from 'react';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import useLivePrices from '../market/useLivePrices';

const COINS = [
  { id: 'BTC', name: 'Bitcoin', color: '#f59e0b', emoji: '₿' },
  { id: 'ETH', name: 'Ethereum', color: '#6366f1', emoji: 'Ξ' },
  { id: 'USDT', name: 'Tether', color: '#26a17b', emoji: '₮' },
  { id: 'BNB', name: 'BNB', color: '#f0b90b', emoji: 'B' },
  { id: 'SOL', name: 'Solana', color: '#9945ff', emoji: '◎' },
  { id: 'XRP', name: 'XRP', color: '#00aae4', emoji: 'X' },
];

export default function IDRPriceCard() {
  const { prices, connected, idrRate } = useLivePrices();

  const formatIDR = (usd) => {
    if (!usd) return '—';
    const val = usd * idrRate;
    if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9)  return `Rp ${(val / 1e9).toFixed(2)}M`;
    if (val >= 1e6)  return `Rp ${(val / 1e6).toFixed(2)} Jt`;
    if (val >= 1e3)  return `Rp ${val.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
    return `Rp ${val.toFixed(0)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Harga Live (IDR)</p>
          <p className="text-slate-600 text-[10px]">1 USD ≈ Rp {idrRate.toLocaleString('id-ID')}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold border ${connected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? 'Live' : 'Reconnecting…'}
        </div>
      </div>

      <div className="space-y-2">
        {COINS.map(coin => {
          const data = prices[coin.id];
          const change = data?.change24h;
          const isUp = (change || 0) >= 0;

          return (
            <div key={coin.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/40 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
                  style={{ background: coin.color }}>
                  {coin.emoji}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{coin.id}</p>
                  <p className="text-slate-500 text-[10px]">{coin.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold transition-colors duration-300 ${data?.tick === 'up' ? 'text-green-300' : data?.tick === 'down' ? 'text-red-300' : 'text-white'}`}>
                  {data?.price ? formatIDR(data.price) : '—'}
                </p>
                <div className="flex items-center justify-end gap-0.5">
                  {change !== undefined && (isUp ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />)}
                  <p className={`text-[11px] font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {change !== undefined ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '—'}
                  </p>
                </div>
                {data?.price && <p className="text-slate-600 text-[10px]">${data.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}