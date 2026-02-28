import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle, Zap } from 'lucide-react';

export default function AnalyticsDashboard({ simulation }) {
  const stats = simulation.statistics;
  const trades = simulation.trades || [];

  // Calculate Sortino Ratio
  const sortinoRatio = useMemo(() => {
    if (simulation.equityData.length < 2) return 0;
    
    const returns = simulation.equityData.slice(1).map((eq, i) => {
      const prev = simulation.equityData[i];
      return (eq.equity - prev.equity) / prev.equity;
    });

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const downside = returns
      .filter(r => r < 0)
      .reduce((sum, r) => sum + Math.pow(r, 2), 0);
    const downsideDeviation = Math.sqrt(downside / returns.length);
    
    return downsideDeviation > 0 ? (avgReturn * 252) / downsideDeviation : 0;
  }, [simulation]);

  // Trade distribution data
  const tradeDistribution = useMemo(() => {
    const wins = trades.filter(t => t.profitLoss > 0).length;
    const losses = trades.filter(t => t.profitLoss < 0).length;
    const breakeven = trades.filter(t => t.profitLoss === 0).length;

    return [
      { name: 'Winning', value: wins, fill: '#10b981' },
      { name: 'Losing', value: losses, fill: '#ef4444' },
      { name: 'Breakeven', value: breakeven, fill: '#6b7280' }
    ].filter(d => d.value > 0);
  }, [trades]);

  // P&L distribution by bin
  const plDistribution = useMemo(() => {
    if (trades.length === 0) return [];
    
    const min = Math.floor(Math.min(...trades.map(t => t.profitLoss)) / 100) * 100;
    const max = Math.ceil(Math.max(...trades.map(t => t.profitLoss)) / 100) * 100;
    const binSize = (max - min) / 10 || 1;

    const bins = {};
    for (let i = 0; i < 10; i++) {
      const binStart = min + i * binSize;
      bins[`$${binStart.toFixed(0)}`] = 0;
    }

    trades.forEach(t => {
      const binIndex = Math.min(Math.floor((t.profitLoss - min) / binSize), 9);
      const binKey = Object.keys(bins)[binIndex];
      if (binKey) bins[binKey]++;
    });

    return Object.entries(bins).map(([label, count]) => ({
      label,
      count
    }));
  }, [trades]);

  // Drawdown data over time
  const drawdownData = useMemo(() => {
    if (simulation.equityData.length === 0) return [];

    let peak = simulation.equityData[0].equity;
    return simulation.equityData.map((data, i) => {
      if (data.equity > peak) peak = data.equity;
      const drawdown = ((peak - data.equity) / peak) * 100;
      return {
        date: data.date,
        drawdown: parseFloat(drawdown.toFixed(2))
      };
    });
  }, [simulation]);

  const MetricCard = ({ label, value, subtext, icon: Icon, color }) => (
    <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-700/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-2">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <Icon className={`w-5 h-5 ${color} opacity-40`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Sortino Ratio"
          value={sortinoRatio.toFixed(4)}
          subtext="Risk-adjusted (downside)"
          icon={TrendingUp}
          color="text-purple-400"
        />
        
        <MetricCard
          label="Max Drawdown $"
          value={`$${Math.abs((stats.maxDrawdown || 0)).toFixed(2)}`}
          subtext={`${stats.maxDrawdownPercent.toFixed(2)}%`}
          icon={AlertCircle}
          color="text-orange-400"
        />

        <MetricCard
          label="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          subtext="Wins/Losses ratio"
          icon={Zap}
          color={stats.profitFactor > 1.5 ? 'text-green-400' : stats.profitFactor > 1 ? 'text-blue-400' : 'text-red-400'}
        />

        <MetricCard
          label="Avg Win"
          value={`$${stats.avgWin.toFixed(2)}`}
          subtext={`Per ${stats.winningTrades} winning trades`}
          icon={TrendingUp}
          color="text-green-400"
        />

        <MetricCard
          label="Avg Loss"
          value={`$${Math.abs(stats.avgLoss).toFixed(2)}`}
          subtext={`Per ${stats.losingTrades} losing trades`}
          icon={TrendingDown}
          color="text-red-400"
        />

        <MetricCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtext={`${stats.winningTrades}W / ${stats.losingTrades}L`}
          icon={Target}
          color="text-blue-400"
        />
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Distribution Pie Chart */}
        {tradeDistribution.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Trade Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* P&L Distribution */}
        {plDistribution.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">P&L Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={plDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Drawdown Chart */}
      {drawdownData.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Drawdown Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={drawdownData.slice(0, 200)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line
                type="monotone"
                dataKey="drawdown"
                stroke="#f59e0b"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metrics Summary Table */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-700/40">
          <h3 className="text-sm font-bold text-white">Performance Metrics Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
          <div>
            <p className="text-xs text-slate-400">Total Return</p>
            <p className={`text-lg font-bold mt-1 ${stats.totalPLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalPLPercent.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Sharpe Ratio</p>
            <p className="text-lg font-bold text-purple-400 mt-1">{stats.sharpeRatio.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Sortino Ratio</p>
            <p className="text-lg font-bold text-purple-400 mt-1">{sortinoRatio.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Recovery Factor</p>
            <p className="text-lg font-bold text-blue-400 mt-1">
              {stats.maxDrawdown && stats.maxDrawdown !== 0
                ? (stats.totalPL / Math.abs(stats.maxDrawdown)).toFixed(2)
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Consecutive Wins</p>
            <p className="text-lg font-bold text-green-400 mt-1">
              {trades.length > 0 
                ? Math.max(...Array.from({ length: trades.length }, (_, i) => {
                    let count = 0;
                    for (let j = i; j < trades.length && trades[j].profitLoss > 0; j++) count++;
                    return count;
                  }), 0)
                : 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Consecutive Losses</p>
            <p className="text-lg font-bold text-red-400 mt-1">
              {trades.length > 0
                ? Math.max(...Array.from({ length: trades.length }, (_, i) => {
                    let count = 0;
                    for (let j = i; j < trades.length && trades[j].profitLoss < 0; j++) count++;
                    return count;
                  }), 0)
                : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}