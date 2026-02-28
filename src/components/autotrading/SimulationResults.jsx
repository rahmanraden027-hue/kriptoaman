import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle, Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketNewsFeed from './MarketNewsFeed';

export default function SimulationResults({ simulation }) {
  const [chartType, setChartType] = useState('equity');
  const stats = simulation.statistics;
  const trades = simulation.trades || [];

  const getMetricColor = (value, isPercent = false) => {
    if (isPercent) {
      return value >= 0 ? 'text-green-400' : 'text-red-400';
    }
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  );

  const handleExportReport = () => {
    const report = `
=== LAPORAN SIMULASI PAPER TRADING ===
Nama Simulasi: ${simulation.simulationName}
Strategi: ${simulation.strategyName}
Tanggal: ${new Date(simulation.created_date).toLocaleDateString('id-ID')}

PARAMETER SIMULASI:
- Modal Awal: $${simulation.startingCapital.toLocaleString()}
- Durasi: ${simulation.simulationDays} hari
- Modal Akhir: $${stats.finalBalance.toLocaleString()}

STATISTIK KINERJA:
- Total Trades: ${stats.totalTrades}
- Winning Trades: ${stats.winningTrades}
- Losing Trades: ${stats.losingTrades}
- Win Rate: ${stats.winRate.toFixed(2)}%
- Total P/L: $${stats.totalPL.toFixed(2)} (${stats.totalPLPercent.toFixed(2)}%)
- Avg Win: $${stats.avgWin.toFixed(2)}
- Avg Loss: $${stats.avgLoss.toFixed(2)}
- Profit Factor: ${stats.profitFactor.toFixed(2)}
- Max Drawdown: ${stats.maxDrawdownPercent.toFixed(2)}%
- Sharpe Ratio: ${stats.sharpeRatio.toFixed(4)}

TRADES DETAIL:
${trades.map((t, i) => `
Trade ${i + 1}:
  Entry: $${t.entryPrice.toFixed(2)} @ ${t.entryTime}
  Exit: $${t.exitPrice.toFixed(2)} @ ${t.exitTime}
  Qty: ${t.quantity}
  P/L: $${t.profitLoss.toFixed(2)} (${t.profitLossPercent.toFixed(2)}%)
  Status: ${t.type.toUpperCase()}
`).join('\n')}
    `;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${simulation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total P/L"
          value={`$${stats.totalPL.toFixed(2)}`}
          icon={stats.totalPL >= 0 ? TrendingUp : TrendingDown}
          color={getMetricColor(stats.totalPL)}
        />
        <StatCard
          label="Return %"
          value={`${stats.totalPLPercent.toFixed(2)}%`}
          icon={stats.totalPLPercent >= 0 ? TrendingUp : TrendingDown}
          color={getMetricColor(stats.totalPLPercent, true)}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={Target}
          color="text-blue-400"
        />
        <StatCard
          label="Max Drawdown"
          value={`${stats.maxDrawdownPercent.toFixed(2)}%`}
          icon={AlertCircle}
          color="text-orange-400"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Total Trades</p>
          <p className="text-xl font-bold text-white">{stats.totalTrades}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.winningTrades} W / {stats.losingTrades} L</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Profit Factor</p>
          <p className="text-xl font-bold text-blue-400">{stats.profitFactor.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Avg Win/Loss Ratio</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Sharpe Ratio</p>
          <p className="text-xl font-bold text-purple-400">{stats.sharpeRatio.toFixed(4)}</p>
          <p className="text-xs text-slate-500 mt-1">Risk-Adjusted Return</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Final Balance</p>
          <p className="text-xl font-bold text-green-400">${stats.finalBalance.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">From ${simulation.startingCapital.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setChartType('equity')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              chartType === 'equity'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/40 text-slate-400 hover:bg-slate-700/60'
            }`}
          >
            Equity Curve
          </button>
          <button
            onClick={() => setChartType('trades')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              chartType === 'trades'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/40 text-slate-400 hover:bg-slate-700/60'
            }`}
          >
            Trade Results
          </button>
        </div>

        {chartType === 'equity' && simulation.equityData && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={simulation.equityData.slice(0, 200)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === 'trades' && trades.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trades.slice(0, 50)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey={(_, i) => `T${i + 1}`} stroke="#94a3b8" style={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="profitLoss" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Trades Table */}
      {trades.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/40">
            <h3 className="text-sm font-bold text-white">Trade History ({trades.length} trades)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40 bg-slate-900/40">
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold">#</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold">Entry</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold">Exit</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold">Qty</th>
                  <th className="px-4 py-2 text-right text-slate-400 font-semibold">P/L</th>
                  <th className="px-4 py-2 text-right text-slate-400 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 20).map((trade, i) => (
                  <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                    <td className="px-4 py-2 text-slate-300">{i + 1}</td>
                    <td className="px-4 py-2 text-slate-300">${trade.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-300">${trade.exitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-300">{parseFloat(trade.quantity).toFixed(4)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${trade.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.profitLoss.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold ${trade.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profitLossPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {trades.length > 20 && (
            <div className="px-4 py-2 text-xs text-slate-500 text-center">
              +{trades.length - 20} trades
            </div>
          )}
        </div>
      )}

      {/* Market News Feed */}
      <MarketNewsFeed 
        pair={simulation.strategyName.includes('/') ? simulation.strategyName : 'BTC/USDT'}
        symbol={simulation.strategyName.split('/')[0] || 'BTC'}
      />

      {/* Export Button */}
      <Button
        onClick={handleExportReport}
        variant="outline"
        className="w-full gap-2 border-slate-700 text-slate-400 hover:text-slate-200"
      >
        <Download className="w-4 h-4" />
        Export Laporan
      </Button>
    </div>
  );
}