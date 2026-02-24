import React, { useState, useEffect } from 'react';
import { getTransactionsByCoin, formatAmount, COINS } from './multiCoinApi';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, RefreshCw, Clock } from 'lucide-react';

export default function MultiCoinTxList({ coinId, address }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const data = await getTransactionsByCoin(coinId, address).catch(() => []);
    setTxs(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [coinId, address]);

  const coin = COINS[coinId];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Riwayat Transaksi</h2>
        <button onClick={load} disabled={refreshing} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {txs.map(tx => {
            const isReceived = tx.type === 'received';
            const displayAmt = formatAmount(coinId, Math.abs(tx.amount));
            const confirmed = tx.confirmations >= 1;
            return (
              <div key={tx.hash} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/30 rounded-xl p-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isReceived ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {isReceived
                    ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
                    : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{isReceived ? 'Diterima' : 'Dikirim'}</span>
                    <span className={`text-sm font-semibold ${isReceived ? 'text-green-400' : 'text-red-400'}`}>
                      {isReceived ? '+' : '-'}{displayAmt} {coin.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-slate-500 text-xs truncate max-w-[140px] font-mono">
                      {tx.counterparty ? tx.counterparty.slice(0, 16) + '…' : tx.hash.slice(0, 16) + '…'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${confirmed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {confirmed ? `${Math.min(tx.confirmations, 6)}/6` : 'pending'}
                      </span>
                      <a href={`${coin.explorerTx}${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}