import React from 'react';
import { ArrowRight, CircleDollarSign, Network, Sparkles } from 'lucide-react';
import Market from './Market.jsx';
import { useLanguage } from '@/lib/LanguageContext';

const COPY = {
  id: {
    kicker: 'KAM MARKET REFERENCE',
    title: 'KAM · Referensi Skenario Indikatif',
    value: 'US$29.37',
    status: 'Belum Diperdagangkan',
    body: 'Referensi skenario indikatif berbasis arah fundamental KAM. Nilai ini ditampilkan terpisah dari harga pasar live dan tidak digunakan untuk market cap, P/L, nilai portofolio, atau ticker live.',
    cta: 'Buka KAM Global Roadmap',
    chain: 'KriptoAman Network · Chain ID 22028',
  },
  en: {
    kicker: 'KAM MARKET REFERENCE',
    title: 'KAM · Indicative Scenario Reference',
    value: 'US$29.37',
    status: 'Not Yet Trading',
    body: 'An indicative scenario reference tied to KAM fundamental direction. It is displayed separately from live market pricing and is excluded from market cap, P/L, portfolio valuation, and live tickers.',
    cta: 'Open KAM Global Roadmap',
    chain: 'KriptoAman Network · Chain ID 22028',
  },
};

export default function MarketWithKAM() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;

  return (
    <div className="min-h-screen ka-bg text-white">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 via-slate-950/80 to-sky-500/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(circle at 8% 0%, rgba(16,185,129,.16), transparent 32%), radial-gradient(circle at 92% 10%, rgba(56,189,248,.14), transparent 28%)' }} />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-emerald-300">
                <Sparkles className="h-4 w-4" /> {text.kicker}
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <div>
                  <h2 className="text-xl font-black tracking-tight sm:text-2xl">{text.title}</h2>
                  <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-emerald-300 sm:text-4xl">{text.value}</p>
                </div>
                <span className="mb-1 inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">
                  {text.status}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-400 sm:text-sm">{text.body}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500"><Network className="h-3.5 w-3.5" /> {text.chain}</p>
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
