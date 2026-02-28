import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, PieChart as PieChartIcon, DollarSign, Zap, ArrowLeftRight } from 'lucide-react';

// ── Load data from localStorage ───────────────────────────────────────────────
const TX_KEY = 'app_tx_history';
const SAVINGS_KEY = 'usdt_savings_positions';

const SAVINGS_PROTOCOLS_APY = {
  aave: 5.82, compound: 4.91, curve: 7.24, yearn: 8.15,
  beefy: 9.38, marinade: 7.92, kamino: 11.4, save: 6.15,
};

function loadTx() { try { return JSON.parse(localStorage.getItem(TX_KEY)) || []; } catch { return []; } }
function loadPositions() { try { return JSON.parse(localStorage.getItem(SAVINGS_KEY)) || []; } catch { return []; } }

function generateHistoryChart(txs, positions) {
  // Build 30-day cumulative net value from deposits/withdrawals
  const days = 30;
  const now = Date.now();
  const data = [];

  for (let i = days; i >= 0; i--) {
    const dayTs = now - i * 86400000;
    const dayStr = new Date(dayTs).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

    // Sum all deposit/withdraw up to this day
    let net = 0;
    txs.forEach(tx => {
      if (new Date(tx.date).getTime() > dayTs) return;
      if (tx.type === 'deposit' && tx.status === 'success') net += (tx.amount || 0);
      if (tx.type === 'withdraw' && tx.status === 'success') net -= (tx.amount || 0);
    });

    // Add swap value estimate (toAmount for successful swaps up to this day)
    let swapVol = 0;
    txs.forEach(tx => {
      if (new Date(tx.date).getTime() > dayTs) return;
      if (tx.type === 'swap' && tx.status === 'success') swapVol += (tx.toAmount || 0);
    });

    data.push({ date: dayStr, savings: parseFloat(net.toFixed(2)), swaps: parseFloat(swapVol.toFixed(2)) });
  }
  return data;
}

function generateAssetAllocation(txs, positions) {
  // Aggregate by protocol
  const map = {};
  positions.forEach(pos => {
    const name = pos.protocol?.name || 'Unknown';
    map[name] = (map[name] || 0) + pos.amount;
  });
  // Also include withdrawn protocols
  txs.filter(t => t.type === 'withdraw' && t.status === 'success').forEach(t => {
    if (!map[t.protocol]) return; // only if still active
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
  return Object.entries(map).map(([name, value], i) => ({
    name, value, pct: total > 0 ? ((value / total) * 100).toFixed(1) : 0,
    color: colors[i % colors.length],
  }));
}

// ── Tooltip custom ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'savings' ? 'Savings' : 'Swap Vol'}: ${p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const CHART_MODES = [
  { id: 'history', label: 'Historis', icon: TrendingUp },
  { id: 'allocation', label: 'Alokasi', icon: PieChartIcon },
  { id: 'compare', label: 'Protokol', icon: BarChart2 },
];

export default function PortfolioAnalytics() {
  const [txs, setTxs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [mode, setMode] = useState('history');
  const [range, setRange] = useState(7);

  useEffect(() => {
    setTxs(loadTx());
    setPositions(loadPositions());
  }, []);

  const historyData = useMemo(() => generateHistoryChart(txs, positions), [txs, positions]);
  const slicedHistory = historyData.slice(-(range + 1));

  const allocationData = useMemo(() => generateAssetAllocation(txs, positions), [txs, positions]);

  // Per-protocol compare data (active positions)
  const compareData = useMemo(() => {
    return positions.map(pos => {
      const proto = pos.protocol || {};
      const apy = SAVINGS_PROTOCOLS_APY[proto.id] || proto.apy || 0;
      const days = Math.max(1, Math.floor((Date.now() - new Date(pos.date).getTime()) / 86400000));
      const earned = parseFloat((pos.amount * apy / 100 / 365 * days).toFixed(4));
      const roi = pos.amount > 0 ? ((earned / pos.amount) * 100).toFixed(3) : '0';
      return { name: proto.name || 'Unknown', principal: pos.amount, earned, roi: parseFloat(roi), apy };
    });
  }, [positions]);

  // Summary stats
  const totalDeposited = txs.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + (t.amount || 0), 0);
  const totalWithdrawn = txs.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + (t.amount || 0), 0);
  const totalSwapVol = txs.filter(t => t.type === 'swap' && t.status === 'success').reduce((s, t) => s + (parseFloat(t.toAmount) || 0), 0);
  const activeValue = positions.reduce((s, p) => {
    const apy = SAVINGS_PROTOCOLS_APY[p.protocol?.id] || p.protocol?.apy || 0;
    const days = Math.max(1, Math.floor((Date.now() - new Date(p.date).getTime()) / 86400000));
    const earned = p.amount * apy / 100 / 365 * days;
    return s + p.amount + earned;
  }, 0);
  const totalEarned = activeValue - positions.reduce((s, p) => s + p.amount, 0);
  const roiPct = totalDeposited > 0 ? ((totalEarned / totalDeposited) * 100).toFixed(3) : '0';
  const isPositive = parseFloat(roiPct) >= 0;

  if (txs.length === 0 && positions.length === 0) return null;

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span className="text-white font-semibold text-sm">Analytics Portofolio</span>
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${isPositive ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          ROI {roiPct}%
        </span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Aktif', value: `$${activeValue.toFixed(2)}`, icon: DollarSign, color: 'text-indigo-400' },
          { label: 'Reward', value: `+$${totalEarned.toFixed(4)}`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Vol Swap', value: `$${(totalSwapVol / 1000).toFixed(1)}K`, icon: ArrowLeftRight, color: 'text-blue-400' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-900/60 rounded-xl p-2.5 text-center">
              <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${k.color}`} />
              <div className={`text-xs font-bold ${k.color}`}>{k.value}</div>
              <div className="text-slate-500 text-[10px]">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1.5">
        {CHART_MODES.map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${mode === m.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}>
              <Icon className="w-3 h-3" />{m.label}
            </button>
          );
        })}
      </div>

      {/* Chart: History */}
      {mode === 'history' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 justify-end">
            {[7, 14, 30].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${range === r ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {r}H
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={slicedHistory} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSwp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} fill="url(#gSav)" />
              <Area type="monotone" dataKey="swaps" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gSwp)" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center text-[10px]">
            <span className="flex items-center gap-1 text-indigo-400"><span className="w-3 h-0.5 bg-indigo-400 rounded inline-block" />Savings</span>
            <span className="flex items-center gap-1 text-blue-400"><span className="w-3 h-0.5 bg-blue-400 rounded inline-block" style={{borderTop:'2px dashed #3b82f6'}} />Vol Swap</span>
          </div>
        </div>
      )}

      {/* Chart: Allocation */}
      {mode === 'allocation' && (
        allocationData.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-xs">Belum ada posisi aktif</div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
                  {allocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {allocationData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-300 text-xs">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-xs font-semibold">{d.pct}%</div>
                    <div className="text-slate-500 text-[10px]">${d.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Chart: Compare protocols */}
      {mode === 'compare' && (
        compareData.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-xs">Belum ada posisi aktif untuk dibandingkan</div>
        ) : (
          <div className="space-y-2">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={compareData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barGap={2}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }}
                  formatter={(v, name) => [`$${v}`, name === 'principal' ? 'Pokok' : 'Reward']}
                />
                <Bar dataKey="principal" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earned" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {compareData.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
                  <span className="text-slate-300 text-xs font-medium">{d.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-indigo-400">${d.principal.toLocaleString()}</span>
                    <span className="text-green-400">+${d.earned}</span>
                    <span className="text-yellow-400 font-bold">{d.apy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}