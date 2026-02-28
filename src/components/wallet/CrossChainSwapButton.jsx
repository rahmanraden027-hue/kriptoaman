import React from 'react';
import { ArrowLeftRight, Zap, Shield } from 'lucide-react';

export default function CrossChainSwapButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-4 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center group-hover:bg-purple-600/50 transition-colors">
            <ArrowLeftRight className="w-5 h-5 text-purple-300" />
          </div>
          <div className="text-left">
            <div className="text-white font-semibold text-sm">Cross-Chain Swap</div>
            <div className="text-purple-300/70 text-xs">BTC ↔ ETH ↔ SOL ↔ BNB ↔ AVAX</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">
            <Shield className="w-2.5 h-2.5" /> Non-custodial
          </div>
          <div className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
            <Zap className="w-2.5 h-2.5" /> via THORChain
          </div>
        </div>
      </div>
    </button>
  );
}