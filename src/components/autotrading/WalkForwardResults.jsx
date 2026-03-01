import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function WalkForwardResults({ walkForwardResults }) {
  if (!walkForwardResults || !walkForwardResults.windows?.length) return null;

  const { windows, totalWindows, passedWindows, consistencyScore, avgOutSampleReturn, avgEfficiency } = walkForwardResults;

  const chartData = windows.map(w => ({
    window: `W${w.window}`,
    inSample: parseFloat(w.inSample.return?.toFixed(2)),
    outSample: parseFloat(w.outSample.return?.toFixed(2)),
    efficiency: parseFloat(w.efficiency?.toFixed(0)),
  }));

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">🔄 Walk-Forward Optimization</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${consistencyScore >= 60 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {consistencyScore?.toFixed(0)}% Consistent
        </span>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
          <p className="text-xs text-slate-400 mb-1">Total Windows</p>
          <p className="text-lg font-bold text-white">{totalWindows}</p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
          <p className="text-xs text-slate-400 mb-1">Passed Windows</p>
          <p className="text-lg font-bold text-green-400">{passedWindows} / {totalWindows}</p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
          <p className="text-xs text-slate-400 mb-1">Avg Out-Sample Return</p>
          <p className={`text-lg font-bold ${avgOutSampleReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {avgOutSampleReturn?.toFixed(2)}%
          </p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
          <p className="text-xs text-slate-400 mb-1">Avg Efficiency</p>
          <p className="text-lg font-bold text-blue-400">{avgEfficiency?.toFixed(0)}%</p>
          <p className="text-xs text-slate-500">Out/In-Sample ratio</p>
        </div>
      </div>

      {/* In-Sample vs Out-Sample chart */}
      <div>
        <p className="text-xs text-slate-400 mb-3">In-Sample vs Out-of-Sample Returns per Window</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="window" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
              formatter={(v, name) => [`${v?.toFixed(2)}%`, name === 'inSample' ? 'In-Sample' : 'Out-of-Sample']}
            />
            <Legend formatter={v => v === 'inSample' ? 'In-Sample' : 'Out-of-Sample'} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
            <Bar dataKey="inSample" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="outSample" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Window table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className="px-3 py-2 text-left text-slate-400">Window</th>
              <th className="px-3 py-2 text-right text-slate-400">In-Sample Return</th>
              <th className="px-3 py-2 text-right text-slate-400">Out-Sample Return</th>
              <th className="px-3 py-2 text-right text-slate-400">Win Rate (out)</th>
              <th className="px-3 py-2 text-right text-slate-400">Efficiency</th>
              <th className="px-3 py-2 text-center text-slate-400">Pass</th>
            </tr>
          </thead>
          <tbody>
            {windows.map(w => (
              <tr key={w.window} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                <td className="px-3 py-2 text-slate-300">W{w.window}</td>
                <td className={`px-3 py-2 text-right font-semibold ${w.inSample.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {w.inSample.return?.toFixed(2)}%
                </td>
                <td className={`px-3 py-2 text-right font-semibold ${w.outSample.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {w.outSample.return?.toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-right text-slate-300">{w.outSample.winRate?.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right text-blue-400">{w.efficiency?.toFixed(0)}%</td>
                <td className="px-3 py-2 text-center">
                  {w.outSample.return >= 0
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                    : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`rounded-lg p-3 text-xs border ${
        consistencyScore >= 70 ? 'bg-green-500/10 border-green-500/30 text-green-300' :
        consistencyScore >= 50 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
        'bg-red-500/10 border-red-500/30 text-red-300'
      }`}>
        {consistencyScore >= 70
          ? `✅ Strategy is consistent: profitable in ${passedWindows}/${totalWindows} out-of-sample windows. Likely robust.`
          : consistencyScore >= 50
          ? `⚡ Strategy is moderately consistent. Review losing windows for parameter sensitivity.`
          : `⚠️ Strategy is over-fitted: only ${passedWindows}/${totalWindows} out-of-sample windows profitable. Needs refinement.`}
      </div>
    </div>
  );
}