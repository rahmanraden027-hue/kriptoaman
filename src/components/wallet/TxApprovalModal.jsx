import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TxApprovalModal({ tx, onApprove, onReject, onClose }) {
  const [step, setStep] = useState('review');
  const [signing, setSigning] = useState(false);

  if (!tx) return null;

  const handleApprove = async () => {
    setSigning(true);
    await new Promise(r => setTimeout(r, 1500));
    setSigning(false);
    setStep('success');
  };

  const handleFinish = () => {
    onApprove(tx);
    onClose();
  };

  const shortenAddr = (addr) => addr?.slice(0, 6) + '...' + addr?.slice(-4);

  const estimatedFee = (parseFloat(tx.amount) * 0.001).toFixed(6);
  const total = (parseFloat(tx.amount) + parseFloat(estimatedFee)).toFixed(6);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-4 h-4" />
        </button>

        {step === 'review' && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold">Tinjau Transaksi</h3>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
              
              {/* Tx Type & Status */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Tipe</span>
                <span className="text-white font-semibold text-sm">
                  {tx.type === 'transfer' ? '📤 Pengiriman' : tx.type === 'swap' ? '🔄 Tukar' : '⚙️ Persetujuan'}
                </span>
              </div>

              {/* Token & Amount */}
              <div className="border-t border-slate-700/50 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">Token</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{tx.fromToken}</span>
                    <span className="text-slate-500 text-xs">→</span>
                    <span className="text-white font-bold text-sm">{tx.toToken}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Jumlah</span>
                  <span className="text-green-400 font-bold text-sm">{tx.amount} {tx.fromToken}</span>
                </div>
                {tx.toAmount && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                    <span className="text-slate-400 text-xs">Terima ±</span>
                    <span className="text-blue-400 font-bold text-sm">{tx.toAmount} {tx.toToken}</span>
                  </div>
                )}
              </div>

              {/* Recipient */}
              {tx.to && (
                <div className="border-t border-slate-700/50 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Ke Alamat</span>
                    <span className="text-slate-300 font-mono text-xs">{shortenAddr(tx.to)}</span>
                  </div>
                  {tx.toName && (
                    <div className="text-xs text-slate-500 mt-1 text-right">{tx.toName}</div>
                  )}
                </div>
              )}

              {/* Network & Fees */}
              <div className="border-t border-slate-700/50 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">Jaringan</span>
                  <span className="text-slate-300 text-xs font-medium">{tx.network || 'Ethereum'}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">Gas Limit</span>
                  <span className="text-slate-300 text-xs">{tx.gasLimit || '21000'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Gas Price</span>
                  <span className="text-slate-300 text-xs">{tx.gasPrice || 'Standard'}</span>
                </div>
              </div>

              {/* Fee & Total */}
              <div className="border-t border-slate-700/50 pt-3 bg-slate-800/50 rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">Biaya Gas Est.</span>
                  <span className="text-white font-semibold text-sm">{estimatedFee} ETH</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-700/50 pt-2">
                  <span className="text-slate-300 text-xs font-semibold">Total</span>
                  <span className="text-white font-bold text-base">{total} {tx.fromToken}</span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 text-xs leading-relaxed">
                  Verifikasi alamat penerima dan jumlah sebelum menyetujui. Transaksi tidak bisa dibatalkan setelah dikirim.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { onReject(tx); onClose(); }}
                variant="outline"
                className="flex-1 h-11 font-bold text-slate-300 border-slate-600 hover:text-red-400 hover:border-red-500/40">
                Tolak
              </Button>
              <Button onClick={handleApprove} disabled={signing}
                className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2">
                {signing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menandatangani...
                  </>
                ) : (
                  <>✓ Setujui</>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Transaksi Disetujui!</h3>
              <p className="text-slate-400 text-sm mt-2">
                Transaksi Anda ditandatangani dan siap dikirim ke blockchain. Ini dapat memakan waktu beberapa menit.
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-slate-400 text-xs mb-1">Hash (akan aktif setelah broadcast):</div>
              <div className="font-mono text-slate-300 text-xs break-all">{tx.hash || '0x...'}</div>
            </div>
            <Button onClick={handleFinish}
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold">
              Selesai
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}