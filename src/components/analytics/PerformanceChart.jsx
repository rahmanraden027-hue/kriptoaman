import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PerformanceChart({ trades, period }) {
  // Prepare data for different chart types
  const getChartData = () => {
    if (!trades || trades.length === 0) return { timeline: [], status: [] };

    // Timeline data (daily/weekly/monthly)
    const timelineMap = {};
    trades.forEach(trade => {
      const date = new Date(trade.executedDate);
      let key;
      
      if (period === 'daily') {
        key = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      } else if (period === 'weekly') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Week ${weekNum}`;
      } else {
        key = date.toLocaleDateString('id-ID', { month: 'short' });
      }

      if (!timelineMap[key]) {
        timelineMap[key] = { name: key, profit: 0, loss: 0, count: 0 };
      }
      
      if (trade.profitLoss >= 0) {
        timelineMap[key].profit += trade.profitLoss;
      } else {
        timelineMap[key].loss += Math.abs(trade.profitLoss);
      }
      timelineMap[key].count += 1;
    });

    const timeline = Object.values(timelineMap);

    // Status data
    const statusData = [
      {
        name: 'Executed',
        value: trades.filter(t => t.status === 'executed').length,
        fill: '#22c55e'
      },
      {
        name: 'Failed',
        value: trades.filter(t => t.status === 'failed').length,
        fill: '#ef4444'
      },
      {
        name: 'Cancelled',
        value: trades.filter(t => t.status === 'cancelled').length,
        fill: '#f97316'
      }
    ];

    return { timeline, status: statusData };
  };

  const data = getChartData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Timeline Chart */}
      <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
        <h3 className="text-white font-bold mb-6">Profit/Loss Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[8, 8, 0, 0]} />
            <Bar dataKey="loss" name="Loss" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
        <h3 className="text-white font-bold mb-6">Trade Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.status}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.status.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}