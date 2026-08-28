import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCcw, ShieldCheck, Target, TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import useLivePrices from '@/components/market/useLivePrices';
import useCoinMarkets from '@/components/home/useCoinMarkets';
import { useLanguage } from '@/lib/LanguageContext';
import {
  PAPER_STARTING_CASH,
  calculatePaperMetrics,
  calculatePaperPerformance,
  createPaperAccount,
  evaluatePaperRiskOrders,
  executePaperTrade,
  loadPaperAccount,
  recordPaperEquitySnapshot,
  savePaperAccount,
  setPaperRiskOrder,
} from '@/lib/paperTrading';

const FALLBACK_ASSETS = [
  { sym: 'BTC', name: 'Bitcoin' }, { sym: 'ETH', name: 'Ethereum' },
  { sym: 'BNB', name: 'BNB' }, { sym: 'SOL', name: 'Solana' },
  { sym: 'XRP', name: 'XRP' }, { sym: 'ADA', name: 'Cardano' },
  { sym: 'DOGE', name: 'Dogecoin' }, { sym: 'LINK', name: 'Chainlink' },
];

const COPY = {
  id: {
    eyebrow: 'SIMULASI · TANPA DANA NYATA', title: 'KriptoAman Paper Trading', version: 'V2 · Risk & Performance',
    subtitle: 'Latihan spot trading dengan saldo virtual dan harga pasar KriptoAman. Tidak ada deposit, withdrawal, private key, atau transaksi blockchain.',
    virtualCash: 'Kas Virtual', equity: 'Nilai Portofolio', totalPnl: 'Total P/L', realized: 'P/L Terealisasi',
    asset: 'Aset', price: 'Harga pasar', amount: 'Nilai order virtual (USD)', buy: 'BELI VIRTUAL', sell: 'JUAL VIRTUAL',
    simulation: 'Simulation Only — No Real Funds', positions: 'Posisi Virtual', history: 'Riwayat Simulasi',
    reset: 'Reset Portofolio', resetConfirm: 'Reset seluruh saldo, posisi, risk order, dan riwayat paper trading ke US$100.000?',
    successBuy: 'Pembelian virtual berhasil dicatat.', successSell: 'Penjualan virtual berhasil dicatat.',
    triggeredStop: 'Stop-Loss virtual terpicu.', triggeredTake: 'Take-Profit virtual terpicu.',
    analytics: 'Performance Analytics', equityCurve: 'Equity Curve', winRate: 'Win Rate', maxDrawdown: 'Max Drawdown',
    closedTrades: 'Closed Trades', bestTrade: 'Best Trade', worstTrade: 'Worst Trade', profitFactor: 'Profit Factor',
    risk: 'Risk Control Virtual', position: 'Posisi', stopLoss: 'Stop-Loss', takeProfit: 'Take-Profit', saveRisk: 'SIMPAN RISK CONTROL', clearRisk: 'HAPUS TARGET',
    riskNote: 'SL/TP hanya simulasi dan dievaluasi saat halaman Paper Trading aktif serta menerima pembaruan harga. Ini bukan order bursa nyata.',
    deviceOnly: 'Data tetap disimpan terpisah pada perangkat/browser ini dan tidak terhubung ke wallet atau saldo nyata.',
    kam: 'KAM tetap dikecualikan sampai tersedia harga pasar live yang dapat diverifikasi.',
    noPositions: 'Belum ada posisi virtual.', noHistory: 'Belum ada transaksi simulasi.', noRiskPosition: 'Buka posisi virtual terlebih dahulu untuk mengatur SL/TP.',
  },
  en: {
    eyebrow: 'SIMULATION · NO REAL FUNDS', title: 'KriptoAman Paper Trading', version: 'V2 · Risk & Performance',
    subtitle: 'Practice spot trading with virtual funds and KriptoAman market prices. No deposits, withdrawals, private keys, or blockchain transactions.',
    virtualCash: 'Virtual Cash', equity: 'Portfolio Equity', totalPnl: 'Total P/L', realized: 'Realized P/L',
    asset: 'Asset', price: 'Market price', amount: 'Virtual order value (USD)', buy: 'VIRTUAL BUY', sell: 'VIRTUAL SELL',
    simulation: 'Simulation Only — No Real Funds', positions: 'Virtual Positions', history: 'Simulation History',
    reset: 'Reset Portfolio', resetConfirm: 'Reset all paper cash, positions, risk orders, and history to US$100,000?',
    successBuy: 'Virtual buy recorded.', successSell: 'Virtual sell recorded.',
    triggeredStop: 'Virtual Stop-Loss triggered.', triggeredTake: 'Virtual Take-Profit triggered.',
    analytics: 'Performance Analytics', equityCurve: 'Equity Curve', winRate: 'Win Rate', maxDrawdown: 'Max Drawdown',
    closedTrades: 'Closed Trades', bestTrade: 'Best Trade', worstTrade: 'Worst Trade', profitFactor: 'Profit Factor',
    risk: 'Virtual Risk Control', position: 'Position', stopLoss: 'Stop-Loss', takeProfit: 'Take-Profit', saveRisk: 'SAVE RISK CONTROL', clearRisk: 'CLEAR TARGETS',
    riskNote: 'SL/TP is simulated and evaluated only while Paper Trading is active and receiving price updates. It is not a real exchange order.',
    deviceOnly: 'Data remains isolated on this device/browser and is not connected to real wallets or balances.',
    kam: 'KAM remains excluded until a verifiable live market price is available.',
    noPositions: 'No virtual positions yet.', noHistory: 'No simulated trades yet.', noRiskPosition: 'Open a virtual position first to configure SL/TP.',
  },
};

const usd = (value, max = 2) => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: max });
const pct = (value) => `${Number(value || 0).toFixed(2)}%`;
const qty = (value) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 8 });

export default function PaperTradingV2() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const { prices: liveData } = useLivePrices();
  const { markets, coins: marketCoins } = useCoinMarkets();
  const [account, setAccount] = useState(() => loadPaperAccount());
  const [symbol, setSymbol] = useState('BTC');
  const [amount, setAmount] = useState('1000');
  const [riskSymbol, setRiskSymbol] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
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

  const currentPrice = Number(liveData?.[symbol]?.price ?? markets?.[symbol]?.price ?? 0);
  const selected = assets.find((asset) => asset.sym === symbol) || { sym: symbol, name: symbol };

  const priceBySymbol = useMemo(() => {
    const map = {};
    for (const positionSymbol of Object.keys(account.positions || {})) {
      map[positionSymbol] = Number(liveData?.[positionSymbol]?.price ?? markets?.[positionSymbol]?.price ?? account.positions[positionSymbol]?.avgPrice ?? 0);
    }
    return map;
  }, [account.positions, liveData, markets]);

  const metrics = useMemo(() => calculatePaperMetrics(account, priceBySymbol), [account, priceBySymbol]);
  const performance = useMemo(() => calculatePaperPerformance(account), [account]);

  useEffect(() => {
    if (!riskSymbol && metrics.positions[0]?.symbol) setRiskSymbol(metrics.positions[0].symbol);
  }, [riskSymbol, metrics.positions]);

  useEffect(() => {
    if (!riskSymbol) return;
    const risk = account.riskOrders?.[riskSymbol];
    setStopLoss(risk?.stopLossPrice ? String(risk.stopLossPrice) : '');
    setTakeProfit(risk?.takeProfitPrice ? String(risk.takeProfitPrice) : '');
  }, [riskSymbol, account.riskOrders]);

  useEffect(() => {
    if (!Object.keys(account.riskOrders || {}).length) return;
    const evaluated = evaluatePaperRiskOrders(account, priceBySymbol);
    if (!evaluated.triggered.length) return;
    const nextMetrics = calculatePaperMetrics(evaluated.account, priceBySymbol);
    const withSnapshot = recordPaperEquitySnapshot(evaluated.account, nextMetrics.equity, 'risk-trigger');
    const saved = savePaperAccount(withSnapshot);
    setAccount(saved);
    const reason = evaluated.triggered[0]?.triggerReason;
    setMessage(reason === 'stop-loss' ? text.triggeredStop : text.triggeredTake);
  }, [priceBySymbol]); // intentional: evaluate only on market-price changes

  const trade = (side) => {
    setMessage(''); setError('');
    try {
      const result = executePaperTrade(account, { side, symbol, name: selected.name, price: currentPrice, usdAmount: Number(amount) });
      const postMetrics = calculatePaperMetrics(result.account, { ...priceBySymbol, [symbol]: currentPrice });
      const saved = savePaperAccount(recordPaperEquitySnapshot(result.account, postMetrics.equity, 'trade'));
      setAccount(saved);
      setMessage(side === 'buy' ? text.successBuy : text.successSell);
    } catch (err) { setError(err?.message || 'Paper order failed'); }
  };

  const saveRisk = () => {
    setMessage(''); setError('');
    try {
      const saved = savePaperAccount(setPaperRiskOrder(account, {
        symbol: riskSymbol,
        stopLossPrice: stopLoss ? Number(stopLoss) : null,
        takeProfitPrice: takeProfit ? Number(takeProfit) : null,
      }));
      setAccount(saved);
      setMessage(language === 'en' ? 'Virtual risk control saved.' : 'Risk control virtual berhasil disimpan.');
    } catch (err) { setError(err?.message || 'Risk control failed'); }
  };

  const clearRisk = () => {
    if (!riskSymbol) return;
    try {
      const saved = savePaperAccount(setPaperRiskOrder(account, { symbol: riskSymbol }));
      setAccount(saved); setStopLoss(''); setTakeProfit('');
    } catch (err) { setError(err?.message || 'Risk control failed'); }
  };

  const reset = () => {
    if (!window.confirm(text.resetConfirm)) return;
    setAccount(savePaperAccount(createPaperAccount()));
    setMessage(''); setError(''); setRiskSymbol(''); setStopLoss(''); setTakeProfit('');
  };

  const pnlClass = (value) => Number(value) >= 0 ? 'text-emerald-300' : 'text-rose-300';
  const chartData = [...performance.equityHistory, { equity: metrics.equity, createdAt: new Date().toISOString(), source: 'live' }].map((point, index) => ({ ...point, index }));

  return (
    <div className="min-h-screen ka-bg text-white pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      <div className="mx-auto max-w-7xl space-y-3 px-3 py-2 sm:space-y-4 sm:px-6 sm:py-4 lg:px-8">
        <section className="relative overflow-hidden rounded-[22px] border border-sky-400/20 bg-slate-950/65 p-4 sm:rounded-[28px] sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,.17),transparent_38%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,.09),transparent_36%)]" />
          <div className="relative">
            <div className="flex flex-wrap gap-2"><span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black tracking-[.12em] text-emerald-200">{text.eyebrow}</span><span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-bold text-sky-200">{text.version}</span></div>
            <h1 className="mt-3 text-[1.45rem] font-black tracking-[-.035em] sm:text-4xl">{text.title}</h1>
            <p className="mt-2 max-w-3xl text-[13px] leading-5 text-slate-400 sm:text-sm sm:leading-6">{text.subtitle}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2"><div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3"><ShieldCheck className="mb-1.5 h-4 w-4 text-emerald-300" />{text.deviceOnly}</div><div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-3"><ShieldCheck className="mb-1.5 h-4 w-4 text-amber-300" />{text.kam}</div></div>
          </div>
        </section>

        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[[text.virtualCash, metrics.cash, WalletCards], [text.equity, metrics.equity, BarChart3], [text.totalPnl, metrics.totalPnl, metrics.totalPnl >= 0 ? TrendingUp : TrendingDown], [text.realized, metrics.realizedPnl, metrics.realizedPnl >= 0 ? TrendingUp : TrendingDown]].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-sky-400/12 bg-[#07111d]/90 p-3.5 sm:p-4"><div className="flex items-center justify-between text-xs text-slate-400"><span>{label}</span><Icon className="h-4 w-4 text-sky-300" /></div><div className={`mt-1.5 text-xl font-black ${label.includes('P/L') ? pnlClass(value) : 'text-white'}`}>{usd(value)}</div></div>
          ))}
        </section>

        <section className="grid gap-3 xl:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[22px] border border-sky-400/15 bg-[#07111d]/90 p-4">
            <p className="text-xs font-black uppercase tracking-[.14em] text-sky-300">Paper Order</p><p className="mt-1 text-xs text-slate-500">{text.simulation}</p>
            <label className="mt-4 block text-xs font-semibold text-slate-300">{text.asset}</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-[16px] text-white outline-none focus:border-sky-400">{(assets.length ? assets : FALLBACK_ASSETS).map((asset) => <option key={asset.sym} value={asset.sym}>{asset.sym} · {asset.name}</option>)}</select>
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[11px] text-slate-500">{text.price}</p><p className="mt-1 text-xl font-black">{currentPrice > 0 ? usd(currentPrice, currentPrice < 1 ? 8 : 2) : '—'}</p></div>
            <label className="mt-3 block text-xs font-semibold text-slate-300">{text.amount}</label>
            <input type="number" inputMode="decimal" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-[16px] text-white outline-none focus:border-sky-400" />
            {message && <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/8 p-3 text-xs text-emerald-200">{message}</p>}
            {error && <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/8 p-3 text-xs text-rose-200">{error}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => trade('buy')} disabled={!currentPrice} className="min-h-12 rounded-xl bg-emerald-500 text-xs font-black text-slate-950 disabled:opacity-40">{text.buy}</button><button onClick={() => trade('sell')} disabled={!currentPrice} className="min-h-12 rounded-xl bg-rose-500 text-xs font-black text-white disabled:opacity-40">{text.sell}</button></div>
          </div>

          <div className="rounded-[22px] border border-sky-400/15 bg-[#07111d]/90 p-4">
            <div className="flex items-center gap-2"><Target className="h-4 w-4 text-sky-300" /><h2 className="font-black">{text.risk}</h2></div>
            {!metrics.positions.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">{text.noRiskPosition}</p> : <>
              <label className="mt-4 block text-xs font-semibold text-slate-300">{text.position}</label>
              <select value={riskSymbol} onChange={(e) => setRiskSymbol(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-[16px] text-white">{metrics.positions.map((p) => <option key={p.symbol} value={p.symbol}>{p.symbol} · avg {usd(p.avgPrice)}</option>)}</select>
              <div className="mt-3 grid grid-cols-2 gap-2"><div><label className="text-xs text-slate-400">{text.stopLoss}</label><input type="number" inputMode="decimal" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00" className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-[16px] text-white" /></div><div><label className="text-xs text-slate-400">{text.takeProfit}</label><input type="number" inputMode="decimal" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="0.00" className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-[16px] text-white" /></div></div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><button onClick={saveRisk} className="min-h-12 rounded-xl bg-sky-500 px-3 text-xs font-black text-slate-950">{text.saveRisk}</button><button onClick={clearRisk} className="min-h-12 rounded-xl border border-slate-700 px-3 text-xs font-bold text-slate-300">{text.clearRisk}</button></div>
            </>}
            <p className="mt-3 text-[11px] leading-5 text-amber-200/80">{text.riskNote}</p>
          </div>
        </section>

        <section className="rounded-[22px] border border-sky-400/15 bg-[#07111d]/90 p-4">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-black">{text.analytics}</h2><p className="mt-1 text-xs text-slate-500">{text.equityCurve}</p></div><span className={`text-sm font-black ${pnlClass(metrics.totalReturnPct)}`}>{pct(metrics.totalReturnPct)}</span></div>
          <div className="mt-3 h-40 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><YAxis hide domain={['auto', 'auto']} /><Tooltip formatter={(value) => usd(value)} labelFormatter={() => ''} contentStyle={{ background: '#07111d', border: '1px solid rgba(56,189,248,.2)', borderRadius: 12 }} /><Line type="monotone" dataKey="equity" stroke="#38bdf8" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{[[text.winRate, pct(performance.winRate)], [text.maxDrawdown, pct(performance.maxDrawdownPct)], [text.closedTrades, performance.closedTrades], [text.bestTrade, usd(performance.bestTrade)], [text.worstTrade, usd(performance.worstTrade)], [text.profitFactor, Number.isFinite(performance.profitFactor) ? performance.profitFactor.toFixed(2) : '∞']].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/55 p-3"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}</div>
        </section>

        <section className="rounded-[22px] border border-sky-400/15 bg-[#07111d]/90 p-4">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-black">{text.positions}</h2><p className="text-xs text-slate-500">{metrics.positions.length} assets</p></div><button onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-300"><RefreshCcw className="h-3.5 w-3.5" />{text.reset}</button></div>
          <div className="mt-3 space-y-2">{!metrics.positions.length && <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">{text.noPositions}</div>}{metrics.positions.map((position) => { const risk = account.riskOrders?.[position.symbol]; return <div key={position.symbol} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/55 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div><p className="font-black">{position.symbol}</p><p className="text-[11px] text-slate-500">{qty(position.quantity)} · avg {usd(position.avgPrice)}</p>{risk && <p className="mt-1 text-[10px] text-sky-300">SL {risk.stopLossPrice ? usd(risk.stopLossPrice) : '—'} · TP {risk.takeProfitPrice ? usd(risk.takeProfitPrice) : '—'}</p>}</div><div><p className="text-[10px] text-slate-500">Market</p><p className="text-sm font-bold">{usd(position.currentPrice)}</p></div><div><p className="text-[10px] text-slate-500">Value</p><p className="text-sm font-bold">{usd(position.marketValue)}</p></div><div><p className="text-[10px] text-slate-500">Unrealized P/L</p><p className={`text-sm font-black ${pnlClass(position.unrealizedPnl)}`}>{usd(position.unrealizedPnl)}</p></div></div>; })}</div>
        </section>

        <section className="rounded-[22px] border border-sky-400/15 bg-[#07111d]/90 p-4"><h2 className="font-black">{text.history}</h2><div className="mt-3 space-y-2">{!account.trades.length && <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">{text.noHistory}</div>}{account.trades.slice(0, 50).map((trade) => <div key={trade.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-3"><div><span className={`rounded-lg px-2 py-1 text-[10px] font-black ${trade.side === 'buy' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>{trade.side.toUpperCase()}</span><span className="ml-2 font-bold">{trade.symbol}</span>{trade.triggerReason && <span className="ml-2 text-[10px] font-bold text-amber-300">{trade.triggerReason}</span>}<p className="mt-1 text-[11px] text-slate-500">{qty(trade.quantity)} @ {usd(trade.price)}</p></div><div className="text-right"><p className="font-bold">{usd(trade.usdAmount)}</p>{trade.side === 'sell' && <p className={`text-[11px] font-bold ${pnlClass(trade.realizedPnl)}`}>{usd(trade.realizedPnl)}</p>}</div></div>)}</div></section>
      </div>
    </div>
  );
}
