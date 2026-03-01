import React from 'react';
import { TrendingUp } from 'lucide-react';

// Simulasi saldo admin yang dapat dilihat oleh semua pengguna
const ADMIN_BALANCES = {
  BTC: 15.75,
  ETH: 125.50,
  SOL: 5200.30,
  USDT: 850000,
};

const COIN_INFO = {
  BTC: { label: 'Bitcoin', color: '#F7931A', symbol: '₿' },
  ETH: { label: 'Ethereum', color: '#627EEA', symbol: 'Ξ' },
  SOL: { label: 'Solana', color: '#9945FF', symbol: '◎' },
  USDT: { label: 'USDT', color: '#26A17B', symbol: '₮' },
};

// Simulasi harga untuk menghitung total USD
const MOCK_PRICES = {
  BTC: 45000,
  ETH: 2500,
  SOL: 150,
  USDT: 1,
};

export default function AdminBalancePublic() {
  const totalUSD = Object.entries(ADMIN_BALANCES).reduce(
    (sum, [coin, amount]) => sum + (amount * (MOCK_PRICES[coin] || 0)),
    0
  );

  const coins = Object.entries(ADMIN_BALANCES)
    .sort(([, a], [, b]) => (b * (MOCK_PRICES[Object.keys(ADMIN_BALANCES)[Object.values(ADMIN_BALANCES).indexOf(b)] || 1) || 0) -
                              (a * (MOCK_PRICES[Object.keys(ADMIN_BALANCES)[Object.values(ADMIN_BALANCES).indexOf(a)] || 1) || 0)));

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-amber-600 flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
          <h3 className="text-white font-bold text-sm">Saldo Admin CoinVault</h3>
        </div>
        <span className="text-amber-400 text-[10px] bg-amber-500/20 px-2 py-1 rounded-full border border-amber-500/30">
          Publik
        </span>
      </div>

      {/* Total value */}
      <div className="bg-slate-900/50 border border-amber-600/30 rounded-xl p-3">
        <p className="text-slate-400 text-xs mb-1">Total Aset</p>
        <p className="text-white text-2xl font-bold">
          ${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </p>
        <p className="text-amber-400 text-[10px] mt-1">↑ 12.5% dalam 24 jam</p>
      </div>

      {/* Coin breakdown */}
      <div className="space-y-2">
        <p className="text-slate-400 text-xs font-semibold">Komposisi Aset</p>
        <div className="grid grid-cols-2 gap-2">
          {coins.map(([coin, amount]) => {
            const info = COIN_INFO[coin];
            const price = MOCK_PRICES[coin] || 0;
            const usdValue = amount * price;

            return (
              <div
                key={coin}
                className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3 hover:border-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: info.color }}
                  >
                    {info.symbol}
                  </div>
                  <span className="text-white text-xs font-semibold">{coin}</span>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs font-bold">
                    {amount.toLocaleString('en-US', {
                      maximumFractionDigits: coin === 'USDT' ? 0 : 4,
                    })}
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution chart */}
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3">
        <p className="text-slate-400 text-xs font-semibold mb-2">Distribusi</p>
        <div className="space-y-1">
          {coins.map(([coin, amount]) => {
            const price = MOCK_PRICES[coin] || 0;
            const usdValue = amount * price;
            const percentage = (usdValue / totalUSD) * 100;

            return (
              <div key={coin} className="flex items-center gap-2">
                <span className="text-slate-500 text-[10px] w-8">{coin}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      background: COIN_INFO[coin].color,
                    }}
                  />
                </div>
                <span className="text-slate-400 text-[10px] w-10 text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center pt-2 border-t border-slate-700/30">
        <p className="text-slate-500 text-[10px]">
          Update terakhir: Baru saja · Lihat detail di admin dashboard
        </p>
      </div>
    </div>
  );
}