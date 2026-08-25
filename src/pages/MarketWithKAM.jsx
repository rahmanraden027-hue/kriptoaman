import React from 'react';
import { ArrowRight, BrainCircuit, CircleDollarSign, Network, ShieldCheck } from 'lucide-react';
import Market from './Market.jsx';
import { useLanguage } from '@/lib/LanguageContext';

const INDICATIVE_REFERENCE = 29.37;
const formatIndicativeReference = () => `US$${INDICATIVE_REFERENCE.toFixed(2)}`;

const COPY = {
  id: {
    eyebrow: 'KAM NETWORK REFERENCE',
    title: 'KAM · Referensi Ekosistem',
    status: 'BELUM DIPERDAGANGKAN',
    reference: 'Skenario indikatif · bukan harga live',
    body: 'US$29.37 adalah acuan skenario internal yang terpisah dari harga pasar live. Nilai ini tidak digunakan untuk market cap, P/L, valuasi portofolio, atau ticker pasar.',
    network: 'KriptoAman Network · Chain ID 22028',
    networkState: 'Mainnet candidate · belum dipromosikan sebagai jaringan publik',
    roadmap: 'Roadmap KAM',
    intelligence: 'Intelligence Hub',
  },
  en: {
    eyebrow: 'KAM NETWORK REFERENCE',
    title: 'KAM · Ecosystem Reference',
    status: 'NOT YET TRADING',
    reference: 'Indicative scenario · not a live price',
    body: 'US$29.37 is an internal scenario reference kept separate from live market pricing. It is excluded from market cap, P/L, portfolio valuation, and market tickers.',
    network: 'KriptoAman Network · Chain ID 22028',
    networkState: 'Mainnet candidate · not promoted as a public network',
    roadmap: 'KAM Roadmap',
    intelligence: 'Intelligence Hub',
  },
};

export default function MarketWithKAM() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;

  return (
    <div className="min-h-screen ka-bg text-white">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <section className="relative overflow-hidden rounded-[24px] border border-sky-400/15 bg-[#07111d]/82 px-4 py-4 shadow-[0_20px_60px_-38px_rgba(14,165,233,.65)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,.12),transparent_38%),radial-gradient(circle_at_100%_100%,rgba(34,211,238,.07),transparent_34%)]" />
          <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.14em] text-sky-300">
                  <Network className="h-3.5 w-3.5" /> {text.eyebrow}
                </span>
                <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.11em] text-amber-200">
                  {text.status}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.025em] text-white sm:text-xl">{text.title}</h2>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-black tracking-[-0.04em] text-sky-300 sm:text-3xl">{formatIndicativeReference()}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{text.reference}</span>
                  </div>
                </div>
              </div>

              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400 sm:text-sm">{text.body}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-400">
                <span className="inline-flex items-center gap-1.5"><Network className="h-3.5 w-3.5 text-sky-300" /> {text.network}</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> {text.networkState}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <a href="/IntelligenceHub" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 text-xs font-bold text-sky-200 transition hover:border-sky-300/40 hover:bg-sky-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                <BrainCircuit className="h-4 w-4" /> {text.intelligence}
              </a>
              <a href="/KAMGlobalRoadmap" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-black text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                <CircleDollarSign className="h-4 w-4" /> {text.roadmap} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
      <Market />
    </div>
  );
}
