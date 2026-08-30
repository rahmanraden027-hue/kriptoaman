import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BrainCircuit, CircleDollarSign, FlaskConical, Gauge, Network, Radio, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import Market from './Market.jsx';
import useLivePrices from '@/components/market/useLivePrices';
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
    paper: 'Paper Trading',
    intelligenceKicker: 'MARKET INTELLIGENCE',
    intelligenceTitle: 'Konteks Pasar Langsung',
    breadth: 'Market Breadth',
    advancing: 'Menguat',
    declining: 'Melemah',
    neutral: 'Netral',
    strongest: 'Penguatan Terbesar',
    weakest: 'Pelemahan Terbesar',
    feed: 'Status Feed',
    live: 'Live',
    alternate: 'Data tersedia',
    disclaimer: 'Ringkasan ini dihitung dari aset yang memiliki data harga dan perubahan 24 jam. Bukan sinyal beli/jual atau rekomendasi investasi.',
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
    paper: 'Paper Trading',
    intelligenceKicker: 'MARKET INTELLIGENCE',
    intelligenceTitle: 'Live Market Context',
    breadth: 'Market Breadth',
    advancing: 'Advancing',
    declining: 'Declining',
    neutral: 'Neutral',
    strongest: 'Strongest Mover',
    weakest: 'Weakest Mover',
    feed: 'Feed Status',
    live: 'Live',
    alternate: 'Data available',
    disclaimer: 'This summary is calculated only from assets with available price and 24h-change data. It is not a buy/sell signal or investment advice.',
  },
};

export default function MarketWithKAM() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const { prices, connected } = useLivePrices();

  const marketIntel = useMemo(() => {
    const entries = Object.entries(prices || {})
      .map(([symbol, data]) => ({ symbol, change24h: Number(data?.change24h), price: Number(data?.price) }))
      .filter((item) => Number.isFinite(item.price) && item.price > 0 && Number.isFinite(item.change24h));

    const advancing = entries.filter((item) => item.change24h > 0.05).length;
    const declining = entries.filter((item) => item.change24h < -0.05).length;
    const neutral = Math.max(0, entries.length - advancing - declining);
    const sorted = [...entries].sort((a, b) => b.change24h - a.change24h);
    const strongest = sorted[0] || null;
    const weakest = sorted[sorted.length - 1] || null;
    const breadth = entries.length ? ((advancing - declining) / entries.length) * 100 : 0;

    return { total: entries.length, advancing, declining, neutral, strongest, weakest, breadth };
  }, [prices]);

  const breadthLabel = marketIntel.breadth > 15 ? text.advancing : marketIntel.breadth < -15 ? text.declining : text.neutral;
  const breadthTone = marketIntel.breadth > 15 ? 'text-emerald-300' : marketIntel.breadth < -15 ? 'text-rose-300' : 'text-amber-300';

  return (
    <div className="ka-market-shell ka-bg text-white">
      <style>{`
        .ka-market-shell > .ka-bg.min-h-screen {
          min-height: auto !important;
          padding-bottom: 0.75rem !important;
        }
        @media (min-width: 1024px) {
          .ka-market-shell > .ka-bg.min-h-screen {
            padding-bottom: 1.5rem !important;
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-3 px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
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

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row xl:flex-wrap xl:justify-end">
              <Link to="/PaperTrading" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 text-xs font-black text-emerald-200 transition hover:border-emerald-300/45 hover:bg-emerald-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                <FlaskConical className="h-4 w-4" /> {text.paper}
              </Link>
              <Link to="/IntelligenceHub" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 text-xs font-bold text-sky-200 transition hover:border-sky-300/40 hover:bg-sky-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                <BrainCircuit className="h-4 w-4" /> {text.intelligence}
              </Link>
              <Link to="/KAMGlobalRoadmap" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-black text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                <CircleDollarSign className="h-4 w-4" /> {text.roadmap} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/[0.07] bg-[#07111d]/80 p-4 sm:p-5" aria-labelledby="market-intelligence-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-sky-300"><Activity className="h-3.5 w-3.5" />{text.intelligenceKicker}</p>
              <h2 id="market-intelligence-title" className="mt-1 text-base font-black sm:text-lg">{text.intelligenceTitle}</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${connected ? 'border-emerald-400/20 bg-emerald-400/8 text-emerald-300' : 'border-slate-700/50 bg-slate-900/50 text-slate-300'}`}>
              <Radio className="h-3.5 w-3.5" /> {text.feed}: {connected ? text.live : text.alternate}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex items-center justify-between"><Gauge className="h-4 w-4 text-sky-300" /><span className={`text-xs font-black ${breadthTone}`}>{breadthLabel}</span></div>
              <p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{text.breadth}</p>
              <p className="mt-1 text-xl font-black text-white">{marketIntel.total ? `${marketIntel.breadth.toFixed(0)}%` : '—'}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3"><TrendingUp className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{text.advancing}</p><p className="mt-1 text-xl font-black">{marketIntel.advancing}</p></div>
            <div className="rounded-2xl border border-rose-400/10 bg-rose-400/[0.035] p-3"><TrendingDown className="h-4 w-4 text-rose-300" /><p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{text.declining}</p><p className="mt-1 text-xl font-black">{marketIntel.declining}</p></div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><TrendingUp className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{text.strongest}</p><p className="mt-1 text-sm font-black">{marketIntel.strongest ? `${marketIntel.strongest.symbol} ${marketIntel.strongest.change24h >= 0 ? '+' : ''}${marketIntel.strongest.change24h.toFixed(2)}%` : '—'}</p></div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><TrendingDown className="h-4 w-4 text-rose-300" /><p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{text.weakest}</p><p className="mt-1 text-sm font-black">{marketIntel.weakest ? `${marketIntel.weakest.symbol} ${marketIntel.weakest.change24h >= 0 ? '+' : ''}${marketIntel.weakest.change24h.toFixed(2)}%` : '—'}</p></div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{text.disclaimer}</p>
        </section>
      </div>
      <Market />
    </div>
  );
}
