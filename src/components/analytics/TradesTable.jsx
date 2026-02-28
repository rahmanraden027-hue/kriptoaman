import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function TradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-8 text-center">
        <div className="text-slate-400 text-sm">Belum ada data perdagangan</div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'executed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      executed: 'Berhasil',
      failed: 'Gagal',
      cancelled: 'Dibatalkan'
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 overflow-x-auto">
      <h3 className="text-white font-bold mb-4">Riwayat Perdagangan</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/40">
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Pair</th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Tipe</th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">Entry</th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">Exit</th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">P/L</th>
            <th className="text-center py-3 px-4 text-slate-400 font-medium">Status</th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, idx) => (
            <tr
              key={idx}
              className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-white">
                {trade.fromTokenSymbol}/{trade.toTokenSymbol}
              </td>
              <td className="py-3 px-4 text-slate-300">
                {trade.orderType === 'take-profit' ? '📈 TP' : '⛔ SL'}
              </td>
              <td className="py-3 px-4 text-right text-slate-300">
                ${trade.entryPrice?.toFixed(4) || 'N/A'}
              </td>
              <td className="py-3 px-4 text-right text-slate-300">
                ${trade.exitPrice?.toFixed(4) || 'N/A'}
              </td>
              <td className={`py-3 px-4 text-right font-bold ${
                (trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${(trade.profitLoss || 0).toFixed(2)}
              </td>
              <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {getStatusIcon(trade.status)}
                  <span className="text-xs text-slate-400">{getStatusLabel(trade.status)}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-slate-400 text-xs">
                {new Date(trade.executedDate).toLocaleDateString('id-ID')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}