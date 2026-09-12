import React, { useMemo, useState } from 'react';
import { Activity, Coins, Globe2, LineChart, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import useGlobalMarkets from './useGlobalMarkets';
import { useLanguage } from '@/lib/LanguageContext';

const COPY = {
  id: {
    eyebrow: 'GLOBAL MARKETS INTELLIGENCE',
    title: 'Crypto · Forex · Metals',
    body: 'Perluasan KriptoAman untuk membaca pasar lintas aset tanpa mengubah fokus utama pada intelijen aset digital dan verifikasi on-chain.',
    crypto: 'Crypto',
    forex: 'Forex',
    metals: 'Metals',
    reference: 'Referensi pasar',
    hourly: 'Pembaruan referensi berkala',
    unavailable: 'Data referensi global sementara belum tersedia',
    cached: 'Snapshot terakhir',
    live: 'Data tersedia',
    source: 'Sumber',
    focus: 'Instrumen utama',
    infoOnly: 'Informasi pasar saja · bukan harga eksekusi broker',
    noAdvice: 'Bukan rekomendasi investasi atau sinyal beli/jual.',
    changeUnavailable: 'Perubahan 24 jam belum tersedia dari sumber ini',
    goldBadge: 'METALS FOCUS',
    goldTitle: 'XAU/USD · Gold Intelligence',
    goldBody: 'Emas ditempatkan sebagai instrumen unggulan Metals untuk pemantauan lintas aset bersama crypto dan forex.',
  },
  en: {
    eyebrow: 'GLOBAL MARKETS INTELLIGENCE',
    title: 'Crypto · Forex · Metals',
    body: 'KriptoAman expands into cross-asset market intelligence while preserving digital-asset intelligence and on-chain verification as its core.',
    crypto: 'Crypto',
    forex: 'Forex',
    metals: 'Metals',
    reference: 'Market reference',
    hourly: 'Periodic reference refresh',
    unavailable: 'Global reference data is temporarily unavailable',
    cached: 'Last snapshot',
    live: 'Data available',
    source: 'Source',
    focus: 'Primary instruments',
    infoOnly: 'Market information only · not broker execution prices',
    noAdvice: 'Not investment advice or a buy/sell signal.',
    changeUnavailable: '24h change is unavailable from this source',
    goldBadge: 'METALS FOCUS',
    goldTitle: 'XAU/USD · Gold Intelligence',
    goldBody: 'Gold is positioned as the flagship Metals instrument for cross-asset monitoring alongside crypto and forex.',
  },
};

const formatPrice = item => {
  if (!Number.isFinite(Number(item?.price))) return '—';
  const precision = Number.isFinite(Number(item?.precision)) ? Number(item.precision) : 5;
  return Number(item.price).toLocaleString('en-US', {
    minimumFractionDigits: Math.min(precision, 2),
    maximumFractionDigits: precision,
  });
};

export default function GlobalMarketsHub() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const { data, instruments, loading, error, usingCache } = useGlobalMarkets();
  const [active, setActive] = useState('forex');

  const visible = useMemo(() => {
    if (active === 'metals') return instruments.filter(item => item.assetClass === 'metal');
    if (active === 'forex') return instruments.filter(item => item.assetClass === 'forex');
    return [];
  }, [active, instruments]);

  const xau = instruments.find(item => item.symbol === 'XAU/USD');
  const statusText = error && !instruments.length
    ? text.unavailable
    : usingCache
      ? text.cached
      : text.live;

  return (
    <section className="rounded-[26px] border border-emerald-400/15 bg-[#07111d]/86 p-4 shadow-[0_24px_70px_-40px_rgba(16,185,129,.55)] sm:p-5" aria-labelledby="global-markets-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
            <Globe2 className="h-3.5 w-3.5" /> {text.eyebrow}
          </p>
          <h2 id="global-markets-title" className="mt-1 text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">{text.title}</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">{text.body}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${error && !instruments.length ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`}>
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />} {statusText}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-bold text-sky-200">
            <ShieldCheck className="h-3.5 w-3.5" /> {text.reference}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/[0.06] bg-black/10 p-1.5 sm:w-fit sm:min-w-[360px]">
        <button type="button" onClick={() => setActive('crypto')} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${active === 'crypto' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>
          {text.crypto}
        </button>
        <button type="button" onClick={() => setActive('forex')} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${active === 'forex' ? 'bg-emerald-400 text-slate-950' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>
          {text.forex}
        </button>
        <button type="button" onClick={() => setActive('metals')} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${active === 'metals' ? 'bg-amber-300 text-slate-950' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>
          {text.metals}
        </button>
      </div>

      {active === 'crypto' ? (
        <div className="mt-4 rounded-2xl border border-sky-400/10 bg-sky-400/[0.035] p-4">
          <div className="flex items-center gap-2 text-sky-200"><Coins className="h-4 w-4" /><span className="text-xs font-black">KriptoAman Crypto Market</span></div>
          <p className="mt-2 text-xs leading-5 text-slate-400">{language === 'en' ? 'The existing crypto market remains unchanged below this section, including its current data lineage and watchlist flow.' : 'Pasar crypto yang sudah ada tetap dipertahankan tanpa perubahan di bawah bagian ini, termasuk sumber data dan alur watchlist saat ini.'}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {visible.length ? visible.map(item => (
            <article key={item.symbol} className={`rounded-2xl border p-3.5 ${item.assetClass === 'metal' ? 'border-amber-300/15 bg-amber-300/[0.04]' : 'border-white/[0.07] bg-white/[0.025]'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{item.symbol}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-slate-500">{item.assetClass}</p>
                </div>
                {item.assetClass === 'metal' ? <Sparkles className="h-4 w-4 text-amber-300" /> : <LineChart className="h-4 w-4 text-emerald-300" />}
              </div>
              <p className="mt-3 text-xl font-black tracking-[-0.03em] text-white">{formatPrice(item)}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">{item.name}</p>
              <p className="mt-2 text-[9px] leading-4 text-slate-600">{text.changeUnavailable}</p>
            </article>
          )) : (
            <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-4 text-xs text-amber-100">{text.unavailable}</div>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-amber-300/15 bg-[radial-gradient(circle_at_100%_0%,rgba(251,191,36,.10),transparent_34%),rgba(251,191,36,.035)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">{text.goldBadge}</p>
              <h3 className="mt-1 text-base font-black text-white">{text.goldTitle}</h3>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-amber-200">{xau ? `$${formatPrice(xau)}` : '—'}</p>
              <p className="text-[9px] text-slate-500">USD / troy oz</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">{text.goldBody}</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{text.source}</p>
          <p className="mt-1 text-sm font-black text-white">{data?.provider || '—'}</p>
          <p className="mt-1 text-[10px] text-slate-500">{text.hourly}</p>
          <div className="mt-3 space-y-1 text-[10px] leading-4 text-slate-500">
            <p>{text.infoOnly}</p>
            <p>{text.noAdvice}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
