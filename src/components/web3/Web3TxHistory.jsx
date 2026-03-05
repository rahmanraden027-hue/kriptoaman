import React, { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { Clock, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

export default function Web3TxHistory() {
  const { account, chainId, currentChain, isConnected } = useWeb3();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  const ETHERSCAN_APIS = {
    1: 'https://api.etherscan.io/api',
    56: 'https://api.bscscan.com/api',
    137: 'https://api.polygonscan.com/api',
    42161: 'https://api.arbiscan.io/api',
    8453: 'https://api.basescan.org/api',
    10: 'https://api-optimistic.etherscan.io/api',
  };

  const fetchTxHistory = async () => {
    if (!account || !chainId) return;
    setLoading(true);
    try {
      const apiUrl = ETHERSCAN_APIS[chainId];
      if (!apiUrl) { setLoading(false); return; }
      const res = await fetch(
        `${apiUrl}?module=account&action=txlist&address=${account}&startblock=0&endblock=99999999&sort=desc&apikey=YourApiKeyToken`
      );
      const data = await res.json();
      if (data.status === '1') setTxs(data.result.slice(0, 20));
      else setTxs([]);
    } catch {
      setTxs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTxHistory();
  }, [account, chainId]);

  if (!isConnected) return null;

  const formatVal = (val) => {
    try { return parseFloat(ethers.formatEther(val)).toFixed(6); } catch { return '0'; }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-white font-semibold text-sm">Riwayat Onchain</span>
        </div>
        <button onClick={fetchTxHistory} className={`text-slate-400 hover:text-white ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && txs.length === 0 && (
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <div className="text-slate-500 text-sm">Belum ada riwayat transaksi</div>
        </div>
      )}

      {!loading && txs.length > 0 && (
        <div className="space-y-2">
          {txs.map(tx => {
            const isOut = tx.from?.toLowerCase() === account?.toLowerCase();
            return (
              <a key={tx.hash}
                href={`${currentChain?.explorer}/tx/${tx.hash}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-2.5 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition-colors group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOut ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                  {isOut
                    ? <ArrowUpRight className="w-4 h-4 text-red-400" />
                    : <ArrowDownLeft className="w-4 h-4 text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold">{isOut ? 'Kirim' : 'Terima'}</div>
                  <div className="text-slate-400 text-xs font-mono truncate">
                    {isOut ? `ke: ${tx.to?.slice(0, 8)}...` : `dari: ${tx.from?.slice(0, 8)}...`}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${isOut ? 'text-red-400' : 'text-green-400'}`}>
                    {isOut ? '-' : '+'}{formatVal(tx.value)} {currentChain?.symbol}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {tx.isError === '1' ? '❌ Gagal' : '✅ Sukses'}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}