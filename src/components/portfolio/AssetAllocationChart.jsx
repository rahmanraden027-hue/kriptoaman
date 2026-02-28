import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AssetAllocationChart({ breakdown }) {
  const chartData = useMemo(() => {
    return Object.entries(breakdown || {})
      .map(([asset, value]) => ({
        name: asset.charAt(0).toUpperCase() + asset.slice(1),
        value: parseFloat(value.toFixed(2)),
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [breakdown]);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-slate-400">No asset allocation data</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-6">Asset Allocation</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Asset Breakdown Table */}
      <div className="mt-6 space-y-2">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-slate-700/20 rounded">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-sm text-slate-300">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-white">${item.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}