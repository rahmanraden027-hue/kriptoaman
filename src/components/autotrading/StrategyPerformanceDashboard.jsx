import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Activity, Target, ZapOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function StrategyPerformanceDashboard({ strategy }) {
  const [performanceData, setPerformanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);

        // Fetch recent trades/performance
        const trades = await base44.entities.TradePerformance.filter({
          dexOrderId: { $exists: true },
        }, '-executedDate', 50);

        // Group by date and calculate metrics
        const dateMap = {};
        trades.forEach((trade) => {
          const date = new Date(trade.executedDate).toLocaleDateString();
          if (!dateMap[date]) {
            dateMap[date] = { date, pl: 0, trades: 0, wins: 0 };
          }
          dateMap[date].pl += trade.profitLoss || 0;
          dateMap[date].trades += 1;
          if ((trade.profitLoss || 0) > 0) dateMap[date].wins += 1;
        });

        const data = Object.values(dateMap).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setPerformanceData(data);

        // Calculate stats
        const totalPL = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
        const winRate = trades.length > 0 ? ((trades.filter(t => (t.profitLoss || 0) > 0).length / trades.length) * 100) : 0;
        const avgTrade = trades.length > 0 ? totalPL / trades.length : 0;

        setStats({
          totalTrades: trades.length,
          totalPL,
          winRate,
          avgTrade,
          lastTrade: trades[0]?.executedDate,
        });
      } catch (error) {
        console.error('Error fetching performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
    const interval = setInterval(fetchPerformance, 10000);
    return () => clearInterval(interval);
  }, [strategy.id]);

  if (loading) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 text-center">
        <p className="text-slate-400">Memuat performa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Total Trades</p>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalTrades || 0}</p>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Total P/L</p>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className={`text-2xl font-bold ${(stats?.totalPL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${(stats?.totalPL || 0).toFixed(2)}
          </p>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Win Rate</p>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{(stats?.winRate || 0).toFixed(1)}%</p>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Avg Trade</p>
            <ZapOff className="w-4 h-4 text-yellow-400" />
          </div>
          <p className={`text-2xl font-bold ${(stats?.avgTrade || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${(stats?.avgTrade || 0).toFixed(2)}
          </p>
        </Card>
      </div>

      {/* P/L Trend Chart */}
      {performanceData.length > 0 && (
        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <p className="text-sm font-semibold text-white mb-4">P/L Trend</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorPL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="pl" stroke="#10b981" fillOpacity={1} fill="url(#colorPL)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Win/Loss Chart */}
      {performanceData.length > 0 && (
        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <p className="text-sm font-semibold text-white mb-4">Trades per Day</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="wins" stackId="a" fill="#10b981" />
              <Bar dataKey="trades" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Status */}
      <div className="text-xs text-slate-400 text-center">
        Last updated: {stats?.lastTrade ? new Date(stats.lastTrade).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}