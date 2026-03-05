import React, { useState } from 'react';
import { useWeb3 } from './Web3Provider';
import { X, Send, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OnchainSendModal({ onClose }) {
  const { sendTransaction, isConnected, connectWallet, currentChain } = useWeb3();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!to || !amount) return;
    setError('');
    setLoading(true);
    try {
      const tx = await sendTransaction({ to, value: amount });
      setTxHash(tx.hash);
    } catch (e) {
      setError(e.message || 'Transaksi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Kirim Onchain</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {!isConnected ? (
          <div className="text-center py-6">
            <p className="text-slate-400 mb-4">Hubungkan wallet untuk kirim transaksi onchain</p>
            <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">Hubungkan Wallet</Button>
          </div>
        ) : txHash ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-green-400 font-bold">Transaksi Terkirim!</p>
            <p className="text-slate-400 text-xs font-mono break-all">{txHash}</p>
            {currentChain && (
              <a href={`${currentChain.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 text-sm hover:underline">
                Lihat di Explorer <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <Button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600">Selesai</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Alamat Tujuan</label>
                <Input value={to} onChange={e => setTo(e.target.value)} placeholder="0x..." className="bg-slate-800 border-slate-700 text-white font-mono text-sm" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Jumlah ({currentChain?.symbol || 'ETH'})</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.001" className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <Button onClick={handleSend} disabled={loading || !to || !amount} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : <><Send className="w-4 h-4 mr-2" /> Kirim</>}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}