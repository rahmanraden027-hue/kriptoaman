import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowUpDown, Loader2, ExternalLink, AlertTriangle, CheckCircle2, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchTokenPrices, getSwapQuote, getDexDeepLink, saveSwapToHistory, TOKENS } from './dexApi';
import { motion, AnimatePresence } from 'framer-motion';

function TokenSelect({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const token = TOKENS[value];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl px-3 py-2 transition-colors min-w-[110px]"
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: token?.color }}>
          {token?.logo}
        </span>
        <span className="text-white font-semibold text-sm">{value}</span>
        <span className="text-slate-400 text-xs">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-12 left-0 z-20 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden w-48"
            >
              {Object.keys(TOKENS).filter(k => k !== exclude).map(sym => {
                const t = TOKENS[sym];
                return (
                  <button
                    key={sym}
                    onClick={() => { onChange(sym); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-700 transition-colors ${sym === value ? 'bg-slate-700' : ''}`}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: t.color }}>
                      {t.logo}
                    </span>
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">{sym}</div>
                      <div className="text-slate-400 text-xs">{t.chain}</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DexSwapModal({ onClose, onSwapComplete }) {
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [prices, setPrices] = useState({});
  const [quote, setQuote] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [step, setStep] = useState('form'); // form | confirm | success
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchTokenPrices().then(p => { setPrices(p); setLoadingPrices(false); });
  }, []);

  useEffect(() => {
    if (!fromAmount || isNaN(fromAmount) || parseFloat(fromAmount) <= 0) { setQuote(null); return; }
    const q = getSwapQuote(fromToken, toToken, parseFloat(fromAmount), prices);
    setQuote(q);
  }, [fromAmount, fromToken, toToken, prices]);

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setQuote(null);
  };

  const handleConfirm = async () => {
    setSimulating(true);
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1800));
    setSimulating(false);
    if (quote) {
      saveSwapToHistory({ ...quote, status: 'completed' });
      onSwapComplete && onSwapComplete(quote);
    }
    setStep('success');
  };

  const isCrossChain = TOKENS[fromToken]?.chain !== TOKENS[toToken]?.chain;
  const deepLink = getDexDeepLink(fromToken, toToken, fromAmount || '1');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={step !== 'success' ? onClose : undefined}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h2 className="text-white font-semibold">
              {step === 'form' && 'DEX Swap'}
              {step === 'confirm' && 'Konfirmasi Swap'}
              {step === 'success' && 'Swap Berhasil!'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {step === 'form' && (
          <>
            <div className="bg-slate-800/60 rounded-xl p-1 text-xs flex items-center gap-1 justify-center border border-slate-700/50">
              <span className={`px-2 py-1 rounded-lg ${isCrossChain ? 'bg-orange-500/20 text-orange-300' : 'bg-purple-500/20 text-purple-300'}`}>
                {isCrossChain ? '⚡ THORChain Cross-Chain' : '🦄 Uniswap v3'}
              </span>
              <a href={deepLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-slate-400 hover:text-slate-300 px-2 py-1">
                Buka DEX <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* From */}
            <div className="bg-slate-800 rounded-xl p-4 space-y-2 border border-slate-700/50">
              <span className="text-slate-400 text-xs">Dari</span>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent border-0 text-white text-xl font-bold p-0 focus-visible:ring-0 h-auto"
                />
                <TokenSelect value={fromToken} onChange={setFromToken} exclude={toToken} />
              </div>
              {prices[fromToken] && fromAmount && (
                <p className="text-slate-500 text-xs">≈ ${(parseFloat(fromAmount) * prices[fromToken]).toFixed(2)} USD</p>
              )}
            </div>

            {/* Flip */}
            <div className="flex justify-center">
              <button onClick={handleFlip} className="w-9 h-9 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl flex items-center justify-center transition-all hover:rotate-180 duration-300">
                <ArrowUpDown className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            {/* To */}
            <div className="bg-slate-800 rounded-xl p-4 space-y-2 border border-slate-700/50">
              <span className="text-slate-400 text-xs">Ke</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-xl font-bold text-white">
                  {loadingPrices ? '...' : quote ? quote.toAmount.toFixed(6) : '0.0'}
                </div>
                <TokenSelect value={toToken} onChange={setToToken} exclude={fromToken} />
              </div>
              {quote && (
                <p className="text-slate-500 text-xs">≈ ${quote.toUSD.toFixed(2)} USD</p>
              )}
            </div>

            {/* Quote Details */}
            {quote && (
              <div className="bg-slate-800/40 rounded-xl p-3 space-y-2 border border-slate-700/30 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Rate</span>
                  <span className="text-slate-300">1 {fromToken} = {quote.rate.toFixed(4)} {toToken}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Slippage</span>
                  <span className="text-green-400">{quote.slippage}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    Estimasi Gas <Info className="w-3 h-3" />
                  </span>
                  <span className="text-yellow-400">~${quote.gasFeeUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Price Impact</span>
                  <span className={quote.priceImpact > 0.1 ? 'text-orange-400' : 'text-green-400'}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {isCrossChain && (
              <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-orange-300">Cross-chain swap via THORChain. Estimasi waktu: 5–15 menit. Ini adalah simulasi — klik "Buka DEX" untuk swap nyata.</p>
              </div>
            )}

            <Button
              onClick={() => setStep('confirm')}
              disabled={!quote || loadingPrices}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Review Swap
            </Button>
          </>
        )}

        {step === 'confirm' && quote && (
          <>
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{quote.fromAmount}</div>
                  <div className="text-slate-400 text-sm">{quote.fromSymbol}</div>
                </div>
                <ArrowUpDown className="w-5 h-5 text-purple-400" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{quote.toAmount.toFixed(6)}</div>
                  <div className="text-slate-400 text-sm">{quote.toSymbol}</div>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Protokol</span><span className="text-purple-400 font-medium">{quote.protocol}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Gas Fee</span><span className="text-yellow-400">~${quote.gasFeeUSD.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Total Bayar</span><span className="text-white">${(quote.fromUSD + quote.gasFeeUSD).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Ini adalah simulasi swap. Untuk eksekusi nyata, gunakan tombol "Buka DEX" di halaman sebelumnya.</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
                Kembali
              </Button>
              <Button onClick={handleConfirm} disabled={simulating} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                {simulating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</> : 'Konfirmasi Swap'}
              </Button>
            </div>

            <a href={deepLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Eksekusi nyata di {quote.protocol}
            </a>
          </>
        )}

        {step === 'success' && quote && (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{quote.fromAmount} {quote.fromSymbol} → {quote.toAmount.toFixed(6)} {quote.toSymbol}</p>
              <p className="text-slate-400 text-sm mt-1">Swap via {quote.protocol} berhasil disimulasikan</p>
            </div>
            <a href={getDexDeepLink(quote.fromSymbol, quote.toSymbol, quote.fromAmount)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Lakukan swap nyata di {quote.protocol}
            </a>
            <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700 text-white">Selesai</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}