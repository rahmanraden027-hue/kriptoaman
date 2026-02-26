import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSwapQuote, estimateGasFee, getDexLink, saveTradeToHistory, SWAP_TOKENS } from './dexApi';
import { X, ArrowDownUp, Loader2, ExternalLink, ChevronDown, Zap, Info, Settings, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import DexPriceChart from './DexPriceChart';

const PROTOCOLS = {
  uniswap:  { name: 'Uniswap V3',  logo: '🦄', chains: ['ETH'] },
  thorchain: { name: 'THORChain',  logo: '⚡', chains: ['BTC','ETH','LTC'] },
  '1inch':  { name: '1inch',       logo: '🔀', chains: ['ETH'] },
};

function TokenSelect({ tokens, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const token = tokens.find(t => t.symbol === value?.symbol) || tokens[0];
  return (
    <div className="relative">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 w-full hover:border-slate-500 transition-colors"
      >
        <span className="text-lg">{token?.logo}</span>
        <span className="text-white font-medium flex-1 text-left">{token?.symbol}</span>
        <span className="text-slate-500 text-xs truncate max-w-[80px]">{token?.name}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
            {tokens.map(t => (
              <button
                key={t.symbol}
                onClick={() => { onChange(t); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-700 transition-colors ${t.symbol === value?.symbol ? 'bg-slate-700/70' : ''}`}
              >
                <span className="text-lg">{t.logo}</span>
                <div className="flex-1 text-left">
                  <div className="text-white text-sm font-medium">{t.symbol}</div>
                  <div className="text-slate-400 text-xs">{t.name}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DexSwapModal({ activeCoin, onClose, onSwapComplete }) {
  const tokens = SWAP_TOKENS[activeCoin] || SWAP_TOKENS.ETH;
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [gasFees, setGasFees] = useState(null);
  const [selectedGas, setSelectedGas] = useState('medium');
  const [selectedProtocol, setSelectedProtocol] = useState(activeCoin === 'ETH' ? 'uniswap' : 'thorchain');
  const [loading, setLoading] = useState(false);
  const [gasLoading, setGasLoading] = useState(false);
  const [step, setStep] = useState('form'); // form | confirm | executing | done
  const [slippage, setSlippage] = useState('0.5');
  const [showSlippage, setShowSlippage] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null | waiting | submitted | confirmed

  // Load gas fees
  useEffect(() => {
    setGasLoading(true);
    estimateGasFee().then(f => { setGasFees(f); setGasLoading(false); });
  }, []);

  // Debounced quote fetch
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || fromToken.symbol === toToken.symbol) {
      setQuote(null); return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const q = await getSwapQuote(fromToken, toToken, parseFloat(fromAmount)).catch(() => null);
      setQuote(q);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken]);

  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setQuote(null);
  };

  const availableProtocols = Object.entries(PROTOCOLS).filter(([, p]) =>
    p.chains.includes(activeCoin) || p.chains.includes('ETH')
  );

  const gas = gasFees?.[selectedGas];
  const dexUrl = getDexLink(fromToken, toToken, fromAmount, '', selectedProtocol);

  const handleConfirm = () => {
    if (!quote) return;
    window.open(dexUrl, '_blank');
    setStep('executing');
    setTxStatus('waiting');
    // Simulate transaction status progression
    setTimeout(() => setTxStatus('submitted'), 3000);
    setTimeout(() => {
      setTxStatus('confirmed');
      saveTradeToHistory({
        protocol: selectedProtocol,
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: parseFloat(fromAmount),
        toAmount: quote.toAmount,
        fromUSD: quote.fromUSD,
        toUSD: quote.toUSD,
        gasFee: gas?.usd || '0',
        slippage,
        status: 'completed',
      });
      setTimeout(() => setStep('done'), 1500);
    }, 8000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" onClick={step !== 'done' ? onClose : undefined}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800 z-10">
          <div>
            <h2 className="text-white font-semibold">DEX Swap</h2>
            <p className="text-slate-400 text-xs">Tukar aset via protokol terdesentralisasi</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSlippage(s => !s)} className={`p-1.5 rounded-lg transition-colors ${showSlippage ? 'bg-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Slippage Settings Panel */}
          {showSlippage && step === 'form' && (
            <div className="bg-slate-800/70 border border-violet-500/30 rounded-xl p-3 space-y-2">
              <p className="text-slate-300 text-xs font-medium">Toleransi Slippage</p>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map(v => (
                  <button
                    key={v}
                    onClick={() => setSlippage(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      slippage === v
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
                <div className="flex-1 flex items-center gap-1 bg-slate-700 border border-slate-600 rounded-lg px-2">
                  <input
                    type="number"
                    value={slippage}
                    onChange={e => setSlippage(e.target.value)}
                    className="w-full bg-transparent text-white text-xs outline-none"
                    min="0.01" max="50" step="0.1"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
              {parseFloat(slippage) > 5 && (
                <p className="text-orange-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Slippage tinggi — risiko sandwich attack meningkat
                </p>
              )}
            </div>
          )}

          {step === 'form' && (
            <>
              {/* Protocol Selector */}
              <div>
                <p className="text-slate-400 text-xs mb-2">Pilih DEX Protokol</p>
                <div className="flex gap-2">
                  {availableProtocols.map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedProtocol(key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-all ${
                        selectedProtocol === key
                          ? 'bg-violet-500/20 border-violet-500/60 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <span>{p.logo}</span>
                      <span className="text-xs font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* From Token */}
              <div className="space-y-2">
                <TokenSelect tokens={tokens} value={fromToken} onChange={setFromToken} label="Dari" />
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-800 border-slate-700 text-white text-lg font-semibold"
                />
                {quote && <p className="text-slate-500 text-xs">≈ ${quote.fromUSD.toFixed(2)} USD</p>}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button onClick={handleSwap} className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                  <ArrowDownUp className="w-5 h-5" />
                </button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <TokenSelect tokens={tokens} value={toToken} onChange={setToToken} label="Ke" />
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 min-h-[44px] flex items-center">
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : quote ? (
                    <div>
                      <span className="text-white text-lg font-semibold">{quote.toAmount.toFixed(6)}</span>
                      <span className="text-slate-400 text-sm ml-2">{toToken.symbol}</span>
                      <p className="text-slate-500 text-xs mt-0.5">≈ ${quote.toUSD.toFixed(2)} USD</p>
                    </div>
                  ) : (
                    <span className="text-slate-600">0.0</span>
                  )}
                </div>
              </div>

              {/* Price Chart */}
              <DexPriceChart fromToken={fromToken} toToken={toToken} />

              {/* Quote Details */}
              {quote && (
                <div className="bg-slate-800/50 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kurs</span>
                    <span className="text-white">1 {fromToken.symbol} = {quote.exchangeRate.toFixed(6)} {toToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Toleransi Slippage</span>
                    <span className="text-yellow-400">{slippage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min. Diterima</span>
                    <span className="text-white">{(quote.toAmount * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price Impact</span>
                    <span className={parseFloat(quote.priceImpact) > 1 ? 'text-red-400' : 'text-green-400'}>
                      {quote.priceImpact}%
                    </span>
                  </div>
                </div>
              )}

              {/* Gas Fee */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <p className="text-slate-400 text-xs">Gas Fee (Estimasi)</p>
                </div>
                {gasLoading ? (
                  <div className="h-16 bg-slate-800 rounded-xl animate-pulse" />
                ) : gasFees && (
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedGas(level)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          selectedGas === level
                            ? 'bg-yellow-500/20 border-yellow-500/60 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-xs font-medium capitalize">{level === 'low' ? 'Lambat' : level === 'medium' ? 'Normal' : 'Cepat'}</div>
                        <div className="text-xs font-bold mt-0.5">${gasFees[level].usd}</div>
                        <div className="text-xs opacity-60">{gasFees[level].time}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-blue-300 text-xs">
                  Swap akan dieksekusi via <strong>{PROTOCOLS[selectedProtocol]?.name}</strong>. Anda akan diarahkan ke DEX untuk konfirmasi akhir dan signing dengan wallet Anda.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => window.open(dexUrl, '_blank')}
                  className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka DEX
                </Button>
                <Button
                  onClick={() => quote && setStep('confirm')}
                  disabled={!quote || !fromAmount}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Review Swap
                </Button>
              </div>
            </>
          )}

          {step === 'confirm' && quote && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-white font-medium text-sm">Konfirmasi Swap</h3>
                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{parseFloat(fromAmount).toFixed(6)}</div>
                    <div className="text-slate-400 text-sm">{fromToken.symbol}</div>
                  </div>
                  <ArrowDownUp className="w-5 h-5 text-slate-500" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-400">{quote.toAmount.toFixed(6)}</div>
                    <div className="text-slate-400 text-sm">{toToken.symbol}</div>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Protokol</span><span className="text-white">{PROTOCOLS[selectedProtocol]?.logo} {PROTOCOLS[selectedProtocol]?.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Nilai dari</span><span className="text-white">${quote.fromUSD.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Nilai ke</span><span className="text-white">${quote.toUSD.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Gas Fee (est.)</span><span className="text-yellow-400">${gas?.usd} ({gas?.time})</span></div>
                  <div className="flex justify-between font-semibold border-t border-slate-700 pt-1.5"><span className="text-slate-300">Total Biaya</span><span className="text-white">${(quote.fromUSD + parseFloat(gas?.usd || 0)).toFixed(2)}</span></div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                <Info className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <p className="text-orange-300 text-xs">
                  Klik "Eksekusi di DEX" untuk membuka {PROTOCOLS[selectedProtocol]?.name} dan menyelesaikan swap secara on-chain. Trade ini akan dicatat di riwayat Anda.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Kembali</Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Eksekusi di DEX
                </Button>
              </div>
            </div>
          )}

          {step === 'executing' && (
            <div className="space-y-4 py-2">
              <h3 className="text-white font-medium text-sm text-center">Status Transaksi</h3>
              <div className="space-y-3">
                {[
                  { key: 'waiting', label: 'Menunggu konfirmasi wallet', desc: 'Setujui transaksi di DEX tab' },
                  { key: 'submitted', label: 'Transaksi terkirim ke mempool', desc: 'Menunggu validasi miner' },
                  { key: 'confirmed', label: 'Transaksi dikonfirmasi', desc: 'Swap berhasil diselesaikan!' },
                ].map(({ key, label, desc }, i) => {
                  const statuses = ['waiting', 'submitted', 'confirmed'];
                  const currentIdx = statuses.indexOf(txStatus);
                  const stepIdx = statuses.indexOf(key);
                  const isActive = txStatus === key;
                  const isDone = currentIdx > stepIdx;
                  const isPending = currentIdx < stepIdx;
                  return (
                    <div key={key} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isActive ? 'bg-violet-500/10 border-violet-500/40' : isDone ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/40 border-slate-700/30'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDone ? 'bg-green-500/20' : isActive ? 'bg-violet-500/20' : 'bg-slate-700'}`}>
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : isActive ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" /> : <Clock className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDone ? 'text-green-300' : isActive ? 'text-white' : 'text-slate-500'}`}>{label}</p>
                        <p className={`text-xs mt-0.5 ${isDone ? 'text-green-500/70' : isActive ? 'text-slate-400' : 'text-slate-600'}`}>{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-slate-500 text-xs text-center">
                {fromToken.symbol} → {toToken.symbol} via {PROTOCOLS[selectedProtocol]?.name}
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">✅</div>
              <div>
                <h3 className="text-white font-semibold text-lg">Trade Dicatat!</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {parseFloat(fromAmount).toFixed(6)} {fromToken.symbol} → {quote?.toAmount.toFixed(6)} {toToken.symbol}
                </p>
                <p className="text-slate-500 text-xs mt-1">Selesaikan swap di tab {PROTOCOLS[selectedProtocol]?.name} yang baru dibuka.</p>
              </div>
              <Button onClick={() => { onSwapComplete?.(); onClose(); }} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                Selesai
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}