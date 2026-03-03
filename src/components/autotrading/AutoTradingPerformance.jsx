import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AutoTradingPerformance({ userEmail }) {
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['tradingSignals', userEmail],
    queryFn: () => base44.entities.TradingSignal.filter({ userEmail, executed: true }, '-created_date', 100),
    enabled: !!userEmail,
  });

  const { data: closedPositions = [] } = useQuery({
    queryKey: ['closedPositions', userEmail],
    queryFn: () => base44.entities.OpenPosition.filter({ userEmail, status: 'closed' }, '-closedAt', 50),
    enabled: !!userEmail,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>;
  }

  // Build cumulative PnL chart data
  const cumulativePnL = [];
  let cumSum = 0;
  const sellSignals = closedPositions.sort((a, b) => new Date(a.closedAt) - new Date(b.closedAt));
  sellSignals.forEach(pos => {
    cumSum += pos.realizedPnL || 0;
    cumulativePnL.push({
      date: new Date(pos.closedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      pnl: parseFloat(cumSum.toFixed(4)),
      trade: pos.ruleName || pos.pair,
    });
  });

  // Bar chart by pair
  const pairStats = {};
  closedPositions.forEach(pos => {
    const key = pos.pair;
    if (!pairStats[key]) pairStats[key] = { pair: key, pnl: 0, trades: 0 };
    pairStats[key].pnl += pos.realizedPnL || 0;
    pairStats[key].trades += 1;
  });
  const pairData = Object.values(pairStats);

  const totalPnL = closedPositions.reduce((acc, p) => acc + (p.realizedPnL || 0), 0);
  const wins = closedPositions.filter(p => (p.realizedPnL || 0) > 0).length;
  const losses = closedPositions.filter(p => (p.realizedPnL || 0) <= 0).length;
  const winRate = closedPositions.length > 0 ? ((wins / closedPositions.length) * 100).toFixed(1) : 0;
  const avgPnL = closedPositions.length > 0 ? (totalPnL / closedPositions.length).toFixed(4) : 0;

  if (closedPositions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Belum ada trade yang selesai</p>
        <p className="text-slate-500 text-sm mt-1">Data performa akan muncul setelah bot mengeksekusi trade</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Total PnL</p>
          <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} <span className="text-xs">USDT</span>
          </p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Win Rate</p>
          <p className={`text-xl font-bold ${parseFloat(winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>{winRate}%</p>
          <p className="text-xs text-slate-500">{wins}W / {losses}L</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Total Trade</p>
          <p className="text-xl font-bold text-white">{closedPositions.length}</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Avg PnL/Trade</p>
          <p className={`text-xl font-bold ${parseFloat(avgPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {parseFloat(avgPnL) >= 0 ? '+' : ''}{avgPnL}
          </p>
        </div>
      </div>

      {/* Cumulative PnL chart */}
      {cumulativePnL.length > 1 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-4">Ekuitas Kumulatif (USDT)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={cumulativePnL}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 11 }} />
              <Area type="monotone" dataKey="pnl" stroke="#3b82f6" fill="url(#pnlGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* PnL by pair */}
      {pairData.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-4">PnL per Pair</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={pairData}>
              <XAxis dataKey="pair" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 11 }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {pairData.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent trades table */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <p className="text-white font-semibold text-sm">Riwayat Trade Terakhir</p>
        </div>
        <div className="divide-y divide-slate-700/30">
          {closedPositions.slice(0, 10).map(pos => (
            <div key={pos.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{pos.pair}</p>
                <p className="text-slate-500 text-xs">{pos.ruleName} · {pos.exitReason?.replace('_', ' ')}</p>
                <p className="text-slate-600 text-[10px]">{new Date(pos.closedAt).toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${(pos.realizedPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(pos.realizedPnL || 0) >= 0 ? '+' : ''}{(pos.realizedPnL || 0).toFixed(4)} USDT
                </p>
                <p className="text-slate-500 text-xs">
                  ${pos.entryPrice?.toFixed(2)} → ${pos.exitPrice?.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}