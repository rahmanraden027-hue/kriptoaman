import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeftRight, ArrowDown, ChevronDown, AlertTriangle, Info, Loader2, X,
  CheckCircle2, ExternalLink, RefreshCw, TrendingUp, TrendingDown, Clock,
  Zap, Shield, BarChart2
} from 'lucide-react';
import { getSwapQuote, getInboundAddress, buildSwapMemo, SWAP_COINS } from './swapApi';
import { getPrices } from './multiCoinApi';

const COIN_LIST = Object.values(SWAP_COINS);
const QUOTE_REFRESH_INTERVAL = 30; // seconds

function CoinButton({ coin, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-slate-700/80 hover:bg-slate-700 border border-slate-600/60 rounded-xl px-3 py-2.5 transition-colors shrink-0"
    >
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: coin.color }}>
        {coin.icon}
      </span>
      <div className="text-left">
        <div className="text-white font-bold text-sm leading-none">{coin.symbol}</div>
        <div className="text-slate-400 text-[10px]">{coin.chainName}</div>
      </div>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
    </button>
  );
}

function CoinPicker({ selected, exclude, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl w-full max-w-md p-4 space-y-2 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Pilih Token</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {COIN_LIST.filter(c => c.symbol !== exclude).map(coin => (
          <button
            key={coin.symbol}
            onClick={() => { onSelect(coin.symbol); onClose(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              selected === coin.symbol ? 'bg-slate-700 border-slate-500' : 'bg-slate-800/50 border-slate-700/30 hover:bg-slate-800'
            }`}
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-base shrink-0" style={{ background: coin.color }}>
              {coin.icon}
            </span>
            <div className="text-left flex-1">
              <div className="text-white font-semibold text-sm">{coin.name}</div>
              <div className="text-slate-400 text-xs">{coin.symbol} · {coin.chainName}</div>
            </div>
            {selected === coin.symbol && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function RateDisplay({ fromCoin, toCoin, quote, prices, amount }) {
  if (!quote || !amount) return null;
  const fromPrice = prices[fromCoin]?.price || 0;
  const toPrice = prices[toCoin]?.price || 0;
  const rate = quote.expectedOut / parseFloat(amount);
  const reverseRate = parseFloat(amount) / quote.expectedOut;

  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
          <BarChart2 className="w-3 h-3" /> KURS REAL-TIME
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-[10px]">Live</span>
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">1 {fromCoin} =</span>
          <span className="text-white font-semibold">{rate.toFixed(6)} {toCoin}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">1 {toCoin} =</span>
          <span className="text-white font-semibold">{reverseRate.toFixed(6)} {fromCoin}</span>
        </div>
        {fromPrice > 0 && toPrice > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-slate-500 text-xs">Harga Pasar</span>
            <div className="text-right">
              <span className="text-slate-400 text-xs">${fromPrice.toLocaleString()} → ${toPrice.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SwapModal({ addresses, onClose }) {
  const [fromCoin, setFromCoin] = useState('BTC');
  const [toCoin, setToCoin] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState({});
  const [step, setStep] = useState('form'); // form | confirm | success
  const [inboundAddr, setInboundAddr] = useState('');
  const [pickerFor, setPickerFor] = useState(null);
  const [countdown, setCountdown] = useState(QUOTE_REFRESH_INTERVAL);
  const [priceLoading, setPriceLoading] = useState(true);
  const quoteTimer = useRef(null);
  const countdownRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const destAddress = addresses?.[toCoin]?.address || '';

  // Load prices
  useEffect(() => {
    getPrices().then(p => { setPrices(p); setPriceLoading(false); });
    const interval = setInterval(() => getPrices().then(setPrices), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto quote refresh countdown
  const resetCountdown = useCallback(() => {
    setCountdown(QUOTE_REFRESH_INTERVAL);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  // Fetch quote
  const fetchQuote = useCallback(async (silent = false) => {
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); return; }
    if (!silent) setLoading(true);
    setError('');
    try {
      const q = await getSwapQuote({ fromCoin, toCoin, amount, destinationAddress: destAddress });
      setQuote(q);
      resetCountdown();
    } catch {
      setError('Gagal mendapatkan estimasi swap. Periksa koneksi Anda.');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [fromCoin, toCoin, amount, destAddress, resetCountdown]);

  // Debounced auto-fetch
  useEffect(() => {
    clearTimeout(quoteTimer.current);
    clearInterval(refreshIntervalRef.current);
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); setCountdown(QUOTE_REFRESH_INTERVAL); return; }
    quoteTimer.current = setTimeout(() => {
      fetchQuote();
      refreshIntervalRef.current = setInterval(() => fetchQuote(true), QUOTE_REFRESH_INTERVAL * 1000);
    }, 600);
    return () => { clearTimeout(quoteTimer.current); clearInterval(refreshIntervalRef.current); };
  }, [fromCoin, toCoin, amount, destAddress]);

  useEffect(() => () => { clearInterval(countdownRef.current); clearInterval(refreshIntervalRef.current); }, []);

  const handleSwapCoins = () => {
    setFromCoin(toCoin);
    setToCoin(fromCoin);
    setAmount('');
    setQuote(null);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const addr = await getInboundAddress(fromCoin);
      setInboundAddr(addr || 'bc1q...thorchain-vault');
      setStep('confirm');
    } catch {
      setError('Gagal mendapatkan vault address. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => setStep('success');

  const memo = destAddress ? buildSwapMemo(SWAP_COINS[toCoin].asset, destAddress) : '';
  const fromPrice = prices[fromCoin]?.price || 0;
  const toPrice = prices[toCoin]?.price || 0;
  const amountUSD = parseFloat(amount || 0) * fromPrice;
  const outUSD = (quote?.expectedOut || 0) * toPrice;
  const priceImpact = quote ? ((amountUSD - outUSD) / amountUSD * 100) : 0;

  const slippageColor = !quote ? 'text-slate-400' : quote.slippage < 1 ? 'text-green-400' : quote.slippage < 3 ? 'text-yellow-400' : 'text-red-400';
  const impactColor = priceImpact < 0.5 ? 'text-green-400' : priceImpact < 2 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">Swap Kripto</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px]">Kurs Real-time · via THORChain</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">

          {/* FORM STEP */}
          {step === 'form' && (
            <>
              {/* From Box */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold">DARI</span>
                  {fromPrice > 0 && !priceLoading && (
                    <span className="text-slate-500 text-xs">
                      Harga: <span className="text-slate-300">${fromPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CoinButton coin={SWAP_COINS[fromCoin]} onClick={() => setPickerFor('from')} />
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-2xl font-bold text-right focus-visible:ring-0 p-0 h-auto placeholder:text-slate-700"
                  />
                </div>
                <div className="flex items-center justify-between">
                  {amount && fromPrice > 0
                    ? <span className="text-slate-500 text-xs">≈ ${amountUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    : <span />
                  }
                  <div className="flex gap-1.5">
                    {['25%', '50%', 'Max'].map(pct => (
                      <button key={pct} className="text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded-full transition-colors">
                        {pct}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex items-center justify-center -my-1 relative z-10">
                <button
                  onClick={handleSwapCoins}
                  className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center hover:bg-slate-700 hover:border-purple-500/50 transition-all shadow-lg"
                >
                  <ArrowDown className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* To Box */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold">KE</span>
                  {toPrice > 0 && !priceLoading && (
                    <span className="text-slate-500 text-xs">
                      Harga: <span className="text-slate-300">${toPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CoinButton coin={SWAP_COINS[toCoin]} onClick={() => setPickerFor('to')} />
                  <div className="flex-1 text-right">
                    {loading ? (
                      <div className="flex items-center justify-end gap-2">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        <span className="text-slate-500 text-sm">Menghitung…</span>
                      </div>
                    ) : (
                      <span className={`text-2xl font-bold ${quote ? 'text-green-400' : 'text-slate-700'}`}>
                        {quote ? quote.expectedOut.toFixed(6) : '0.0'}
                      </span>
                    )}
                  </div>
                </div>
                {quote && outUSD > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">≈ ${outUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    {destAddress && <div className="text-slate-600 text-[10px] font-mono">→ {destAddress.slice(0, 14)}…</div>}
                  </div>
                )}
              </div>

              {/* Real-time Rate */}
              <RateDisplay fromCoin={fromCoin} toCoin={toCoin} quote={quote} prices={prices} amount={amount} />

              {/* Quote Details */}
              {quote && (
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 text-[10px] font-semibold">DETAIL TRANSAKSI</span>
                    <div className="flex items-center gap-2">
                      <div className={`text-[10px] font-mono ${countdown <= 5 ? 'text-red-400' : 'text-slate-500'}`}>
                        Refresh {countdown}s
                      </div>
                      <button onClick={() => fetchQuote()} className="text-slate-500 hover:text-slate-300">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {[
                    { label: 'Slippage', value: `${quote.slippage.toFixed(2)}%`, color: slippageColor },
                    { label: 'Price Impact', value: `${Math.abs(priceImpact).toFixed(2)}%`, color: impactColor },
                    { label: 'Biaya Jaringan', value: `${quote.fees.toFixed(6)} ${fromCoin}`, color: 'text-white' },
                    { label: 'Estimasi Waktu', value: `~${Math.ceil((quote.totalTime || 30) / 60)} menit`, color: 'text-white' },
                    { label: 'Min. Diterima', value: `${(quote.minOut || 0).toFixed(6)} ${toCoin}`, color: 'text-slate-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className={`font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warning */}
              {quote?.warning && (
                <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-xs">{quote.warning}</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-300 text-xs">Swap non-custodial via THORChain. Private key Anda tidak pernah meninggalkan perangkat.</p>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!quote || loading || !amount || parseFloat(amount) <= 0}
                className="w-full h-12 text-white font-bold text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 shadow-lg shadow-purple-600/20"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Mendapatkan Kurs…</> : <>
                  <Zap className="w-4 h-4 mr-2" /> Review Swap
                </>}
              </Button>
            </>
          )}

          {/* CONFIRM STEP */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg">Konfirmasi Swap</h3>
                <p className="text-slate-500 text-sm">Periksa detail sebelum melanjutkan</p>
              </div>

              {/* Visual swap summary */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-1" style={{ background: SWAP_COINS[fromCoin].color }}>
                      {SWAP_COINS[fromCoin].icon}
                    </div>
                    <div className="text-white font-bold">{amount}</div>
                    <div className="text-slate-400 text-sm">{fromCoin}</div>
                    <div className="text-slate-500 text-xs">≈ ${amountUSD.toFixed(2)}</div>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <ArrowLeftRight className="w-6 h-6 text-purple-400" />
                    <div className="text-[10px] text-slate-500 mt-1">via THORChain</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-1" style={{ background: SWAP_COINS[toCoin].color }}>
                      {SWAP_COINS[toCoin].icon}
                    </div>
                    <div className="text-green-400 font-bold">{quote?.expectedOut?.toFixed(6)}</div>
                    <div className="text-slate-400 text-sm">{toCoin}</div>
                    <div className="text-slate-500 text-xs">≈ ${outUSD.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Detail table */}
              <div className="bg-slate-800/40 rounded-xl p-3 space-y-2 text-sm">
                {[
                  { label: 'Kurs', value: `1 ${fromCoin} ≈ ${(quote.expectedOut / parseFloat(amount)).toFixed(6)} ${toCoin}` },
                  { label: 'Slippage', value: `${quote?.slippage?.toFixed(2)}%`, color: slippageColor },
                  { label: 'Biaya Jaringan', value: `${quote?.fees?.toFixed(6)} ${fromCoin}`, color: 'text-white' },
                  { label: 'Estimasi Waktu', value: `~${Math.ceil((quote?.totalTime || 30) / 60)} menit`, color: 'text-white' },
                  { label: 'Min. Diterima', value: `${(quote?.minOut || 0).toFixed(6)} ${toCoin}`, color: 'text-slate-300' },
                ].map(({ label, value, color = 'text-white' }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
                <hr className="border-slate-700 my-1" />
                <div>
                  <div className="text-slate-400 text-xs mb-1">Vault THORChain (kirim ke sini):</div>
                  <div className="bg-slate-900 rounded-lg p-2 font-mono text-xs text-orange-400 break-all">{inboundAddr}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs mb-1">Memo (wajib disertakan):</div>
                  <div className="bg-slate-900 rounded-lg p-2 font-mono text-xs text-blue-400 break-all">{memo}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs">
                  Kirim tepat <strong>{amount} {fromCoin}</strong> ke vault di atas beserta memo. Transaksi bersifat irreversible.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep('form')} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Kembali
                </Button>
                <Button onClick={handleExecute} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Konfirmasi
                </Button>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Swap Dimulai!</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Kirim <span className="text-white font-semibold">{amount} {fromCoin}</span> ke vault THORChain untuk menyelesaikan swap.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Estimasi diterima</span>
                  <span className="text-green-400 font-bold">{quote?.expectedOut?.toFixed(6)} {toCoin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Waktu proses</span>
                  <span className="text-white font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{Math.ceil((quote?.totalTime || 30) / 60)} menit</span>
                </div>
                <hr className="border-slate-700" />
                <div>
                  <p className="text-slate-500 text-xs mb-1">Kirim ke vault:</p>
                  <code className="text-orange-400 font-mono text-xs break-all block bg-slate-900 p-2 rounded-lg">{inboundAddr}</code>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Memo:</p>
                  <code className="text-blue-400 font-mono text-xs break-all block bg-slate-900 p-2 rounded-lg">{memo}</code>
                </div>
              </div>

              <a href="https://www.thorchain.net/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-400 text-sm hover:underline">
                Pantau di THORChain Explorer <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button onClick={onClose} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold">
                Selesai
              </Button>
            </div>
          )}
        </div>
      </div>

      {pickerFor && (
        <CoinPicker
          selected={pickerFor === 'from' ? fromCoin : toCoin}
          exclude={pickerFor === 'from' ? toCoin : fromCoin}
          onSelect={(sym) => { if (pickerFor === 'from') setFromCoin(sym); else setToCoin(sym); setQuote(null); }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}