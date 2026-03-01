import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight, ChevronDown, Loader2, AlertTriangle,
  CheckCircle2, Zap, RefreshCw, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// EVM tokens available for 1inch-style swap
const TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum',      color: '#627EEA', icon: 'Ξ',  decimals: 18, address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
  { symbol: 'USDT', name: 'Tether USD',     color: '#26A17B', icon: '$',  decimals: 6,  address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  { symbol: 'USDC', name: 'USD Coin',       color: '#2775CA', icon: '⬡',  decimals: 6,  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin',color: '#F7931A', icon: '₿',  decimals: 8,  address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  { symbol: 'BNB',  name: 'BNB',            color: '#F0B90B', icon: 'B',  decimals: 18, address: '0xb8c77482e45f1f44de1745f52c74426c631bdd52' },
  { symbol: 'MATIC',name: 'Polygon',        color: '#8247E5', icon: 'M',  decimals: 18, address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0' },
  { symbol: 'LINK', name: 'Chainlink',      color: '#375BD2', icon: '⬡',  decimals: 18, address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
  { symbol: 'UNI',  name: 'Uniswap',        color: '#FF007A', icon: '🦄', decimals: 18, address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
];

// Simulated 1inch quote (in real app, call 1inch API)
function getSimulatedQuote(fromSym, toSym, amount) {
  const PRICES = { ETH: 2800, USDT: 1, USDC: 1, WBTC: 45000, BNB: 380, MATIC: 0.9, LINK: 14, UNI: 8 };
  const fromPrice = PRICES[fromSym] || 1;
  const toPrice = PRICES[toSym] || 1;
  const grossOut = (parseFloat(amount) * fromPrice) / toPrice;
  const slippage = Math.random() * 0.4 + 0.05; // 0.05–0.45%
  const gasFee = 0.0015 + Math.random() * 0.001;
  const protocolFee = grossOut * 0.003;
  const netOut = grossOut * (1 - slippage / 100) - protocolFee;
  const priceImpact = Math.random() * 0.3 + 0.01;
  return {
    fromSym, toSym, amount: parseFloat(amount),
    toAmount: Math.max(0, netOut),
    slippage: parseFloat(slippage.toFixed(3)),
    gasFeeETH: parseFloat(gasFee.toFixed(6)),
    gasFeeUSD: parseFloat((gasFee * fromPrice).toFixed(2)),
    priceImpact: parseFloat(priceImpact.toFixed(3)),
    rate: fromPrice / toPrice,
    protocols: ['Uniswap V3', 'Curve', '0x'][Math.floor(Math.random() * 3)],
    minOut: netOut * 0.995,
  };
}

function TokenPicker({ selected, exclude, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl w-full max-w-md p-4 space-y-2 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Pilih Token</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        {TOKENS.filter(t => t.symbol !== exclude).map(token => (
          <button key={token.symbol} onClick={() => { onSelect(token.symbol); onClose(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${selected === token.symbol ? 'bg-slate-700 border-slate-500' : 'bg-slate-800/50 border-slate-700/30 hover:bg-slate-800'}`}>
            <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ background: token.color }}>
              {token.icon}
            </span>
            <div className="text-left">
              <div className="text-white font-semibold text-sm">{token.symbol}</div>
              <div className="text-slate-400 text-xs">{token.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InlineSwapWidget() {
  const [fromSym, setFromSym] = useState('ETH');
  const [toSym, setToSym] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // form | success
  const [pickerFor, setPickerFor] = useState(null);
  const [error, setError] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); return; }
    setLoading(true);
    timer.current = setTimeout(() => {
      const q = getSimulatedQuote(fromSym, toSym, amount);
      setQuote(q);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer.current);
  }, [fromSym, toSym, amount]);

  const handleSwap = () => { setFromSym(toSym); setToSym(fromSym); setAmount(''); setQuote(null); };

  const handleExecute = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setStep('success');
  };

  const fromToken = TOKENS.find(t => t.symbol === fromSym);
  const toToken = TOKENS.find(t => t.symbol === toSym);
  const slippageColor = !quote ? '' : quote.slippage < 0.1 ? 'text-green-400' : quote.slippage < 0.3 ? 'text-yellow-400' : 'text-red-400';

  if (step === 'success') return (
    <div className="bg-slate-800/30 border border-green-500/20 rounded-2xl p-4 text-center space-y-3">
      <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
      <p className="text-white font-semibold">Swap Berhasil!</p>
      <p className="text-slate-400 text-xs">{amount} {fromSym} → {quote?.toAmount?.toFixed(6)} {toSym} via 1inch ({quote?.protocols})</p>
      <Button size="sm" onClick={() => { setStep('form'); setAmount(''); setQuote(null); }} className="bg-slate-700 hover:bg-slate-600 text-white text-xs">Swap Lagi</Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-orange-400" />
        <span className="text-white font-semibold text-sm">Swap Token</span>
        <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-full">via 1inch</span>
      </div>

      {/* From */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">Dari</span>
          {amount && <span className="text-slate-500 text-xs">Saldo tersedia</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPickerFor('from')}
            className="flex items-center gap-1.5 bg-slate-700 rounded-xl px-2.5 py-1.5 hover:bg-slate-600 transition-colors shrink-0">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: fromToken?.color }}>{fromToken?.icon}</span>
            <span className="text-white text-sm font-semibold">{fromSym}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.0"
            className="flex-1 bg-transparent border-none text-white text-lg font-bold text-right focus-visible:ring-0 p-0 h-auto placeholder:text-slate-600" />
        </div>
        <div className="flex gap-1.5 justify-end">
          {['25%', '50%', '75%', 'Max'].map(p => (
            <button key={p} onClick={() => setAmount(p === 'Max' ? '1' : (parseFloat(p) / 100).toString())}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors">{p}</button>
          ))}
        </div>
      </div>

      {/* Swap arrow */}
      <div className="flex justify-center -my-1">
        <button onClick={handleSwap}
          className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors">
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>

      {/* To */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
        <span className="text-slate-400 text-xs">Ke</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPickerFor('to')}
            className="flex items-center gap-1.5 bg-slate-700 rounded-xl px-2.5 py-1.5 hover:bg-slate-600 transition-colors shrink-0">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: toToken?.color }}>{toToken?.icon}</span>
            <span className="text-white text-sm font-semibold">{toSym}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <div className="flex-1 text-right">
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin text-slate-500 ml-auto" />
              : <span className={`text-lg font-bold ${quote ? 'text-white' : 'text-slate-600'}`}>
                  {quote ? quote.toAmount.toFixed(6) : '0.0'}
                </span>
            }
          </div>
        </div>
      </div>

      {/* Quote details */}
      {quote && !loading && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Rate</span>
            <span className="text-white">1 {fromSym} = {quote.rate.toFixed(4)} {toSym}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Slippage</span>
            <span className={slippageColor}>{quote.slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Gas Fee</span>
            <span className="text-white">{quote.gasFeeETH} ETH <span className="text-slate-500">(~${quote.gasFeeUSD})</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Price Impact</span>
            <span className={quote.priceImpact > 0.2 ? 'text-yellow-400' : 'text-green-400'}>{quote.priceImpact}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Routed via</span>
            <span className="text-orange-400">{quote.protocols}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700/50 pt-1.5">
            <span className="text-slate-400">Min. diterima</span>
            <span className="text-green-400 font-semibold">{quote.minOut.toFixed(6)} {toSym}</span>
          </div>
        </div>
      )}

      <Button onClick={handleExecute} disabled={!quote || loading || !amount}
        className="w-full h-10 text-white font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-sm gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Swap via 1inch</>}
      </Button>

      <div className="flex items-start gap-1.5 text-[10px] text-slate-600">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>Swap disimulasikan. Harga dari agregator 1inch mengoptimalkan rute terbaik.</span>
      </div>

      {pickerFor && (
        <TokenPicker
          selected={pickerFor === 'from' ? fromSym : toSym}
          exclude={pickerFor === 'from' ? toSym : fromSym}
          onSelect={sym => { if (pickerFor === 'from') setFromSym(sym); else setToSym(sym); setQuote(null); }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}