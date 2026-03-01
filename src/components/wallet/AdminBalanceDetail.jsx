import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Simulasi saldo admin
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

const MOCK_PRICES = {
  BTC: 45000,
  ETH: 2500,
  SOL: 150,
  USDT: 1,
};

export default function AdminBalanceDetail() {
  const [expanded, setExpanded] = useState(true);

  // Hitung total dan persiapkan data untuk chart
  const assetData = Object.entries(ADMIN_BALANCES)
    .map(([coin, amount]) => {
      const price = MOCK_PRICES[coin] || 0;
      const usdValue = amount * price;
      return {
        coin,
        amount,
        price,
        usdValue,
        info: COIN_INFO[coin],
      };
    })
    .sort((a, b) => b.usdValue - a.usdValue);

  const totalUSD = assetData.reduce((sum, asset) => sum + asset.usdValue, 0);

  const chartData = assetData.map((asset) => ({
    name: asset.coin,
    value: asset.usdValue,
    color: asset.info.color,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalUSD) * 100).toFixed(1);
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2">
          <p className="text-white font-semibold text-sm">{data.name}</p>
          <p className="text-slate-300 text-xs">
            ${data.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-amber-400 text-xs font-semibold">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-amber-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">₿</span>
          </div>
          <h3 className="text-white font-bold text-sm">Detail Saldo Admin</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xs font-semibold">
            ${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50">
          {/* Pie Chart */}
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
            <p className="text-slate-400 text-xs font-semibold mb-3">Distribusi Aset</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detail Breakdown */}
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 space-y-3">
            <p className="text-slate-400 text-xs font-semibold">Breakdown Per Aset</p>
            {assetData.map((asset) => {
              const percentage = ((asset.usdValue / totalUSD) * 100).toFixed(1);
              return (
                <div key={asset.coin} className="space-y-1.5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: asset.info.color }}
                      >
                        {asset.info.symbol}
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">{asset.coin}</p>
                        <p className="text-slate-500 text-[10px]">{asset.info.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xs font-bold">
                        ${asset.usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-amber-400 text-[10px] font-semibold">{percentage}%</p>
                    </div>
                  </div>

                  {/* Amount + Price */}
                  <div className="flex justify-between text-[10px] text-slate-500 pl-7">
                    <span>
                      {asset.amount.toLocaleString('en-US', {
                        maximumFractionDigits: asset.coin === 'USDT' ? 0 : 4,
                      })}{' '}
                      {asset.coin}
                    </span>
                    <span>@ ${asset.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        background: asset.info.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3">
              <p className="text-slate-500 text-[10px] mb-1">Total Nilai</p>
              <p className="text-white text-sm font-bold">
                ${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3">
              <p className="text-slate-500 text-[10px] mb-1">Jumlah Aset</p>
              <p className="text-white text-sm font-bold">{assetData.length} Coin</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-slate-500 text-[10px] text-center py-2">
            Harga simulasi - untuk referensi saja
          </p>
        </div>
      )}
    </div>
  );
}