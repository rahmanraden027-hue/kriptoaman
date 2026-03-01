import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function MonteCarloAnalytics({ monteCarloStats, startingCapital }) {
  if (!monteCarloStats) return null;

  const { returnDistribution = [], simulations } = monteCarloStats;

  const statCards = [
    { label: 'Best Case', value: `$${monteCarloStats.bestCase?.toFixed(0)}`, color: 'text-green-400' },
    { label: '95th %ile', value: `$${monteCarloStats.percentile95?.toFixed(0)}`, color: 'text-emerald-400' },
    { label: 'Median', value: `$${monteCarloStats.medianFinalBalance?.toFixed(0)}`, color: 'text-blue-400' },
    { label: '5th %ile', value: `$${monteCarloStats.percentile5?.toFixed(0)}`, color: 'text-orange-400' },
    { label: 'Worst Case', value: `$${monteCarloStats.worstCase?.toFixed(0)}`, color: 'text-red-400' },
    { label: 'Prob. of Profit', value: `${monteCarloStats.probabilityOfProfit?.toFixed(1)}%`, color: 'text-green-400' },
    { label: 'Prob. of Ruin', value: `${monteCarloStats.probabilityOfRuin?.toFixed(1)}%`, color: 'text-red-400' },
    { label: 'Avg Max Drawdown', value: `${monteCarloStats.avgMaxDrawdown?.toFixed(1)}%`, color: 'text-yellow-400' },
  ];

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">🎲 Monte Carlo Results</h3>
        <span className="text-xs text-slate-400">{simulations?.toLocaleString()} simulations</span>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Return Distribution Chart */}
      {returnDistribution.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-3">Return Distribution by Percentile</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={returnDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="percentile" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `P${v}`} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                formatter={(v, name) => [`${v?.toFixed(2)}%`, 'Return']}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <Bar dataKey="return" fill="#3b82f6" radius={[3, 3, 0, 0]}
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk Interpretation */}
      <div className={`rounded-lg p-3 text-xs border ${
        monteCarloStats.probabilityOfRuin > 20 ? 'bg-red-500/10 border-red-500/30 text-red-300' :
        monteCarloStats.probabilityOfProfit > 65 ? 'bg-green-500/10 border-green-500/30 text-green-300' :
        'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
      }`}>
        {monteCarloStats.probabilityOfRuin > 20
          ? `⚠️ High ruin risk (${monteCarloStats.probabilityOfRuin?.toFixed(1)}%). Strategy requires better risk controls.`
          : monteCarloStats.probabilityOfProfit > 65
          ? `✅ Strong strategy: ${monteCarloStats.probabilityOfProfit?.toFixed(1)}% of simulations ended in profit.`
          : `⚡ Moderate risk-reward. ${monteCarloStats.probabilityOfProfit?.toFixed(1)}% profitable simulations.`
        }
        {' '}Worst max drawdown across all paths: {monteCarloStats.worstDrawdown?.toFixed(1)}%.
      </div>
    </div>
  );
}