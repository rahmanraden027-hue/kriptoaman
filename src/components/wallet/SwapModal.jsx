import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeftRight, ChevronDown, AlertTriangle, Info, Loader2, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { getSwapQuote, getInboundAddress, buildSwapMemo, SWAP_COINS } from './swapApi';
import { getPrices } from './multiCoinApi';

const COIN_LIST = Object.values(SWAP_COINS);

function CoinButton({ coin, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-xl px-3 py-2 transition-colors"
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: coin.color }}
      >
        {coin.icon}
      </span>
      <span className="text-white font-semibold text-sm">{coin.symbol}</span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
    </button>
  );
}

function CoinPicker({ selected, exclude, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl w-full max-w-md p-4 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">Pilih Token</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {COIN_LIST.filter(c => c.symbol !== exclude).map(coin => (
          <button
            key={coin.symbol}
            onClick={() => { onSelect(coin.symbol); onClose(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              selected === coin.symbol
                ? 'bg-slate-700 border-slate-500'
                : 'bg-slate-800/50 border-slate-700/30 hover:bg-slate-800'
            }`}
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: coin.color }}>
              {coin.icon}
            </span>
            <div className="text-left">
              <div className="text-white font-semibold text-sm">{coin.name}</div>
              <div className="text-slate-400 text-xs">{coin.symbol}</div>
            </div>
          </button>
        ))}
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
  const [pickerFor, setPickerFor] = useState(null); // 'from' | 'to'
  const quoteTimer = useRef(null);

  const destAddress = addresses?.[toCoin]?.address || '';

  useEffect(() => {
    getPrices().then(setPrices);
  }, []);

  // Auto-fetch quote when inputs change
  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); return; }
    quoteTimer.current = setTimeout(() => fetchQuote(), 700);
    return () => clearTimeout(quoteTimer.current);
  }, [fromCoin, toCoin, amount, destAddress]);

  const fetchQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError('');
    try {
      const q = await getSwapQuote({ fromCoin, toCoin, amount, destinationAddress: destAddress });
      setQuote(q);
    } catch (e) {
      setError('Gagal mendapatkan estimasi swap. Coba lagi.');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

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
      setInboundAddr(addr || '');
      setStep('confirm');
    } catch {
      setError('Gagal mendapatkan inbound address THORChain.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => {
    // The user will send the exact amount to inboundAddr with the memo
    // This is the THORChain non-custodial swap flow
    setStep('success');
  };

  const memo = destAddress ? buildSwapMemo(SWAP_COINS[toCoin].asset, destAddress) : '';
  const fromPrice = prices[fromCoin]?.price || 0;
  const toPrice = prices[toCoin]?.price || 0;
  const amountUSD = parseFloat(amount || 0) * fromPrice;
  const outUSD = (quote?.expectedOut || 0) * toPrice;

  const slippageColor =
    !quote ? 'text-slate-400' :
    quote.slippage < 1 ? 'text-green-400' :
    quote.slippage < 3 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">Swap Token</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">via THORChain</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-4 space-y-3">

          {step === 'form' && (
            <>
              {/* From */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Dari</span>
                  {fromPrice > 0 && amount && <span className="text-slate-500 text-xs">≈ ${amountUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <CoinButton coin={SWAP_COINS[fromCoin]} onClick={() => setPickerFor('from')} />
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-xl font-bold text-right focus-visible:ring-0 p-0 h-auto placeholder:text-slate-600"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  {['25%', '50%', '75%', 'Max'].map(pct => (
                    <button key={pct} className="text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded-full transition-colors">
                      {pct}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapCoins}
                  className="w-9 h-9 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* To */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Ke</span>
                  {outUSD > 0 && <span className="text-slate-500 text-xs">≈ ${outUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <CoinButton coin={SWAP_COINS[toCoin]} onClick={() => setPickerFor('to')} />
                  <div className="flex-1 text-right">
                    {loading ? (
                      <Loader2 className="w-5 h-5 text-slate-500 animate-spin ml-auto" />
                    ) : (
                      <span className={`text-xl font-bold ${quote ? 'text-white' : 'text-slate-600'}`}>
                        {quote ? quote.expectedOut.toFixed(8) : '0.0'}
                      </span>
                    )}
                  </div>
                </div>
                {destAddress && (
                  <div className="text-slate-600 text-xs font-mono truncate">→ {destAddress.slice(0, 20)}…</div>
                )}
              </div>

              {/* Quote Details */}
              {quote && (
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slippage</span>
                    <span className={`font-semibold ${slippageColor}`}>
                      {quote.slippage.toFixed(2)}%
                      {quote.slippage >= 3 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimasi waktu</span>
                    <span className="text-white">{Math.ceil((quote.outboundDelay || 30) / 60)} menit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Biaya jaringan</span>
                    <span className="text-white">{quote.fees.toFixed(6)} {fromCoin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rate</span>
                    <span className="text-white">
                      1 {fromCoin} ≈ {(quote.expectedOut / parseFloat(amount)).toFixed(6)} {toCoin}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-300 text-xs leading-relaxed">
                  Swap menggunakan protokol THORChain non-custodial. Anda mengirim ke alamat vault THORChain dengan memo khusus, dan menerima token tujuan di dompet Anda.
                </p>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!quote || loading || !amount}
                className="w-full h-12 text-white font-semibold text-base bg-purple-600 hover:bg-purple-700 disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Review Swap'}
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-center">Konfirmasi Swap</h3>

              <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kirim</span>
                  <span className="text-white font-semibold">{amount} {fromCoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Terima (est.)</span>
                  <span className="text-green-400 font-semibold">{quote?.expectedOut?.toFixed(8)} {toCoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slippage</span>
                  <span className={slippageColor}>{quote?.slippage?.toFixed(2)}%</span>
                </div>
                <hr className="border-slate-700" />
                <div>
                  <div className="text-slate-400 mb-1">Kirim ke vault THORChain:</div>
                  <div className="bg-slate-900 rounded-lg p-2 font-mono text-xs text-orange-400 break-all">{inboundAddr}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Dengan memo:</div>
                  <div className="bg-slate-900 rounded-lg p-2 font-mono text-xs text-blue-400 break-all">{memo}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs">
                  Kirim <strong>{amount} {fromCoin}</strong> ke alamat vault di atas dengan memo yang tepat menggunakan wallet {fromCoin} Anda. Transaksi tidak dapat dibatalkan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep('form')} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Kembali
                </Button>
                <Button onClick={handleExecute} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Konfirmasi
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Instruksi Swap Tersimpan</h3>
                <p className="text-slate-400 text-sm mt-1">Kirim {amount} {fromCoin} ke vault THORChain untuk menyelesaikan swap.</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kirim ke:</span>
                  <span className="text-orange-400 font-mono text-xs">{inboundAddr.slice(0, 20)}…</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jumlah:</span>
                  <span className="text-white font-semibold">{amount} {fromCoin}</span>
                </div>
                <div>
                  <span className="text-slate-400">Memo: </span>
                  <span className="text-blue-400 font-mono text-xs break-all">{memo}</span>
                </div>
              </div>
              <a
                href={`https://www.thorchain.net/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-400 text-sm hover:underline"
              >
                Pantau di THORChain Explorer <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
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
          onSelect={(sym) => {
            if (pickerFor === 'from') setFromCoin(sym);
            else setToCoin(sym);
            setQuote(null);
          }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}