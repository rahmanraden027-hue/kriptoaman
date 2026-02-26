import React, { useState } from 'react';
import { loadTradeHistory } from './dexApi';
import { ArrowDownUp, ExternalLink, Clock, CheckCircle2, Trash2 } from 'lucide-react';

const PROTOCOL_LOGOS = { uniswap: '🦄', thorchain: '⚡', '1inch': '🔀' };

export default function DexTradeHistory({ onRefresh }) {
  const [history, setHistory] = useState(() => loadTradeHistory());

  const clearHistory = () => {
    localStorage.removeItem('dex_trade_history');
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <ArrowDownUp className="w-4 h-4 text-slate-600" />
        </div>
        <p className="text-slate-500 text-sm">Belum ada riwayat DEX trade</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Riwayat DEX Trade</h2>
        <button onClick={clearHistory} className="text-slate-600 hover:text-slate-400 flex items-center gap-1 text-xs">
          <Trash2 className="w-3 h-3" />
          Hapus
        </button>
      </div>
      <div className="space-y-2">
        {history.map(trade => (
          <div key={trade.id} className="bg-slate-800/50 border border-violet-500/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{PROTOCOL_LOGOS[trade.protocol] || '🔀'}</span>
                <span className="text-white text-sm font-medium">{trade.fromToken} → {trade.toToken}</span>
              </div>
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="space-y-0.5">
                <div>Dari: <span className="text-white">{trade.fromAmount.toFixed(6)} {trade.fromToken}</span> <span className="text-slate-500">(${trade.fromUSD?.toFixed(2)})</span></div>
                <div>Ke: <span className="text-violet-400">{trade.toAmount.toFixed(6)} {trade.toToken}</span> <span className="text-slate-500">(${trade.toUSD?.toFixed(2)})</span></div>
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {new Date(trade.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-yellow-500">Gas: ${trade.gasFee}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}