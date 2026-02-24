import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBtcPrice } from './bitcoinApi';
import { satoshiToBtc, btcToSatoshi } from './walletUtils';
import { X, TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

// Trading is simulated (P2P/exchange simulation) — real BTC swap requires CEX API integration
// This implements a "limit order" simulation tracking buy/sell history in localStorage

const TRADE_KEY = 'btc_trades';

function loadTrades() {
  try { return JSON.parse(localStorage.getItem(TRADE_KEY) || '[]'); } catch { return []; }
}

function saveTrade(trade) {
  const trades = loadTrades();
  trades.unshift({ ...trade, id: Date.now(), date: new Date().toISOString() });
  localStorage.setItem(TRADE_KEY, JSON.stringify(trades.slice(0, 100)));
}

export { loadTrades };

export default function TradeModal({ wallet, onClose, onTradeComplete, balanceSatoshi }) {
  const [mode, setMode] = useState('buy'); // buy | sell
  const [price, setPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [step, setStep] = useState('form'); // form | confirm | success | error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tradeData, setTradeData] = useState(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
        const data = await res.json();
        setPrice(data.bitcoin?.usd || null);
        setPriceChange(data.bitcoin?.usd_24h_change || null);
      } catch {}
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const balanceBtc = parseFloat(satoshiToBtc(balanceSatoshi || 0));
  const balanceUsd = price ? (balanceBtc * price) : 0;

  const handleUsdChange = (val) => {
    setUsdAmount(val);
    if (price && val) setBtcAmount((parseFloat(val) / price).toFixed(8));
    else setBtcAmount('');
  };

  const handleBtcChange = (val) => {
    setBtcAmount(val);
    if (price && val) setUsdAmount((parseFloat(val) * price).toFixed(2));
    else setUsdAmount('');
  };

  const FEE_PERCENT = 0.5; // 0.5% simulated exchange fee

  const btcVal = parseFloat(btcAmount) || 0;
  const usdVal = parseFloat(usdAmount) || 0;
  const feeUsd = usdVal * (FEE_PERCENT / 100);
  const feeBtc = btcVal * (FEE_PERCENT / 100);

  const handleReview = () => {
    setErrorMsg('');
    if (!btcVal || btcVal <= 0) { setErrorMsg('Masukkan jumlah yang valid'); return; }
    if (mode === 'sell' && btcVal > balanceBtc) { setErrorMsg('Saldo BTC tidak mencukupi'); return; }
    if (mode === 'buy' && usdVal < 10) { setErrorMsg('Minimal pembelian $10'); return; }
    setTradeData({ mode, btcAmount: btcVal, usdAmount: usdVal, price, feeUsd, feeBtc });
    setStep('confirm');
  };

  const handleExecute = async () => {
    setLoading(true);
    // Simulate network delay for "exchange"
    await new Promise(r => setTimeout(r, 1800));
    saveTrade({
      mode,
      btcAmount: tradeData.btcAmount,
      usdAmount: tradeData.usdAmount,
      price: tradeData.price,
      fee: tradeData.feeUsd,
      status: 'completed',
    });
    setStep('success');
    setLoading(false);
    onTradeComplete && onTradeComplete({
      type: mode,
      btc: tradeData.btcAmount,
      usd: tradeData.usdAmount,
    });
  };

  const isBuy = mode === 'buy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={step !== 'success' ? onClose : undefined}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {step === 'form' && 'Trading'}
            {step === 'confirm' && 'Konfirmasi Order'}
            {step === 'success' && 'Order Berhasil!'}
            {step === 'error' && 'Order Gagal'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {step === 'form' && (
          <>
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setMode('buy')}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${isBuy ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Beli BTC
              </button>
              <button
                onClick={() => setMode('sell')}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${!isBuy ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Jual BTC
              </button>
            </div>

            {/* Price Info */}
            {price && (
              <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
                <div>
                  <p className="text-slate-400 text-xs">Harga BTC</p>
                  <p className="text-white font-bold">${price.toLocaleString()}</p>
                </div>
                {priceChange !== null && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(priceChange).toFixed(2)}% 24j
                  </div>
                )}
              </div>
            )}

            {/* Balance */}
            <div className="text-sm text-slate-400">
              {isBuy
                ? <span>Saldo USD simulasi: <span className="text-white">$1,000.00</span></span>
                : <span>Saldo BTC: <span className="text-white">{balanceBtc.toFixed(8)}</span> ≈ <span className="text-slate-300">${balanceUsd.toFixed(2)}</span></span>
              }
            </div>

            {/* Amount Inputs */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="number"
                  value={usdAmount}
                  onChange={e => handleUsdChange(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white pr-14"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-medium">USD</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-slate-500 text-xs px-2">≈</span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={btcAmount}
                  onChange={e => handleBtcChange(e.target.value)}
                  placeholder="0.00000000"
                  className="bg-slate-800 border-slate-700 text-white pr-14"
                  step="0.00000001"
                />
                <span className="absolute right-3 top-2.5 text-orange-400 text-sm font-medium">BTC</span>
              </div>
            </div>

            {/* Quick amounts */}
            {isBuy && (
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 100, 500].map(amt => (
                  <button key={amt} onClick={() => handleUsdChange(String(amt))}
                    className="text-xs py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:border-orange-500/50 hover:text-white transition-all">
                    ${amt}
                  </button>
                ))}
              </div>
            )}
            {!isBuy && (
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 75, 100].map(pct => (
                  <button key={pct} onClick={() => handleBtcChange((balanceBtc * pct / 100).toFixed(8))}
                    className="text-xs py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:border-orange-500/50 hover:text-white transition-all">
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Info className="w-3 h-3 shrink-0" />
              <span>Fee transaksi 0.5%. Trading bersifat simulasi — tidak memindahkan BTC nyata.</span>
            </div>

            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

            <Button
              onClick={handleReview}
              className={`w-full text-white ${isBuy ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isBuy ? 'Beli Bitcoin' : 'Jual Bitcoin'}
            </Button>
          </>
        )}

        {step === 'confirm' && tradeData && (
          <>
            <div className={`p-3 rounded-xl border text-center ${isBuy ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <p className={`text-sm font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                {isBuy ? '🟢 Order Beli' : '🔴 Order Jual'}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Jumlah BTC</span><span className="text-white">{tradeData.btcAmount.toFixed(8)} BTC</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Harga</span><span className="text-white">${tradeData.price?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white">${tradeData.usdAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Fee (0.5%)</span><span className="text-white">${tradeData.feeUsd.toFixed(2)}</span></div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
                <span className="text-slate-300">Total</span>
                <span className={isBuy ? 'text-green-400' : 'text-red-400'}>
                  ${(tradeData.usdAmount + (isBuy ? tradeData.feeUsd : -tradeData.feeUsd)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Ubah</Button>
              <Button onClick={handleExecute} disabled={loading} className={`flex-1 text-white ${isBuy ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</> : 'Konfirmasi'}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && tradeData && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
            <div>
              <p className="text-white font-semibold">{isBuy ? 'Pembelian' : 'Penjualan'} berhasil!</p>
              <p className="text-slate-400 text-sm mt-1">
                {isBuy
                  ? `${tradeData.btcAmount.toFixed(8)} BTC berhasil dibeli seharga $${tradeData.usdAmount.toFixed(2)}`
                  : `${tradeData.btcAmount.toFixed(8)} BTC berhasil dijual seharga $${tradeData.usdAmount.toFixed(2)}`
                }
              </p>
            </div>
            <Button onClick={onClose} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Tutup</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
            <p className="text-red-400 text-sm">{errorMsg}</p>
            <Button onClick={() => setStep('form')} className="w-full bg-slate-700 hover:bg-slate-600 text-white">Coba Lagi</Button>
          </div>
        )}
      </div>
    </div>
  );
}