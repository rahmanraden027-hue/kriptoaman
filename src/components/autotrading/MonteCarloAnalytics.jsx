import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonteCarloAnalytics({ monteCarloStats }) {
  if (!monteCarloStats) return null;

  const confidenceData = [
    { level: '5th %ile', value: monteCarloStats.percentile5, color: '#ef4444' },
    { level: 'Mean', value: monteCarloStats.avgFinalBalance, color: '#3b82f6' },
    { level: '95th %ile', value: monteCarloStats.percentile95, color: '#10b981' }
  ];

  const drawdownData = [
    { scenario: 'Worst', balance: monteCarloStats.worstCase, color: '#ef4444' },
    { scenario: 'Base', balance: monteCarloStats.avgFinalBalance, color: '#3b82f6' },
    { scenario: 'Best', balance: monteCarloStats.bestCase, color: '#10b981' }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Monte Carlo Results ({monteCarloStats.simulations} simulations)</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
            <p className="text-xs text-slate-400 mb-1">Best Case</p>
            <p className="text-lg font-bold text-green-400">${monteCarloStats.bestCase.toFixed(0)}</p>
          </div>
          
          <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
            <p className="text-xs text-slate-400 mb-1">Mean</p>
            <p className="text-lg font-bold text-blue-400">${monteCarloStats.avgFinalBalance.toFixed(0)}</p>
          </div>
          
          <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
            <p className="text-xs text-slate-400 mb-1">95% Confidence</p>
            <p className="text-lg font-bold text-purple-400">${monteCarloStats.percentile95.toFixed(0)}</p>
          </div>
          
          <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
            <p className="text-xs text-slate-400 mb-1">Worst Case</p>
            <p className="text-lg font-bold text-red-400">${monteCarloStats.worstCase.toFixed(0)}</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          📊 <span className="font-semibold">Interpretation:</span> With {monteCarloStats.simulations} random trade permutations, 
          the strategy had a 95% chance of achieving at least ${monteCarloStats.percentile95.toFixed(0)}.
        </p>
      </div>
    </div>
  );
}