import React, { useMemo } from 'react';
import { Activity, Radio, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import useLivePrices from '@/components/market/useLivePrices';
import { useLanguage } from '@/lib/LanguageContext';
import PaperTradingV2 from './PaperTradingV2.jsx';

const COPY = {
  id: {
    kicker: 'KRIPTOAMAN TRADING WORKSPACE',
    title: 'Simulation-First Trading Workspace',
    subtitle: 'Workspace analitik untuk latihan keputusan trading menggunakan saldo virtual. Tidak terhubung ke dana nyata, private key, atau eksekusi blockchain.',
    live: 'Market feed',
    guard: 'Risk guardrails',
    virtual: 'Virtual execution only',
    marketContext: 'Live Market Context',
    safety: 'Simulation Guardrails',
    rules: [
      'Tidak ada deposit atau withdrawal dana nyata.',
      'Tidak meminta private key atau seed phrase.',
      'Order, SL, dan TP hanya simulasi lokal.',
      'Harga yang tidak tersedia tidak boleh digunakan untuk membuka order.',
    ],
    source: 'Sumber harga: feed pasar yang tersedia di KriptoAman.',
  },
  en: {
    kicker: 'KRIPTOAMAN TRADING WORKSPACE',
    title: 'Simulation-First Trading Workspace',
    subtitle: 'An analytical workspace for practicing trading decisions with virtual funds. It is not connected to real funds, private keys, or blockchain execution.',
    live: 'Market feed',
    guard: 'Risk guardrails',
    virtual: 'Virtual execution only',
    marketContext: 'Live Market Context',
    safety: 'Simulation Guardrails',
    rules: [
      'No real-money deposits or withdrawals.',
      'No private key or seed phrase requests.',
      'Orders, SL, and TP remain local simulations.',
      'Unavailable prices cannot be used to open an order.',
    ],
    source: 'Price source: market feeds available to KriptoAman.',
  },
};

const fmt = (value) => {
  const n = Number(value || 0);
  if (!n) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1 ? 6 : 2,
  });
};

export default function PaperTradingV3() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const { prices, connected } = useLivePrices();

  const market = useMemo(() => ['BTC', 'ETH', 'SOL', 'BNB'].map((symbol) => ({
    symbol,
    price: Number(prices?.[symbol]?.price || 0),
    change: Number(prices?.[symbol]?.change24h || 0),
  })), [prices]);

  return (
    <div className="ka-bg min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-3 px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <section className="relative overflow-hidden rounded-[24px] border border-violet-400/15 bg-[linear-gradient(135deg,rgba(7,14,29,.98),rgba(6,10,22,.98))] p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative grid gap-4 xl:grid-cols-[1.15fr_.85fr] xl:items-start">
            <div>
              <p className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-violet-300"><Sparkles className="h-3.5 w-3.5" />{text.kicker}</p>
              <h1 className="mt-2 text-2xl font-black tracking-[-.03em] sm:text-3xl">{text.title}</h1>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400 sm:text-sm">{text.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${connected ? 'border-emerald-400/20 bg-emerald-400/8 text-emerald-300' : 'border-amber-400/20 bg-amber-400/8 text-amber-300'}`}><Radio className="h-3.5 w-3.5" />{text.live}: {connected ? 'LIVE' : 'FALLBACK'}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-3 py-1.5 text-[10px] font-bold text-cyan-300"><ShieldCheck className="h-3.5 w-3.5" />{text.guard}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-400/8 px-3 py-1.5 text-[10px] font-bold text-violet-300"><Activity className="h-3.5 w-3.5" />{text.virtual}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {market.map((item) => {
                const up = item.change >= 0;
                return (
                  <div key={item.symbol} className="rounded-2xl border border-white/7 bg-white/[0.035] p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-black">{item.symbol}</span>{up ? <TrendingUp className="h-4 w-4 text-emerald-300" /> : <TrendingDown className="h-4 w-4 text-rose-300" />}</div>
                    <p className="mt-2 text-sm font-black text-white">{fmt(item.price)}</p>
                    <p className={`mt-1 text-[10px] font-bold ${up ? 'text-emerald-300' : 'text-rose-300'}`}>{item.price ? `${item.change.toFixed(2)}% / 24h` : 'No verified price'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[22px] border border-sky-400/12 bg-[#07111d]/90 p-4">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-sky-300">{text.marketContext}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{text.source}</p>
          </div>
          <div className="rounded-[22px] border border-emerald-400/12 bg-[#07111d]/90 p-4">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-300">{text.safety}</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{text.rules.map((rule) => <div key={rule} className="flex items-start gap-2 text-[11px] leading-4 text-slate-400"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />{rule}</div>)}</div>
          </div>
        </section>
      </div>

      <PaperTradingV2 />
    </div>
  );
}
