import React, { useMemo, useState } from 'react';
import { BarChart3, RefreshCcw, ShieldCheck, TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import useLivePrices from '@/components/market/useLivePrices';
import useCoinMarkets from '@/components/home/useCoinMarkets';
import { useLanguage } from '@/lib/LanguageContext';
import {
  PAPER_STARTING_CASH,
  calculatePaperMetrics,
  createPaperAccount,
  executePaperTrade,
  loadPaperAccount,
  savePaperAccount,
} from '@/lib/paperTrading';

const FALLBACK_ASSETS = [
  { sym: 'BTC', name: 'Bitcoin' }, { sym: 'ETH', name: 'Ethereum' },
  { sym: 'BNB', name: 'BNB' }, { sym: 'SOL', name: 'Solana' },
  { sym: 'XRP', name: 'XRP' }, { sym: 'ADA', name: 'Cardano' },
  { sym: 'DOGE', name: 'Dogecoin' }, { sym: 'LINK', name: 'Chainlink' },
];

const COPY = {
  id: {
    eyebrow: 'SIMULASI · TANPA DANA NYATA', title: 'KriptoAman Paper Trading',
    subtitle: 'Latihan spot trading dengan saldo virtual dan harga pasar KriptoAman. Tidak ada deposit, withdrawal, private key, atau transaksi blockchain.',
    virtualCash: 'Kas Virtual', equity: 'Nilai Portofolio', totalPnl: 'Total P/L', realized: 'P/L Terealisasi',
    asset: 'Aset', price: 'Harga pasar', amount: 'Nilai order virtual (USD)', buy: 'BELI VIRTUAL', sell: 'JUAL VIRTUAL',
    noPrice: 'Harga pasar belum tersedia untuk aset ini.', simulation: 'Simulation Only — No Real Funds',
    positions: 'Posisi Virtual', history: 'Riwayat Simulasi', emptyPositions: 'Belum ada posisi virtual.', emptyHistory: 'Belum ada transaksi simulasi.',
    reset: 'Reset Portofolio', resetConfirm: 'Reset seluruh saldo, posisi, dan riwayat paper trading ke US$100.000?',
    successBuy: 'Pembelian virtual berhasil dicatat.', successSell: 'Penjualan virtual berhasil dicatat.',
    deviceOnly: 'V1 disimpan hanya pada perangkat/browser ini dan terpisah dari wallet serta saldo nyata.',
    nonTradableKam: 'KAM tidak dimasukkan sampai tersedia harga pasar live yang dapat diverifikasi.',
  },
  en: {
    eyebrow: 'SIMULATION · NO REAL FUNDS', title: 'KriptoAman Paper Trading',
    subtitle: 'Practice spot trading with virtual funds and KriptoAman market prices. No deposits, withdrawals, private keys, or blockchain transactions.',
    virtualCash: 'Virtual Cash', equity: 'Portfolio Equity', totalPnl: 'Total P/L', realized: 'Realized P/L',
    asset: 'Asset', price: 'Market price', amount: 'Virtual order value (USD)', buy: 'VIRTUAL BUY', sell: 'VIRTUAL SELL',
    noPrice: 'Market price is not available for this asset yet.', simulation: 'Simulation Only — No Real Funds',
    positions: 'Virtual Positions', history: 'Simulation History', emptyPositions: 'No virtual positions yet.', emptyHistory: 'No simulated trades yet.',
    reset: 'Reset Portfolio', resetConfirm: 'Reset all paper trading cash, positions, and history to US$100,000?',
    successBuy: 'Virtual buy recorded.', successSell: 'Virtual sell recorded.',
    deviceOnly: 'V1 is stored only on this device/browser and is isolated from real wallets and balances.',
    nonTradableKam: 'KAM is excluded until a verifiable live market price is available.',
  },
};

const usd = (value, max = 2) => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: max });
const qty = (value) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 8 });

export default function PaperTrading() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const { prices: liveData } = useLivePrices();
  const { markets, coins: marketCoins } = useCoinMarkets();
  const [account, setAccount] = useState(() => loadPaperAccount());
  const [symbol, setSymbol] = useState('BTC');
  const [amount, setAmount] = useState('1000');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const assets = useMemo(() => {
    const source = marketCoins?.length ? marketCoins : FALLBACK_ASSETS;
    const seen = new Set();
    return source
      .map((coin) => ({ sym: String(coin.sym || coin.symbol || '').toUpperCase(), name: coin.name || coin.sym || coin.symbol }))
      .filter((coin) => coin.sym && coin.sym !== 'KAM' && !seen.has(coin.sym) && seen.add(coin.sym))
      .filter((coin) => Number(liveData?.[coin.sym]?.price ?? markets?.[coin.sym]?.price) > 0)
      .slice(0, 250);
  }, [marketCoins, liveData, markets]);

  const selected = assets.find((asset) => asset.sym === symbol) || FALLBACK_ASSETS.find((asset) => asset.sym === symbol) || { sym: symbol, name: symbol };
  const currentPrice = Number(liveData?.[symbol]?.price ?? markets?.[symbol]?.price ?? 0);
  const priceBySymbol = useMemo(() => {
    const map = {};
    for (const positionSymbol of Object.keys(account.positions || {})) {
      map[positionSymbol] = Number(liveData?.[positionSymbol]?.price ?? markets?.[positionSymbol]?.price ?? account.positions[positionSymbol]?.avgPrice ?? 0);
    }
    return map;
  }, [account.positions, liveData, markets]);
  const metrics = useMemo(() => calculatePaperMetrics(account, priceBySymbol), [account, priceBySymbol]);

  const trade = (side) => {
    setMessage('');
    setError('');
    try {
      const result = executePaperTrade(account, {
        side,
        symbol,
        name: selected.name,
        price: currentPrice,
        usdAmount: Number(amount),
      });
      const saved = savePaperAccount(result.account);
      setAccount(saved);
      setMessage(side === 'buy' ? text.successBuy : text.successSell);
    } catch (err) {
      setError(err?.message || 'Paper order failed');
    }
  };

  const reset = () => {
    if (!window.confirm(text.resetConfirm)) return;
    const fresh = savePaperAccount(createPaperAccount());
    setAccount(fresh);
    setMessage('');
    setError('');
  };

  const pnlClass = (value) => Number(value) >= 0 ? 'text-emerald-300' : 'text-rose-300';

  return (
    <div className="min-h-screen ka-bg text-white pb-28">
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-slate-950/65 p-5 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,.17),transparent_38%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,.09),transparent_36%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-emerald-200">{text.eyebrow}</span>
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-bold text-sky-200">SPOT · 1:1 · NO LEVERAGE</span>
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-4xl">{text.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{text.subtitle}</p>
            <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3"><ShieldCheck className="mb-2 h-4 w-4 text-emerald-300" />{text.deviceOnly}</div>
              <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-3"><ShieldCheck className="mb-2 h-4 w-4 text-amber-300" />{text.nonTradableKam}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [text.virtualCash, metrics.cash, WalletCards],
            [text.equity, metrics.equity, BarChart3],
            [text.totalPnl, metrics.totalPnl, metrics.totalPnl >= 0 ? TrendingUp : TrendingDown],
            [text.realized, metrics.realizedPnl, metrics.realizedPnl >= 0 ? TrendingUp : TrendingDown],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-sky-400/12 bg-[#07111d]/90 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400"><span>{label}</span><Icon className="h-4 w-4 text-sky-300" /></div>
              <div className={`mt-2 text-xl font-black ${label.includes('P/L') ? pnlClass(value) : 'text-white'}`}>{usd(value)}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[24px] border border-sky-400/15 bg-[#07111d]/90 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[.14em] text-sky-300">Paper Order</p><p className="mt-1 text-xs text-slate-500">{text.simulation}</p></div>
            </div>
            <label className="text-xs font-semibold text-slate-300">{text.asset}</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-400">
              {(assets.length ? assets : FALLBACK_ASSETS).map((asset) => <option key={asset.sym} value={asset.sym}>{asset.sym} · {asset.name}</option>)}
            </select>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-500">{text.price}</p>
              <p className="mt-1 text-xl font-black">{currentPrice > 0 ? usd(currentPrice, currentPrice < 1 ? 8 : 2) : '—'}</p>
            </div>

            <label className="mt-4 block text-xs font-semibold text-slate-300">{text.amount}</label>
            <input type="number" inputMode="decimal" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white outline-none focus:border-sky-400" />

            {!currentPrice && <p className="mt-3 text-xs text-amber-300">{text.noPrice}</p>}
            {message && <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/8 p-3 text-xs text-emerald-200">{message}</p>}
            {error && <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/8 p-3 text-xs text-rose-200">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => trade('buy')} disabled={!currentPrice} className="min-h-12 rounded-xl bg-emerald-500 px-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{text.buy}</button>
              <button onClick={() => trade('sell')} disabled={!currentPrice} className="min-h-12 rounded-xl bg-rose-500 px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{text.sell}</button>
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-400/15 bg-[#07111d]/90 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-black">{text.positions}</h2><p className="text-xs text-slate-500">{metrics.positions.length} assets</p></div><button onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-300 hover:border-rose-400/40 hover:text-rose-200"><RefreshCcw className="h-3.5 w-3.5" />{text.reset}</button></div>
            <div className="mt-4 space-y-2">
              {!metrics.positions.length && <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">{text.emptyPositions}</div>}
              {metrics.positions.map((position) => (
                <div key={position.symbol} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/55 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                  <div><p className="font-black">{position.symbol}</p><p className="text-[11px] text-slate-500">{qty(position.quantity)} · avg {usd(position.avgPrice, position.avgPrice < 1 ? 8 : 2)}</p></div>
                  <div className="sm:text-right"><p className="text-[10px] text-slate-500">Market</p><p className="text-sm font-bold">{usd(position.currentPrice, position.currentPrice < 1 ? 8 : 2)}</p></div>
                  <div className="sm:text-right"><p className="text-[10px] text-slate-500">Value</p><p className="text-sm font-bold">{usd(position.marketValue)}</p></div>
                  <div className="sm:text-right"><p className="text-[10px] text-slate-500">Unrealized P/L</p><p className={`text-sm font-black ${pnlClass(position.unrealizedPnl)}`}>{usd(position.unrealizedPnl)}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-sky-400/15 bg-[#07111d]/90 p-4 sm:p-5">
          <h2 className="font-black">{text.history}</h2>
          <div className="mt-4 space-y-2">
            {!account.trades.length && <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">{text.emptyHistory}</div>}
            {account.trades.slice(0, 50).map((trade) => (
              <div key={trade.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                <div className="flex items-center gap-3"><span className={`rounded-lg px-2 py-1 text-[10px] font-black ${trade.side === 'buy' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>{trade.side.toUpperCase()}</span><div><p className="text-sm font-bold">{trade.symbol}</p><p className="text-[10px] text-slate-500">{new Date(trade.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}</p></div></div>
                <div className="text-right"><p className="text-sm font-black">{usd(trade.usdAmount)}</p><p className="text-[10px] text-slate-500">{qty(trade.quantity)} @ {usd(trade.price, trade.price < 1 ? 8 : 2)}</p></div>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-center text-xs font-bold text-emerald-200"><ShieldCheck className="mr-2 inline h-4 w-4" />{text.simulation} · Starting virtual cash {usd(PAPER_STARTING_CASH)}</div>
      </div>
    </div>
  );
}
