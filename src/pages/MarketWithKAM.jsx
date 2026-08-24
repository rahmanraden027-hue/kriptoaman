import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, CircleDollarSign, Network, Sparkles } from 'lucide-react';
import Market from './Market.jsx';
import { useLanguage } from '@/lib/LanguageContext';

const INDICATIVE_REFERENCE = 29.37;
const INDICATIVE_MOTION = [29.24, 29.31, 29.28, 29.35, INDICATIVE_REFERENCE, 29.33, 29.36, INDICATIVE_REFERENCE];

const COPY = {
  id: {
    kicker: 'KAM MARKET REFERENCE',
    title: 'KAM · Referensi Skenario Indikatif',
    status: 'Belum Diperdagangkan',
    motion: 'Simulasi indikatif · Bukan harga live',
    reference: 'Acuan referensi · US$29.37',
    body: 'Pergerakan angka ini adalah visualisasi skenario indikatif KAM, bukan data trading. Nilainya tetap terpisah dari harga pasar live dan tidak digunakan untuk market cap, P/L, nilai portofolio, atau ticker live.',
    cta: 'Buka KAM Global Roadmap',
    chain: 'KriptoAman Network · Chain ID 22028',
  },
  en: {
    kicker: 'KAM MARKET REFERENCE',
    title: 'KAM · Indicative Scenario Reference',
    status: 'Not Yet Trading',
    motion: 'Indicative simulation · Not a live price',
    reference: 'Reference anchor · US$29.37',
    body: 'The moving figure is a visual KAM scenario simulation, not trading data. It remains separate from live market pricing and is excluded from market cap, P/L, portfolio valuation, and live tickers.',
    cta: 'Open KAM Global Roadmap',
    chain: 'KriptoAman Network · Chain ID 22028',
  },
};

export default function MarketWithKAM() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [motionIndex, setMotionIndex] = useState(4);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const interval = window.setInterval(() => {
      setMotionIndex(index => (index + 1) % INDICATIVE_MOTION.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  const displayValue = useMemo(() => `US$${INDICATIVE_MOTION[motionIndex].toFixed(2)}`, [motionIndex]);

  return (
    <div className="min-h-screen ka-bg text-white">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 via-slate-950/80 to-sky-500/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(circle at 8% 0%, rgba(16,185,129,.16), transparent 32%), radial-gradient(circle at 92% 10%, rgba(56,189,248,.14), transparent 28%)' }} />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-emerald-300">
                <Sparkles className="h-4 w-4" /> {text.kicker}
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                <div>
                  <h2 className="text-xl font-black tracking-tight sm:text-2xl">{text.title}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <p
                      aria-live="polite"
                      className="text-3xl font-black tracking-[-0.04em] text-emerald-300 transition-all duration-500 sm:text-4xl"
                    >
                      {displayValue}
                    </p>
                    <span className="relative inline-flex h-2.5 w-2.5" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    </span>
                  </div>
                </div>
                <span className="mb-1 inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">
                  {text.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-sky-200">
                  <Activity className="h-3 w-3" /> {text.motion}
                </span>
                <span className="text-[10px] font-bold text-emerald-200/90">{text.reference}</span>
              </div>

              <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">{text.body}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                <Network className="h-3.5 w-3.5 text-sky-300" /> {text.chain}
              </p>
            </div>

            <a href="/KAMGlobalRoadmap" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black text-slate-950 shadow-[0_16px_42px_-22px_rgba(16,185,129,.9)] transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              <CircleDollarSign className="h-4 w-4" /> {text.cta} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
      <Market />
    </div>
  );
}
