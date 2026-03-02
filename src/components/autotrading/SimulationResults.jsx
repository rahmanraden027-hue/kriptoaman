import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, AreaChart, Area, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle, Download, BarChart3, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnalyticsDashboard from './AnalyticsDashboard';
import MonteCarloAnalytics from './MonteCarloAnalytics';
import WalkForwardResults from './WalkForwardResults';

// ─── helpers ─────────────────────────────────────────────────────────────────
function calcSortino(trades, riskFreeRate = 0) {
  if (!trades || trades.length < 2) return 0;
  const returns = trades.map(t => t.profitLossPercent / 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downside = returns.filter(r => r < riskFreeRate);
  if (downside.length === 0) return 99;
  const downsideStd = Math.sqrt(downside.reduce((a, r) => a + Math.pow(r - riskFreeRate, 2), 0) / downside.length);
  return downsideStd === 0 ? 0 : (avgReturn - riskFreeRate) / downsideStd;
}

function calcMaxConsecutiveLosses(trades) {
  if (!trades || !trades.length) return 0;
  let max = 0, cur = 0;
  for (const t of trades) {
    if (t.profitLoss < 0) { cur++; max = Math.max(max, cur); } else cur = 0;
  }
  return max;
}

function calcMaxConsecutiveWins(trades) {
  if (!trades || !trades.length) return 0;
  let max = 0, cur = 0;
  for (const t of trades) {
    if (t.profitLoss >= 0) { cur++; max = Math.max(max, cur); } else cur = 0;
  }
  return max;
}

function calcCalmar(stats) {
  if (!stats.maxDrawdownPercent || stats.maxDrawdownPercent === 0) return 0;
  return (stats.totalPLPercent || 0) / Math.abs(stats.maxDrawdownPercent);
}

function buildDrawdownSeries(equityData, startingCapital) {
  if (!equityData || !equityData.length) return [];
  let peak = startingCapital;
  return equityData.map(d => {
    if (d.equity > peak) peak = d.equity;
    const dd = peak > 0 ? ((d.equity - peak) / peak) * 100 : 0;
    return { date: d.date, drawdown: parseFloat(dd.toFixed(2)) };
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, color = 'text-white' }) => (
  <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-3">
    <p className="text-xs text-slate-400 mb-1">{label}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
      ))}
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────
export default function SimulationResults({ simulation }) {
  const [chartView, setChartView] = useState('equity');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAllTrades, setShowAllTrades] = useState(false);

  const stats = simulation.statistics;
  const trades = simulation.trades || [];
  const equityData = simulation.equityData || [];

  const sortino = useMemo(() => stats.sortinoRatio ?? calcSortino(trades), [trades, stats]);
  const maxConsecLoss = useMemo(() => stats.maxConsecutiveLosses ?? calcMaxConsecutiveLosses(trades), [trades, stats]);
  const maxConsecWin = useMemo(() => stats.maxConsecutiveWins ?? calcMaxConsecutiveWins(trades), [trades, stats]);
  const calmar = useMemo(() => stats.calmarRatio ?? calcCalmar(stats), [stats]);
  const drawdownSeries = useMemo(() => buildDrawdownSeries(equityData, simulation.startingCapital), [equityData, simulation.startingCapital]);

  const tradeBarData = useMemo(() => trades.map((t, i) => ({
    name: `T${i + 1}`,
    pl: parseFloat(t.profitLoss.toFixed(2)),
    win: t.profitLoss >= 0,
  })), [trades]);

  const handleExport = () => {
    const lines = [
      `=== SIMULASI BACKTEST ===`,
      `Nama: ${simulation.simulationName}`,
      `Strategi: ${simulation.strategyName}`,
      `Tanggal: ${new Date(simulation.created_date).toLocaleDateString('id-ID')}`,
      ``,
      `PARAMETER:`,
      `Modal Awal: $${simulation.startingCapital}`,
      `Durasi: ${simulation.simulationDays} hari`,
      `Modal Akhir: $${stats.finalBalance}`,
      ``,
      `METRIK:`,
      `Total P/L: $${stats.totalPL?.toFixed(2)} (${stats.totalPLPercent?.toFixed(2)}%)`,
      `Win Rate: ${stats.winRate?.toFixed(2)}%`,
      `Total Trades: ${stats.totalTrades} (${stats.winningTrades}W / ${stats.losingTrades}L)`,
      `Profit Factor: ${stats.profitFactor?.toFixed(2)}`,
      `Sharpe Ratio: ${stats.sharpeRatio?.toFixed(4)}`,
      `Sortino Ratio: ${sortino.toFixed(4)}`,
      `Calmar Ratio: ${calmar.toFixed(4)}`,
      `Max Drawdown: ${stats.maxDrawdownPercent?.toFixed(2)}%`,
      `Max Consec. Losses: ${maxConsecLoss}`,
      `Max Consec. Wins: ${maxConsecWin}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backtest-${simulation.id}.txt`;
    document.body.appendChild(a); a.click();
    URL.revokeObjectURL(url); a.remove();
  };

  return (
    <div className="space-y-6">
      {/* ── Tier 1 stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total P/L" value={`$${stats.totalPL?.toFixed(2)}`} color={stats.totalPL >= 0 ? 'text-green-400' : 'text-red-400'} sub={`${stats.totalPLPercent >= 0 ? '+' : ''}${stats.totalPLPercent?.toFixed(2)}%`} />
        <MetricCard label="Win Rate" value={`${stats.winRate?.toFixed(1)}%`} color="text-blue-400" sub={`${stats.winningTrades}W / ${stats.losingTrades}L`} />
        <MetricCard label="Max Drawdown" value={`${stats.maxDrawdownPercent?.toFixed(2)}%`} color="text-orange-400" sub="Peak to trough" />
        <MetricCard label="Saldo Akhir" value={`$${stats.finalBalance?.toLocaleString()}`} color="text-green-400" sub={`Dari $${simulation.startingCapital?.toLocaleString()}`} />
      </div>

      {/* ── Tier 2 advanced metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Sharpe Ratio" value={stats.sharpeRatio?.toFixed(3) ?? '—'} color="text-purple-400" sub="Risk-adj. return" />
        <MetricCard label="Sortino Ratio" value={sortino.toFixed(3)} color="text-indigo-400" sub="Downside-adj." />
        <MetricCard label="Calmar Ratio" value={calmar.toFixed(3)} color="text-cyan-400" sub="Return / Max DD" />
        <MetricCard label="Profit Factor" value={stats.profitFactor?.toFixed(2) ?? '—'} color="text-yellow-400" sub="Gross W / Gross L" />
      </div>

      {/* ── Tier 3 streak metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Trades" value={stats.totalTrades} color="text-white" sub={`Avg Win $${stats.avgWin?.toFixed(2)}`} />
        <MetricCard label="Avg Loss" value={`$${stats.avgLoss?.toFixed(2)}`} color="text-red-400" sub="Per losing trade" />
        <MetricCard label="Max Consec. Wins" value={maxConsecWin} color="text-green-400" sub="Best streak" />
        <MetricCard label="Max Consec. Losses" value={maxConsecLoss} color="text-red-400" sub="Worst streak" />
      </div>

      {/* ── Charts ── */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
        {/* Chart tab switcher */}
        <div className="flex gap-1 flex-wrap mb-4">
          {[
            { key: 'equity', label: 'Equity Curve' },
            { key: 'drawdown', label: 'Drawdown' },
            { key: 'trades', label: 'Trade P/L' },
            { key: 'cumulative', label: 'Kumulatif' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setChartView(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartView === key ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Equity Curve */}
        {chartView === 'equity' && equityData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `$${v.toLocaleString()}`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={simulation.startingCapital} stroke="#64748b" strokeDasharray="4 4" label={{ value: 'Awal', fill: '#64748b', fontSize: 10 }} />
              <Area type="monotone" dataKey="equity" name="Equity" stroke="#3b82f6" fill="url(#equityGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Drawdown Chart */}
        {chartView === 'drawdown' && drawdownSeries.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={drawdownSeries}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}%`} />
              <Tooltip content={<CustomTooltip />} formatter={(v) => [`${v.toFixed(2)}%`, 'Drawdown']} />
              <ReferenceLine y={0} stroke="#475569" />
              <Area type="monotone" dataKey="drawdown" name="Drawdown %" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Trade P/L bars */}
        {chartView === 'trades' && tradeBarData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tradeBarData.slice(0, 80)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} formatter={(v) => [`$${v.toFixed(2)}`, 'P/L']} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="pl" name="P/L" radius={[2, 2, 0, 0]}>
                {tradeBarData.slice(0, 80).map((entry, i) => (
                  <Cell key={i} fill={entry.win ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Cumulative P/L */}
        {chartView === 'cumulative' && trades.length > 0 && (() => {
          let cum = 0;
          const data = trades.map((t, i) => ({ name: `T${i + 1}`, cumPL: parseFloat((cum += t.profitLoss).toFixed(2)) }));
          return (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} formatter={(v) => [`$${v.toFixed(2)}`, 'Kumulatif P/L']} />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="cumPL" name="Kumulatif P/L" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── Advanced Analytics toggle ── */}
      <Button onClick={() => setShowAnalytics(!showAnalytics)} variant="outline"
        className="gap-2 border-slate-700/40 text-slate-300 hover:text-slate-100">
        <BarChart3 className="w-4 h-4" />
        <ChevronDown className={`w-4 h-4 transition ${showAnalytics ? 'rotate-180' : ''}`} />
        {showAnalytics ? 'Sembunyikan' : 'Tampilkan'} Advanced Analytics
      </Button>

      {showAnalytics && (
        <>
          <AnalyticsDashboard simulation={simulation} />
          {simulation.monteCarloStats && (
            <MonteCarloAnalytics monteCarloStats={simulation.monteCarloStats} startingCapital={simulation.startingCapital} />
          )}
          {simulation.walkForwardResults && (
            <WalkForwardResults walkForwardResults={simulation.walkForwardResults} />
          )}
        </>
      )}

      {/* ── Trade History Table ── */}
      {trades.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Trade History ({trades.length} trades)</h3>
            <button onClick={() => setShowAllTrades(!showAllTrades)}
              className="text-xs text-blue-400 hover:text-blue-300">
              {showAllTrades ? 'Tampilkan sedikit' : `Lihat semua`}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40 bg-slate-900/40">
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold text-xs">#</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold text-xs">Entry</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold text-xs">Exit</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold text-xs">Qty</th>
                  <th className="px-4 py-2 text-right text-slate-400 font-semibold text-xs">P/L</th>
                  <th className="px-4 py-2 text-right text-slate-400 font-semibold text-xs">%</th>
                </tr>
              </thead>
              <tbody>
                {(showAllTrades ? trades : trades.slice(0, 20)).map((trade, i) => (
                  <tr key={i} className={`border-b border-slate-700/20 hover:bg-slate-700/20 ${trade.profitLoss >= 0 ? '' : 'bg-red-500/5'}`}>
                    <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2 text-slate-300 text-xs">${trade.entryPrice?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-300 text-xs">${trade.exitPrice?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-300 text-xs">{parseFloat(trade.quantity).toFixed(4)}</td>
                    <td className={`px-4 py-2 text-right font-semibold text-xs ${trade.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.profitLoss?.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold text-xs ${trade.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profitLossPercent?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAllTrades && trades.length > 20 && (
            <div className="px-4 py-2 text-xs text-slate-500 text-center border-t border-slate-700/20">
              +{trades.length - 20} trades tersembunyi
            </div>
          )}
        </div>
      )}

      {/* Export */}
      <Button onClick={handleExport} variant="outline" className="w-full gap-2 border-slate-700 text-slate-400 hover:text-slate-200">
        <Download className="w-4 h-4" /> Export Laporan
      </Button>
    </div>
  );
}