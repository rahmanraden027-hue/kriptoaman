import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LivePerformanceDashboard({ strategy }) {
  const { data: allTrades = [], isLoading } = useQuery({
    queryKey: ['liveTradesPerformance', strategy.id],
    queryFn: async () => {
      const open = await base44.entities.LivePaperTrade.filter(
        { strategyId: strategy.id, status: 'open' },
        '-created_date'
      );
      const closed = await base44.entities.LivePaperTrade.filter(
        { strategyId: strategy.id, status: 'closed' },
        '-created_date'
      );
      return [...open, ...closed];
    },
    refetchInterval: 1000
  });

  const stats = useMemo(() => {
    const openTrades = allTrades.filter(t => t.status === 'open');
    const closedTrades = allTrades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.realizedPL >= 0).length;
    const losingTrades = closedTrades.filter(t => t.realizedPL < 0).length;
    
    const totalUnrealizedPL = openTrades.reduce((sum, t) => sum + (t.unrealizedPL || 0), 0);
    const totalRealizedPL = closedTrades.reduce((sum, t) => sum + (t.realizedPL || 0), 0);
    const totalPL = totalUnrealizedPL + totalRealizedPL;

    const winRate = closedTrades.length > 0 
      ? ((winningTrades / closedTrades.length) * 100).toFixed(2)
      : 0;

    // Equity curve
    const equityCurve = allTrades
      .sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime))
      .map((trade, idx) => ({
        time: new Date(trade.entryTime).toLocaleTimeString(),
        pl: allTrades.slice(0, idx + 1).reduce((sum, t) => {
          if (t.status === 'closed') return sum + (t.realizedPL || 0);
          return sum + (t.unrealizedPL || 0);
        }, 0)
      }));

    return {
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades,
      losingTrades,
      winRate,
      totalUnrealizedPL: totalUnrealizedPL.toFixed(2),
      totalRealizedPL: totalRealizedPL.toFixed(2),
      totalPL: totalPL.toFixed(2),
      equityCurve
    };
  }, [allTrades]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-700/40">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Open Trades</p>
            <p className="text-2xl font-bold text-white mt-2">{stats.openTrades}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-700/40">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Closed Trades</p>
            <p className="text-2xl font-bold text-white mt-2">{stats.closedTrades}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-700/40">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-white mt-2">{stats.winRate}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.winningTrades}W / {stats.losingTrades}L
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-700/40">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Total P/L</p>
            <p className={`text-2xl font-bold mt-2 ${parseFloat(stats.totalPL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${stats.totalPL}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P/L */}
      <Card className="bg-slate-800/60 border-slate-700/40">
        <CardHeader>
          <CardTitle className="text-white">P/L Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Unrealized P/L</p>
              <p className={`text-xl font-bold mt-2 ${parseFloat(stats.totalUnrealizedPL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${stats.totalUnrealizedPL}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Realized P/L</p>
              <p className={`text-xl font-bold mt-2 ${parseFloat(stats.totalRealizedPL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${stats.totalRealizedPL}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity Curve */}
      {stats.equityCurve.length > 0 && (
        <Card className="bg-slate-800/60 border-slate-700/40">
          <CardHeader>
            <CardTitle className="text-white">Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pl" 
                  stroke="#3b82f6" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}