import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function PortfolioStats({ metrics }) {
  const totalPL = metrics.totalRealizedPL + metrics.totalUnrealizedPL;
  const plPercent = metrics.totalPortfolioValue > 0 
    ? ((totalPL / metrics.totalPortfolioValue) * 100).toFixed(2)
    : 0;

  const StatCard = ({ label, value, subvalue, icon: Icon, color }) => (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">${value.toFixed(2)}</p>
          {subvalue !== undefined && (
            <p className={`text-sm mt-2 font-semibold ${color === 'green' ? 'text-green-400' : 'text-red-400'}`}>
              {subvalue > 0 ? '+' : ''}{subvalue.toFixed(2)}
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-blue-400'}`} />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Portfolio Value"
        value={metrics.totalPortfolioValue}
        icon={Wallet}
        color="blue"
      />
      <StatCard
        label="Total P/L"
        value={totalPL}
        subvalue={plPercent}
        icon={totalPL >= 0 ? TrendingUp : TrendingDown}
        color={totalPL >= 0 ? 'green' : 'red'}
      />
      <StatCard
        label="Realized P/L"
        value={metrics.totalRealizedPL}
        icon={TrendingUp}
        color={metrics.totalRealizedPL >= 0 ? 'green' : 'red'}
      />
      <StatCard
        label="Unrealized P/L"
        value={metrics.totalUnrealizedPL}
        icon={TrendingDown}
        color={metrics.totalUnrealizedPL >= 0 ? 'green' : 'red'}
      />
    </div>
  );
}