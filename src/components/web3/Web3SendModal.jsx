import React, { useState } from 'react';
import { parseEther } from 'viem';
import { useWeb3 } from './Web3Provider';
import { Send, X, Loader2, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Web3SendModal({ onClose }) {
  const { signer, account, currentChain, refreshBalance } = useWeb3();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!to || !amount || !signer) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
      setTxHash(tx.hash);
      await tx.wait();
      refreshBalance();
    } catch (e) {
      setError(e.message || 'Transaksi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-400" />
            <span className="text-white font-bold text-lg">Kirim Onchain</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {txHash ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <div className="text-white font-bold mb-2">Transaksi Dikirim!</div>
            <div className="text-slate-400 text-sm mb-4 font-mono text-xs break-all">{txHash}</div>
            <a href={`${currentChain?.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm">
              Lihat di Explorer <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Alamat Tujuan</label>
                <input
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">
                  Jumlah ({currentChain?.symbol || 'ETH'})
                </label>
                <input
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.001"
                  type="number"
                  min="0"
                  step="0.0001"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span className="text-red-300 text-xs">{error}</span>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={loading || !to || !amount}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</> : 'Kirim Transaksi'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}