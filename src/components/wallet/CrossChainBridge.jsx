import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ChevronDown, X, AlertTriangle, CheckCircle2,
  Loader2, Info, RefreshCw, ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const EVM_CHAINS = [
  { id: 'ETH',   label: 'Ethereum',  color: '#627EEA', icon: 'Ξ',  chainId: 1   },
  { id: 'BNB',   label: 'BNB Chain', color: '#F0B90B', icon: 'B',  chainId: 56  },
  { id: 'MATIC', label: 'Polygon',   color: '#8247E5', icon: 'M',  chainId: 137 },
  { id: 'ARB',   label: 'Arbitrum',  color: '#28A0F0', icon: 'A',  chainId: 42161 },
  { id: 'OP',    label: 'Optimism',  color: '#FF0420', icon: 'O',  chainId: 10  },
  { id: 'BASE',  label: 'Base',      color: '#0052FF', icon: 'B',  chainId: 8453 },
];

// Simulated bridge aggregators & fees
const BRIDGES = {
  'ETH-BNB':   { name: 'Stargate',   fee: 0.001, time: '3-5 menit',  via: 'LayerZero' },
  'ETH-MATIC': { name: 'Hop',        fee: 0.0015, time: '2-4 menit', via: 'Hop Protocol' },
  'ETH-ARB':   { name: 'Arbitrum Bridge', fee: 0.0005, time: '~1 menit', via: 'Native Bridge' },
  'ETH-OP':    { name: 'Optimism Bridge', fee: 0.0005, time: '~1 menit', via: 'Native Bridge' },
  'ETH-BASE':  { name: 'Base Bridge', fee: 0.0005, time: '~1 menit',  via: 'Native Bridge' },
  'BNB-ETH':   { name: 'Stargate',   fee: 0.5,   time: '3-5 menit',  via: 'LayerZero' },
  'BNB-MATIC': { name: 'Multichain', fee: 0.3,   time: '5-10 menit', via: 'Multichain' },
  'MATIC-ETH': { name: 'Polygon Bridge', fee: 0.1, time: '30 menit', via: 'PoS Bridge' },
  'ARB-ETH':   { name: 'Arbitrum Bridge', fee: 0.001, time: '~7 hari', via: 'Native Bridge' },
  'OP-ETH':    { name: 'Optimism Bridge', fee: 0.001, time: '~7 hari', via: 'Native Bridge' },
};

function getBridge(from, to) {
  return BRIDGES[`${from}-${to}`] || { name: 'Multichain', fee: 0.002, time: '5-15 menit', via: 'Multichain' };
}

function ChainSelector({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const chain = EVM_CHAINS.find(c => c.id === value);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 hover:bg-slate-700 transition-colors w-full">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: chain?.color }}>
          {chain?.icon}
        </span>
        <div className="text-left flex-1">
          <div className="text-white text-sm font-semibold">{chain?.id}</div>
          <div className="text-slate-500 text-[10px]">{chain?.label}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl w-48 shadow-2xl overflow-hidden">
          {EVM_CHAINS.filter(c => c.id !== exclude).map(c => (
            <button key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-800 transition-colors ${value === c.id ? 'bg-slate-800' : ''}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: c.color }}>{c.icon}</span>
              <div>
                <div className="text-white text-xs font-semibold">{c.id}</div>
                <div className="text-slate-500 text-[10px]">{c.label}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CrossChainBridge({ onClose }) {
  const [fromChain, setFromChain] = useState('ETH');
  const [toChain, setToChain] = useState('BNB');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form'); // form | confirm | success
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const bridge = getBridge(fromChain, toChain);
  const feeAmount = amount ? (parseFloat(amount) * bridge.fee).toFixed(6) : '0';
  const receiveAmount = amount ? Math.max(0, parseFloat(amount) - parseFloat(feeAmount)).toFixed(6) : '0';
  const fromChainData = EVM_CHAINS.find(c => c.id === fromChain);
  const toChainData = EVM_CHAINS.find(c => c.id === toChain);

  const handleSwapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setAmount('');
  };

  const handleBridge = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setTxHash('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    setLoading(false);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-semibold">Cross-Chain Bridge</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">EVM</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {step === 'form' && (
            <>
              {/* From → To chain row */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-slate-500 text-xs mb-1.5">Dari Jaringan</p>
                  <ChainSelector value={fromChain} onChange={c => { setFromChain(c); setAmount(''); }} exclude={toChain} />
                </div>
                <button onClick={handleSwapChains}
                  className="mt-5 w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors shrink-0">
                  <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                </button>
                <div className="flex-1">
                  <p className="text-slate-500 text-xs mb-1.5">Ke Jaringan</p>
                  <ChainSelector value={toChain} onChange={c => { setToChain(c); setAmount(''); }} exclude={fromChain} />
                </div>
              </div>

              {/* Amount */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2">
                <p className="text-slate-400 text-xs">Jumlah ETH</p>
                <div className="flex items-center gap-3">
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent border-none text-white text-2xl font-bold focus-visible:ring-0 p-0 h-auto placeholder:text-slate-600" />
                  <span className="text-slate-400 font-semibold shrink-0">ETH</span>
                </div>
                <div className="flex gap-2">
                  {['0.01', '0.05', '0.1', '0.5'].map(v => (
                    <button key={v} onClick={() => setAmount(v)}
                      className="flex-1 text-xs py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">{v}</button>
                  ))}
                </div>
              </div>

              {/* Bridge details */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bridge Protocol</span>
                    <div className="text-right">
                      <span className="text-white font-semibold">{bridge.name}</span>
                      <span className="text-slate-500 ml-1">via {bridge.via}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Biaya Bridge</span>
                    <span className="text-yellow-400">-{feeAmount} ETH ({(bridge.fee * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diterima di {toChain}</span>
                    <span className="text-green-400 font-semibold">{receiveAmount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimasi waktu</span>
                    <span className="text-white">{bridge.time}</span>
                  </div>
                </div>
              )}

              {/* Receive preview */}
              {amount && parseFloat(amount) > 0 && (
                <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/30 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: fromChainData?.color + '33', color: fromChainData?.color }}>
                    {fromChainData?.icon}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">{amount} ETH</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="text-green-400 text-sm font-semibold">{receiveAmount} ETH</span>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: toChainData?.color + '33', color: toChainData?.color }}>
                    {toChainData?.icon}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-300 text-xs">Bridge menggunakan protokol terpercaya. Waktu konfirmasi bervariasi per jaringan. Ini adalah simulasi — tidak ada dana nyata yang dipindahkan.</p>
              </div>

              <Button onClick={() => setStep('confirm')}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full h-12 text-white font-semibold bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40">
                Review Bridge
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-center">Konfirmasi Bridge</h3>
              <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mx-auto mb-1"
                      style={{ background: fromChainData?.color }}>{fromChainData?.icon}</div>
                    <div className="text-white text-xs font-semibold">{fromChain}</div>
                    <div className="text-slate-400 text-xs">{amount} ETH</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-cyan-400" />
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mx-auto mb-1"
                      style={{ background: toChainData?.color }}>{toChainData?.icon}</div>
                    <div className="text-white text-xs font-semibold">{toChain}</div>
                    <div className="text-green-400 text-xs">{receiveAmount} ETH</div>
                  </div>
                </div>
                <hr className="border-slate-700" />
                <div className="flex justify-between text-xs"><span className="text-slate-400">Protocol</span><span className="text-white">{bridge.name}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400">Fee</span><span className="text-yellow-400">{feeAmount} ETH</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400">Waktu</span><span className="text-white">{bridge.time}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Kembali</Button>
                <Button onClick={handleBridge} disabled={loading} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Bridge'}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Bridge Dimulai!</h3>
                <p className="text-slate-400 text-sm mt-1">{amount} ETH sedang ditransfer dari {fromChain} ke {toChain}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 space-y-2 text-left text-xs">
                <div className="flex justify-between"><span className="text-slate-400">TX Hash</span><span className="text-blue-400 font-mono">{txHash.slice(0, 20)}…</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Estimasi tiba</span><span className="text-white">{bridge.time}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Diterima</span><span className="text-green-400 font-semibold">{receiveAmount} ETH di {toChain}</span></div>
              </div>
              <Button onClick={onClose} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">Selesai</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}