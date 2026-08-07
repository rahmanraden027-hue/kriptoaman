import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { fetchHistory } from './multiChainBalance';
import Skeleton from '../home/Skeleton';

export default function ChainHistoryModal({ chain, address, onClose }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setTxs(await fetchHistory(chain, address));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmtTime = (t) => t
    ? new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '--';

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="ka-surface w-full max-w-md p-5 ka-fade-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-base">{chain.name} · Riwayat</h3>
          <div className="flex items-center gap-2">
            <button onClick={load} className="ka-muted hover:text-ka-emerald tap-reset" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="ka-muted hover:text-white tap-reset"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <p className="ka-muted text-[10px] truncate mb-3 font-mono">{address}</p>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : txs.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="ka-muted text-xs">Tidak ada transaksi via API publik.</p>
            <a href={`${chain.explorer}${address}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 ka-chip text-xs font-bold text-ka-emerald tap-reset">
              <ExternalLink className="w-3.5 h-3.5" /> Lihat di Explorer
            </a>
          </div>
        ) : (
          <div className="space-y-1">
            {txs.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-ka-card/50 transition">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${t.type === 'in' ? 'bg-ka-emerald/15' : 'bg-[#e74c3c]/15'}`}>
                    {t.type === 'in' ? <ArrowDownLeft className="w-3.5 h-3.5 text-ka-emerald" /> : <ArrowUpRight className="w-3.5 h-3.5 text-[#e74c3c]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold capitalize">{t.type}</p>
                    <p className="ka-muted text-[10px] truncate max-w-[150px] font-mono">{t.hash}</p>
                  </div>
                </div>
                <div className="text-right">
                  {t.value != null && (
                    <p className={`text-xs font-bold ka-num ${t.value >= 0 ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
                      {t.value >= 0 ? '+' : ''}{t.value.toFixed(8)} {chain.symbol}
                    </p>
                  )}
                  <p className="ka-muted text-[10px]">{fmtTime(t.time)}</p>
                </div>
              </div>
            ))}
            <a href={`${chain.explorer}${address}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 mt-2 text-ka-emerald text-[11px] font-bold tap-reset">
              <ExternalLink className="w-3.5 h-3.5" /> Lihat semua di {chain.name} Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}