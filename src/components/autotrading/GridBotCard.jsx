import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Play, Square, RefreshCw, Trash2, TrendingUp, TrendingDown,
  Grid3X3, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

const EXCHANGE_LOGOS = { binance: '🟡', bybit: '🟠', okx: '⚫' };

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
      <p className="text-slate-500 text-[10px] font-semibold uppercase">{label}</p>
      <p className="text-white font-bold text-base mt-0.5">{value}</p>
      {sub && <p className="text-slate-500 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function GridBotCard({ bot, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const profit = bot.stats?.totalProfit || 0;
  const profitPct = bot.stats?.profitPercent || 0;
  const totalTrades = bot.stats?.totalTrades || 0;
  const runningHours = bot.stats?.runningHours || 0;

  const handleStart = async () => {
    setLoading(true);
    await base44.functions.invoke('gridTradingExecute', { action: 'start', botId: bot.id });
    onUpdate();
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    await base44.functions.invoke('gridTradingExecute', { action: 'stop', botId: bot.id });
    onUpdate();
    setLoading(false);
  };

  const handleStatus = async () => {
    setStatusLoading(true);
    await base44.functions.invoke('gridTradingExecute', { action: 'status', botId: bot.id });
    onUpdate();
    setStatusLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Hapus bot ini?')) return;
    if (bot.isActive) await base44.functions.invoke('gridTradingExecute', { action: 'stop', botId: bot.id });
    await base44.entities.GridTradingBot.delete(bot.id);
    onDelete();
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bot.isActive ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/50 border border-slate-600/30'}`}>
              <Grid3X3 className={`w-5 h-5 ${bot.isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{bot.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${bot.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                  {bot.isActive ? '● AKTIF' : '○ BERHENTI'}
                </span>
              </div>
              <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                <span>{EXCHANGE_LOGOS[bot.exchange]}</span>
                <span className="font-mono font-semibold text-slate-300">{bot.symbol}</span>
                <span>·</span>
                <span className="capitalize">{bot.mode}</span>
                <span>·</span>
                <span>{bot.gridCount} grid</span>
              </div>
            </div>
          </div>
          {/* P/L */}
          <div className="text-right">
            <div className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
            </div>
            <div className={`text-xs ${profitPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Price Range Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Bawah: ${bot.lowerPrice?.toLocaleString()}</span>
            <span>Atas: ${bot.upperPrice?.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Modal" value={`$${bot.totalInvestment?.toLocaleString()}`} />
          <StatBox label="Trades" value={totalTrades} />
          <StatBox label="Berjalan" value={`${runningHours.toFixed(1)}j`} />
        </div>

        {/* Error */}
        {bot.errorMessage && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 mt-3">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs">{bot.errorMessage}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {bot.isActive ? (
            <>
              <button onClick={handleStop} disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-semibold transition-all disabled:opacity-50">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Square className="w-4 h-4" /> Stop</>}
              </button>
              <button onClick={handleStatus} disabled={statusLoading}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-all">
                <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
              </button>
            </>
          ) : (
            <button onClick={handleStart} disabled={loading || !bot.cexConnectionId}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-sm font-semibold transition-all disabled:opacity-50">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Jalankan</>}
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-all">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={handleDelete}
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-red-500/20 text-slate-500 hover:text-red-400 text-sm transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded: Active Orders */}
      {expanded && bot.activeOrders?.length > 0 && (
        <div className="border-t border-slate-700/30 p-4">
          <p className="text-slate-400 text-xs font-semibold mb-2">ORDER AKTIF ({bot.activeOrders.length})</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {bot.activeOrders.slice(0, 20).map((order, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {order.side === 'BUY'
                    ? <TrendingDown className="w-3 h-3 text-green-400" />
                    : <TrendingUp className="w-3 h-3 text-red-400" />}
                  <span className={order.side === 'BUY' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                    {order.side}
                  </span>
                  <span className="text-slate-300 font-mono">${order.price?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{order.quantity?.toFixed(6)}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    order.status === 'FILLED' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'SIMULATED' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}