import React, { useMemo } from 'react';
import { Activity, Gauge, Radio, TrendingDown, TrendingUp } from 'lucide-react';
import Market from './Market.jsx';
import useLivePrices from '@/components/market/useLivePrices';
import { useLanguage } from '@/lib/LanguageContext';

const COPY = {
  id: {
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
    disclaimer: 'Ringkasan dihitung hanya dari aset yang memiliki harga dan perubahan 24 jam. Bukan sinyal beli/jual atau rekomendasi investasi.',
  },
  en: {
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

      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <section className="rounded-[22px] border border-white/[0.07] bg-[#07111d]/80 p-3 sm:p-4" aria-labelledby="market-intelligence-title">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-sky-300">
                <Activity className="h-3.5 w-3.5" /> {text.intelligenceKicker}
              </p>
              <h1 id="market-intelligence-title" className="mt-1 text-base font-black sm:text-lg">{text.intelligenceTitle}</h1>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-bold ${connected ? 'border-emerald-400/20 bg-emerald-400/8 text-emerald-300' : 'border-slate-700/50 bg-slate-900/50 text-slate-300'}`}>
              <Radio className="h-3.5 w-3.5" /> {connected ? text.live : text.alternate}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex items-center justify-between"><Gauge className="h-4 w-4 text-sky-300" /><span className={`text-[10px] font-black ${breadthTone}`}>{breadthLabel}</span></div>
              <p className="mt-2 text-[8px] uppercase tracking-wide text-slate-500">{text.breadth}</p>
              <p className="mt-1 text-lg font-black text-white">{marketIntel.total ? `${marketIntel.breadth.toFixed(0)}%` : '—'}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-[8px] uppercase tracking-wide text-slate-500">{text.advancing}</p>
              <p className="mt-1 text-lg font-black">{marketIntel.advancing}</p>
            </div>
            <div className="rounded-xl border border-rose-400/10 bg-rose-400/[0.035] p-3">
              <TrendingDown className="h-4 w-4 text-rose-300" />
              <p className="mt-2 text-[8px] uppercase tracking-wide text-slate-500">{text.declining}</p>
              <p className="mt-1 text-lg font-black">{marketIntel.declining}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-[8px] uppercase tracking-wide text-slate-500">{text.strongest}</p>
              <p className="mt-1 truncate text-[12px] font-black">{marketIntel.strongest ? `${marketIntel.strongest.symbol} ${marketIntel.strongest.change24h >= 0 ? '+' : ''}${marketIntel.strongest.change24h.toFixed(2)}%` : '—'}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 sm:col-span-1">
              <TrendingDown className="h-4 w-4 text-rose-300" />
              <p className="mt-2 text-[8px] uppercase tracking-wide text-slate-500">{text.weakest}</p>
              <p className="mt-1 truncate text-[12px] font-black">{marketIntel.weakest ? `${marketIntel.weakest.symbol} ${marketIntel.weakest.change24h >= 0 ? '+' : ''}${marketIntel.weakest.change24h.toFixed(2)}%` : '—'}</p>
            </div>
          </div>

          <p className="mt-2 text-[9px] leading-4 text-slate-500">{text.disclaimer}</p>
        </section>
      </div>

      <Market compact />
    </div>
  );
}
