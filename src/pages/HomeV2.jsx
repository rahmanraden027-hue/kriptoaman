import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BrainCircuit, Eye, Globe2, Radio, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useLivePrices from '@/components/market/useLivePrices';
import HomePortfolioSummary from '@/components/home/HomePortfolioSummary';
import HomePortfolioPerformance from '@/components/home/HomePortfolioPerformance';
import HomeMarketOverview from '@/components/home/HomeMarketOverview';
import HomeMarketMovers from '@/components/home/HomeMarketMovers';
import HomeQuickActions from '@/components/home/HomeQuickActions';
import { useLanguage } from '@/lib/LanguageContext';

const AIInsightCard = lazy(() => import('@/components/home/AIInsightCard'));
const HomeNews = lazy(() => import('@/components/home/HomeNews'));
const HomeTradingViewSection = lazy(() => import('@/components/home/HomeTradingViewSection'));

const LoadingCard = () => <div className="h-28 rounded-[22px] ka-shimmer" aria-hidden="true" />;

const COPY = {
  id: {
    eyebrow: 'KRIPTOAMAN 2.0 · GLOBAL COMMAND CENTER',
    title: 'Intelijen aset digital. Satu pusat kendali.',
    body: 'Pantau pasar, portofolio, risiko, keamanan, dan insight berbasis data tanpa mengubah pipeline data yang sedang berjalan.',
    live: 'Data langsung',
    source: 'Source-aware',
    watch: 'Watch-only',
    intelligence: 'Buka Intelligence',
    markets: 'Jelajahi Pasar',
    marketPulse: 'Global Market Pulse',
    marketPulseBody: 'Ringkasan pasar dari sumber KriptoAman yang aktif, dengan fallback dan freshness metadata saat tersedia.',
    security: 'Security Posture',
    securityBody: 'Kontrol keamanan, sesi, dan status perlindungan tetap berada di Security Center.',
    integrity: 'Data Integrity',
    integrityBody: 'Harga dan sinyal tidak dibuat ketika sumber nyata tidak tersedia.',
    workspace: 'Workspace',
    workspaceBody: 'Market intelligence, portfolio monitoring, alerts, and security in one interface.',
    insights: 'Intelligence Stream',
  },
  en: {
    eyebrow: 'KRIPTOAMAN 2.0 · GLOBAL COMMAND CENTER',
    title: 'Digital asset intelligence. One command center.',
    body: 'Monitor markets, portfolio, risk, security, and data-driven insight without changing the production data pipeline.',
    live: 'Live data',
    source: 'Source-aware',
    watch: 'Watch-only',
    intelligence: 'Open Intelligence',
    markets: 'Explore Markets',
    marketPulse: 'Global Market Pulse',
    marketPulseBody: 'Market overview from active KriptoAman sources, with fallback and freshness metadata when available.',
    security: 'Security Posture',
    securityBody: 'Security controls, sessions, and protection status remain in the Security Center.',
    integrity: 'Data Integrity',
    integrityBody: 'Prices and signals are not fabricated when real sources are unavailable.',
    workspace: 'Workspace',
    workspaceBody: 'Market intelligence, portfolio monitoring, alerts, and security in one interface.',
    insights: 'Intelligence Stream',
  },
};

export default function HomeV2() {
  const { language } = useLanguage();
  const t = COPY[language] || COPY.id;
  const [user, setUser] = useState(null);
  const { prices, idrRate } = useLivePrices();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || (language === 'en' ? 'User' : 'Pengguna');

  return (
    <div className="ka-bg pb-5 text-white sm:pb-6 lg:pb-8">
      <div className="mx-auto max-w-7xl space-y-5 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-sky-400/20 bg-[#050d17]/92 shadow-[0_34px_100px_-48px_rgba(14,165,233,.82)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-28 -top-40 h-96 w-96 rounded-full bg-sky-500/16 blur-3xl" />
            <div className="absolute -bottom-44 left-[24%] h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,.22) 1px, transparent 1px),linear-gradient(90deg,rgba(56,189,248,.22) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
          </div>

          <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.25fr_.75fr] lg:p-9">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-sky-300">
                <Sparkles className="h-3.5 w-3.5" /> {t.eyebrow}
              </div>
              <p className="mt-5 text-xs font-semibold text-slate-400">{language === 'en' ? 'Welcome' : 'Selamat datang'}, {firstName}</p>
              <h1 className="mt-1 max-w-4xl text-3xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">{t.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{t.body}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-sky-200"><Radio className="h-3 w-3" />{t.live}</span>
                <span className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-cyan-200"><Activity className="h-3 w-3" />{t.source}</span>
                <span className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-200"><Eye className="h-3 w-3" />{t.watch}</span>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/IntelligenceHub" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 text-sm font-extrabold shadow-[0_18px_42px_-20px_rgba(56,189,248,.85)] transition hover:-translate-y-0.5 hover:brightness-110">
                  <BrainCircuit className="h-4 w-4" /> {t.intelligence}
                </Link>
                <Link to="/Market" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-slate-200 transition hover:border-sky-400/25 hover:bg-sky-400/[0.08]">
                  <TrendingUp className="h-4 w-4 text-sky-300" /> {t.markets}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-end">
              {[
                [Globe2, t.marketPulse, t.marketPulseBody, 'text-sky-300'],
                [ShieldCheck, t.security, t.securityBody, 'text-emerald-300'],
                [Activity, t.integrity, t.integrityBody, 'text-cyan-300'],
                [BrainCircuit, t.workspace, t.workspaceBody, 'text-violet-300'],
              ].map(([Icon, title, body, tone]) => (
                <div key={title} className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4 backdrop-blur-xl">
                  <Icon className={`h-5 w-5 ${tone}`} />
                  <h2 className="mt-4 text-[11px] font-extrabold text-white">{title}</h2>
                  <p className="mt-1 line-clamp-3 text-[9px] leading-4 text-slate-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <HomePortfolioSummary user={user} prices={prices} idrRate={idrRate} />
          <HomePortfolioPerformance user={user} prices={prices} />
        </section>

        <HomeQuickActions />

        <section className="grid gap-4 xl:grid-cols-12 xl:items-start">
          <div className="min-w-0 space-y-4 xl:col-span-8">
            <HomeMarketMovers />
            <div className="hidden md:block"><Suspense fallback={<LoadingCard />}><HomeTradingViewSection /></Suspense></div>
          </div>
          <aside className="min-w-0 space-y-4 xl:col-span-4 xl:sticky xl:top-24">
            <div className="mb-1 flex items-center justify-between px-1">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-300">KriptoAman 2.0</p>
                <h2 className="text-sm font-extrabold">{t.insights}</h2>
              </div>
              <Link to="/IntelligenceHub" className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300">{language === 'en' ? 'View all' : 'Lihat semua'}<ArrowRight className="h-3 w-3" /></Link>
            </div>
            <Suspense fallback={<LoadingCard />}><AIInsightCard /></Suspense>
            <HomeMarketOverview />
            <Suspense fallback={<LoadingCard />}><HomeNews /></Suspense>
          </aside>
        </section>
      </div>
    </div>
  );
}
