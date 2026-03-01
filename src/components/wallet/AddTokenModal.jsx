import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Search, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { EVM_CHAINS, fetchTokenMetadata, addCustomToken } from './customTokens';

const CHAIN_LABELS = {
  ETH: 'Ethereum', BNB: 'BNB Chain', MATIC: 'Polygon', ARB: 'Arbitrum',
  OP: 'Optimism', BASE: 'Base', AVAX: 'Avalanche', FTM: 'Fantom',
};
const CHAIN_COLORS = {
  ETH: '#627EEA', BNB: '#F0B90B', MATIC: '#8247E5', ARB: '#28A0F0',
  OP: '#FF0420', BASE: '#0052FF', AVAX: '#E84142', FTM: '#1969FF',
};

export default function AddTokenModal({ onClose, onTokenAdded }) {
  const [chain, setChain] = useState('ETH');
  const [contract, setContract] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  const handleLookup = async () => {
    if (!contract || contract.length < 10) { setError('Masukkan alamat kontrak yang valid'); return; }
    setLoading(true); setError(''); setMetadata(null);
    try {
      const info = await fetchTokenMetadata(chain, contract.trim());
      setMetadata(info);
    } catch (e) {
      setError(e.message || 'Gagal memuat metadata token');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!metadata) return;
    const token = {
      chain, contract: contract.trim().toLowerCase(),
      name: metadata.name, symbol: metadata.symbol, decimals: metadata.decimals,
      color: CHAIN_COLORS[chain] || '#6366f1',
    };
    const updated = addCustomToken(token);
    setAdded(true);
    onTokenAdded && onTokenAdded(updated);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Tambah Token Kustom</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {added ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
            <p className="text-white font-semibold">{metadata?.symbol} ditambahkan!</p>
          </div>
        ) : (
          <>
            {/* Chain Selector */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Jaringan</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {EVM_CHAINS.map(c => (
                  <button key={c} onClick={() => { setChain(c); setMetadata(null); setError(''); }}
                    className={`py-1.5 px-1 rounded-xl text-xs font-semibold border transition-all ${chain === c ? 'text-white border-transparent' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    style={chain === c ? { background: CHAIN_COLORS[c] } : {}}>
                    {c}
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs">{CHAIN_LABELS[chain]}</p>
            </div>

            {/* Contract Address */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Alamat Kontrak</Label>
              <div className="flex gap-2">
                <Input
                  value={contract}
                  onChange={e => { setContract(e.target.value); setMetadata(null); setError(''); }}
                  placeholder="0x..."
                  className="bg-slate-800 border-slate-700 text-white font-mono text-xs flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                />
                <Button onClick={handleLookup} disabled={loading} size="icon" style={{ background: CHAIN_COLORS[chain] }} className="shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Token Preview */}
            {metadata && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: CHAIN_COLORS[chain] }}>
                    {metadata.symbol?.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{metadata.name}</p>
                    <p className="text-slate-400 text-xs">{metadata.symbol} · {metadata.decimals} decimals</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ background: CHAIN_COLORS[chain] + '88' }}>
                    {chain}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-mono truncate">{contract}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Batal</Button>
              <Button onClick={handleAdd} disabled={!metadata} className="flex-1 text-white"
                style={metadata ? { background: CHAIN_COLORS[chain] } : {}}>
                Tambah Token
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}