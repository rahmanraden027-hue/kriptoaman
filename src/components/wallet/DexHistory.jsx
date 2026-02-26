import React, { useState, useEffect } from 'react';
import { loadSwapHistory } from './dexApi';
import { ArrowUpDown, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { TOKENS } from './dexApi';
import { formatDistanceToNow } from 'date-fns';

export default function DexHistory({ refreshTrigger }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadSwapHistory());
  }, [refreshTrigger]);

  if (history.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <ArrowUpDown className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-slate-500 text-sm">Belum ada riwayat swap</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map(swap => {
        const fromToken = TOKENS[swap.fromSymbol];
        const toToken = TOKENS[swap.toSymbol];
        const isCrossChain = fromToken?.chain !== toToken?.chain;
        return (
          <div key={swap.id} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/30 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
              {isCrossChain
                ? <Zap className="w-4 h-4 text-orange-400" />
                : <ArrowUpDown className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {swap.fromAmount} {swap.fromSymbol} → {swap.toAmount?.toFixed(4)} {swap.toSymbol}
                </span>
                <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">✓ sim</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-slate-500 text-xs">{isCrossChain ? 'THORChain' : 'Uniswap v3'} · gas ~${swap.gasFeeUSD?.toFixed(2)}</span>
                <span className="text-slate-600 text-xs">
                  {swap.timestamp ? formatDistanceToNow(new Date(swap.timestamp), { addSuffix: true }) : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}