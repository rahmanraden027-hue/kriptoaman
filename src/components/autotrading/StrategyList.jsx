import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Play, Pause, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StrategyList({ strategies, onStrategyUpdate, onStrategyDelete, onSelectStrategy }) {
  const [toggling, setToggling] = useState({});

  const handleToggleStrategy = async (strategyId, currentStatus) => {
    setToggling({ ...toggling, [strategyId]: true });

    await base44.entities.AutoTradingStrategy.update(strategyId, {
      isActive: !currentStatus
    });

    onStrategyUpdate(strategyId);
    setToggling({ ...toggling, [strategyId]: false });
  };

  const handleDeleteStrategy = async (strategyId) => {
    if (confirm('Hapus strategi ini?')) {
      await base44.entities.AutoTradingStrategy.delete(strategyId);
      onStrategyDelete(strategyId);
    }
  };

  if (!strategies || strategies.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-8 text-center">
        <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-slate-400 font-semibold mb-2">Belum ada strategi</h3>
        <p className="text-slate-500 text-sm">Buat strategi pertama Anda untuk memulai auto-trading</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {strategies.map((strategy) => (
        <div
          key={strategy.id}
          className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-4 space-y-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold">{strategy.name}</h3>
                {strategy.isActive ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/40">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400 font-semibold">Aktif</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/40 border border-slate-600/40">
                    <span className="text-xs text-slate-400 font-semibold">Inaktif</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {strategy.pair} • {strategy.chain} • Setiap {strategy.analysisInterval} menit
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleToggleStrategy(strategy.id, strategy.isActive)}
                disabled={toggling[strategy.id]}
                size="icon"
                variant={strategy.isActive ? 'outline' : 'default'}
                className={strategy.isActive ? 'bg-green-600/20 border-green-500/40' : ''}
              >
                {toggling[strategy.id] ? (
                  <Zap className="w-4 h-4 animate-spin" />
                ) : strategy.isActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={() => handleDeleteStrategy(strategy.id)}
                size="icon"
                variant="outline"
                className="text-red-400 hover:text-red-300 hover:border-red-500/40"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700/40">
            <div>
              <p className="text-xs text-slate-500">Total Trades</p>
              <p className="text-sm font-bold text-white mt-1">{strategy.stats?.totalTrades || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Win Rate</p>
              <p className="text-sm font-bold text-white mt-1">{(strategy.stats?.winRate || 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total P/L</p>
              <p className={`text-sm font-bold mt-1 ${(strategy.stats?.totalPL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${(strategy.stats?.totalPL || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Template</p>
              <p className="text-sm font-bold text-blue-400 mt-1 capitalize">{strategy.templateName}</p>
            </div>
          </div>

          {/* Risk Management Info */}
          {strategy.riskManagement && (
            <div className="bg-slate-900/40 rounded p-2">
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Risk Config:</span> {strategy.riskManagement.useATR ? 'ATR Based' : 'Fixed'} •
                Size: ${strategy.riskManagement.tradeSize}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}