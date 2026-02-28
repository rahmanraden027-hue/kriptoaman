import React from 'react';
import { Zap, CheckCircle2, XCircle } from 'lucide-react';

export default function StrategyOverviewCard({ active, inactive, total }) {
  const activePercent = total > 0 ? ((active / total) * 100).toFixed(0) : 0;

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">Strategy Status</h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-slate-400 mt-1">Total</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
          <p className="text-2xl font-bold text-green-400">{active}</p>
          <p className="text-xs text-slate-400 mt-1">Active</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/30">
          <p className="text-2xl font-bold text-red-400">{inactive}</p>
          <p className="text-xs text-slate-400 mt-1">Inactive</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-slate-400">Active Strategies</p>
          <p className="text-sm font-semibold text-green-400">{activePercent}%</p>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      {/* Status Details */}
      <div className="space-y-3 pt-4 border-t border-slate-700/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-300">Running</span>
          </div>
          <span className="text-sm font-semibold text-green-400">{active}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-slate-300">Paused</span>
          </div>
          <span className="text-sm font-semibold text-red-400">{inactive}</span>
        </div>
      </div>
    </div>
  );
}