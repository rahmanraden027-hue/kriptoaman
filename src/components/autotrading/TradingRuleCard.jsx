import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, TrendingUp, TrendingDown, Activity, ChevronDown } from 'lucide-react';
import TradingRuleForm from './TradingRuleForm';

const SIGNAL_COLORS = {
  buy: 'bg-green-500/20 text-green-400 border-green-500/30',
  sell: 'bg-red-500/20 text-red-400 border-red-500/30',
  hold: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
  none: 'bg-slate-700/50 text-slate-500 border-slate-600/30',
};

export default function TradingRuleCard({ rule, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (active) => {
    setToggling(true);
    await base44.entities.TradingRule.update(rule.id, { isActive: active });
    setToggling(false);
    onRefresh?.();
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus strategi "${rule.name}"?`)) return;
    await base44.entities.TradingRule.delete(rule.id);
    onRefresh?.();
  };

  const stats = rule.stats || {};
  const snapshot = rule.lastIndicatorSnapshot || {};

  if (editing) {
    return <TradingRuleForm existingRule={rule} onSaved={() => { setEditing(false); onRefresh?.(); }} onCancel={() => setEditing(false)} />;
  }

  return (
    <div className={`bg-slate-800/40 border rounded-xl overflow-hidden transition-all ${rule.isActive ? 'border-blue-500/30' : 'border-slate-700/50'}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-bold text-sm truncate">{rule.name}</h3>
              <Badge className={`text-[10px] ${rule.mode === 'live' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600/30'}`}>
                {rule.mode === 'live' ? '💰 Live' : '📄 Paper'}
              </Badge>
              <Badge className="text-[10px] bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                {rule.pair}
              </Badge>
              {rule.lastSignal && rule.lastSignal !== 'none' && (
                <Badge className={`text-[10px] border ${SIGNAL_COLORS[rule.lastSignal]}`}>
                  {rule.lastSignal === 'buy' ? '▲ BUY' : rule.lastSignal === 'sell' ? '▼ SELL' : '— HOLD'}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 text-[10px] mt-1">
              {rule.lastCheckedAt ? `Terakhir cek: ${new Date(rule.lastCheckedAt).toLocaleString('id-ID')}` : 'Belum pernah dijalankan'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={rule.isActive} onCheckedChange={handleToggle} disabled={toggling} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center">
            <p className="text-slate-500 text-[10px]">Trades</p>
            <p className="text-white font-bold text-sm">{stats.totalTrades || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-[10px]">Win Rate</p>
            <p className={`font-bold text-sm ${(stats.winRate || 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.winRate || 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-[10px]">Total PnL</p>
            <p className={`font-bold text-sm ${(stats.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(stats.totalPnL || 0) >= 0 ? '+' : ''}{(stats.totalPnL || 0).toFixed(2)} USDT
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-[10px]">Per Trade</p>
            <p className="text-white font-bold text-sm">${rule.tradeAmount}</p>
          </div>
        </div>

        {/* Indicator snapshot */}
        {snapshot.rsi !== undefined && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {snapshot.rsi !== null && (
              <span className="text-[10px] bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-300">
                RSI: <span className={snapshot.rsi < 30 ? 'text-green-400' : snapshot.rsi > 70 ? 'text-red-400' : 'text-white'}>{snapshot.rsi}</span>
              </span>
            )}
            {snapshot.ema9 && (
              <span className="text-[10px] bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-300">
                EMA9: {snapshot.ema9?.toFixed(2)}
              </span>
            )}
            {snapshot.macd !== null && snapshot.macd !== undefined && (
              <span className="text-[10px] bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-300">
                MACD: <span className={snapshot.macd > 0 ? 'text-green-400' : 'text-red-400'}>{snapshot.macd?.toFixed(4)}</span>
              </span>
            )}
            {snapshot.price && (
              <span className="text-[10px] bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-300">
                Price: ${snapshot.price?.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pb-3">
        <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Sembunyikan' : 'Lihat rules'}
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}
            className="h-7 text-xs text-slate-400 hover:text-white">
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}
            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <Trash2 className="w-3 h-3 mr-1" /> Hapus
          </Button>
        </div>
      </div>

      {/* Expanded rules */}
      {expanded && (
        <div className="border-t border-slate-700/50 px-4 py-3 space-y-3">
          {(rule.entryRules || []).length > 0 && (
            <div>
              <p className="text-green-400 text-[10px] font-bold mb-1.5">🟢 ENTRY RULES</p>
              <div className="space-y-1">
                {rule.entryRules.map((r, i) => (
                  <p key={i} className="text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                    {i > 0 && <span className="text-blue-400 mr-1">{r.logic}</span>}
                    {r.indicator} {r.condition?.replace(/_/g, ' ')} {r.value}
                  </p>
                ))}
              </div>
            </div>
          )}
          {(rule.exitRules || []).length > 0 && (
            <div>
              <p className="text-red-400 text-[10px] font-bold mb-1.5">🔴 EXIT RULES</p>
              <div className="space-y-1">
                {rule.exitRules.map((r, i) => (
                  <p key={i} className="text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                    {i > 0 && <span className="text-blue-400 mr-1">{r.logic}</span>}
                    {r.indicator} {r.condition?.replace(/_/g, ' ')} {r.value}
                  </p>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500">
            SL: {rule.stopLossPercent}% · TP: {rule.takeProfitPercent}%
          </p>
        </div>
      )}
    </div>
  );
}