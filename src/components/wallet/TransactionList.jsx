import React, { useState, useEffect } from 'react';
import { getTransactions } from './bitcoinApi';
import { satoshiToBtc, truncateAddress } from './walletUtils';
import { ArrowUpRight, ArrowDownLeft, Clock, RefreshCw, ExternalLink } from 'lucide-react';

export default function TransactionList({ address }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTxs = async () => {
    setRefreshing(true);
    const txs = await getTransactions(address).catch(() => []);
    setTransactions(txs);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchTxs(); }, [address]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Riwayat Transaksi</h3>
        <button onClick={fetchTxs} disabled={refreshing} className="text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">Belum ada transaksi</p>
          <p className="text-slate-600 text-xs mt-1">Transaksi akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => {
            const isSent = tx.type === 'sent';
            const amountBtc = parseFloat(satoshiToBtc(Math.abs(tx.amount)));
            const isPending = tx.confirmations === 0;

            return (
              <div key={tx.hash} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 hover:bg-slate-800 transition-colors group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSent ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                  {isSent ? <ArrowUpRight className="w-5 h-5 text-red-400" /> : <ArrowDownLeft className="w-5 h-5 text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{isSent ? 'Terkirim' : 'Diterima'}</span>
                    {isPending && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">Pending</span>
                    )}
                    {!isPending && tx.confirmations < 6 && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">{tx.confirmations} conf</span>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs truncate">
                    {tx.counterparty ? truncateAddress(tx.counterparty, 8) : '—'}
                    {tx.date && ' · ' + new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                    {isSent ? '-' : '+'}{amountBtc.toFixed(8)}
                  </span>
                  <a href={`https://www.blockchain.com/explorer/transactions/btc/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                    className="text-slate-600 hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}