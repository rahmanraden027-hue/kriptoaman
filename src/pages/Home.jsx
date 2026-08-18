import React, { lazy, Suspense, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import useLivePrices from '../components/market/useLivePrices';
import {
  Shield,
  ChevronRight,
  Radio,
  Eye,
  UserRound,
  Sparkles,
  Globe2,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import HomePortfolioSummary from '../components/home/HomePortfolioSummary';
import HomeQuickActions from '../components/home/HomeQuickActions';
import HomeMarketOverview from '../components/home/HomeMarketOverview';
import HomePortfolioPerformance from '../components/home/HomePortfolioPerformance';
import HomeMarketMovers from '../components/home/HomeMarketMovers';
import { useLanguage } from '../lib/LanguageContext';

const HomeTradingViewSection = lazy(() => import('../components/home/HomeTradingViewSection'));
const AIInsightCard = lazy(() => import('../components/home/AIInsightCard'));
const WhaleAlertCard = lazy(() => import('../components/home/WhaleAlertCard'));
const HomeNews = lazy(() => import('../components/home/HomeNews'));
const HomeLearningCenter = lazy(() => import('../components/home/HomeLearningCenter'));
const HomeFooter = lazy(() => import('../components/home/HomeFooter'));

const DeferredFallback = () => <div className="h-24 ka-shimmer rounded-[20px]" aria-hidden="true" />;

const COPY = {
  id: {
    summary: 'Intelijen pasar, portofolio, keamanan, dan pemantauan aset dalam satu workspace.',
    live: 'Data langsung',
    watch: 'Mode pemantauan',
    kycPending: 'KYC sedang ditinjau',
    kycStart: 'Lengkapi KYC untuk akses yang sesuai',
    leadership: 'Kepemimpinan',
    founderRole: 'Founder & CEO KriptoAman',
    aboutFounder: 'Tentang Founder',
    heroEyebrow: 'GLOBAL CRYPTO INTELLIGENCE',
    heroTitle: 'KriptoAman Intelligence Workspace',
    heroBody: 'Pantau pasar, aset, risiko, dan keamanan dari satu pusat kendali modern yang dirancang untuk keputusan lebih cepat dan lebih terukur.',
    openMarket: 'Buka Intelijen Pasar',
    openSecurity: 'Pusat Keamanan',
    statusGlobal: 'Pasar Global',
    statusSecurity: 'Keamanan',
    statusAI: 'AI Insight',
    statusPortfolio: 'Portofolio',
    online: 'Aktif',
    monitored: 'Terpantau',
  },
  en: {
    summary: 'Market intelligence, portfolio, security, and asset monitoring in one workspace.',
    live: 'Live data',
    watch: 'Watch-only mode',
    kycPending: 'KYC is under review',
    kycStart: 'Complete KYC for eligible access',
    leadership: 'Leadership',
    founderRole: 'Founder & CEO of KriptoAman',
    aboutFounder: 'About the Founder',
    heroEyebrow: 'GLOBAL CRYPTO INTELLIGENCE',
    heroTitle: 'KriptoAman Intelligence Workspace',
    heroBody: 'Monitor markets, assets, risk, and security from one modern command center designed for faster and more measured decisions.',
    openMarket: 'Open Market Intelligence',
    openSecurity: 'Security Center',
    statusGlobal: 'Global Market',
    statusSecurity: 'Security',
    statusAI: 'AI Insight',
    statusPortfolio: 'Portfolio',
    online: 'Active',
    monitored: 'Monitored',
  },
};

export default function Home() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const { prices, idrRate } = useLivePrices();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setKycStatus(u?.kycStatus);
    }).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (language === 'en') {
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      return 'Good evening';
    }
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  return (
    <div className="ka-bg min-h-screen text-white pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-[#07111d]/90 shadow-[0_28px_80px_-36px_rgba(14,165,233,0.7)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 right-[-5%] h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="absolute -bottom-40 left-[18%] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.13]" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.18) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
          </div>

          <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.45fr_.9fr] lg:p-8">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.18em] text-sky-300">
                <Sparkles className="h-3.5 w-3.5" /> {text.heroEyebrow}
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-400">{greeting()}, {user?.full_name?.split(' ')[0] || (language === 'en' ? 'User' : 'Pengguna')}</p>
                <h1 className="mt-1 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                  {text.heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  {text.heroBody}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-sky-300"><Radio className="h-3 w-3" /> {text.live}</span>
                <span className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-cyan-300"><Eye className="h-3 w-3" /> {text.watch}</span>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to={createPageUrl('Market')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300/30 bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_-14px_rgba(14,165,233,.75)] transition hover:-translate-y-0.5 hover:brightness-110">
                  <TrendingUp className="h-4 w-4" /> {text.openMarket}
                </Link>
                <Link to={createPageUrl('SecurityHub')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-sky-400/25 hover:bg-sky-400/10 hover:text-white">
                  <ShieldCheck className="h-4 w-4 text-sky-300" /> {text.openSecurity}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-end">
              {[
                [Globe2, text.statusGlobal, text.online, 'text-sky-300', 'bg-sky-500/10 border-sky-400/20'],
                [ShieldCheck, text.statusSecurity, text.online, 'text-emerald-300', 'bg-emerald-500/10 border-emerald-400/20'],
                [BrainCircuit, text.statusAI, text.monitored, 'text-violet-300', 'bg-violet-500/10 border-violet-400/20'],
                [Wallet, text.statusPortfolio, text.monitored, 'text-cyan-300', 'bg-cyan-500/10 border-cyan-400/20'],
              ].map(([Icon, label, value, iconClass, cardClass]) => (
                <div key={label} className={`rounded-2xl border p-4 backdrop-blur-xl ${cardClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <Icon className={`h-5 w-5 ${iconClass}`} />
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />
                  </div>
                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-extrabold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {kycStatus !== 'approved' && (
          <Link to={createPageUrl('KYC')} className="flex items-center justify-between ka-surface ka-surface-hover p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-500/25 bg-yellow-500/10"><Shield className="h-4 w-4 text-yellow-400" /></div>
              <span className="text-xs font-semibold text-yellow-200">{kycStatus === 'pending' ? text.kycPending : text.kycStart}</span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-yellow-400" />
          </Link>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-start">
          <main className="min-w-0 space-y-4 xl:col-span-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HomePortfolioSummary user={user} prices={prices} idrRate={idrRate} />
              <HomePortfolioPerformance user={user} prices={prices} />
            </div>
            <HomeQuickActions />
            <div className="hidden md:block"><Suspense fallback={<DeferredFallback />}><HomeTradingViewSection /></Suspense></div>
            <HomeMarketMovers />
          </main>

          <aside className="min-w-0 space-y-4 xl:col-span-4 xl:sticky xl:top-24">
            <div className="rounded-[22px] border border-sky-400/15 bg-gradient-to-br from-sky-500/[0.08] via-[#081421]/80 to-indigo-500/[0.06] p-1 shadow-[0_20px_60px_-34px_rgba(14,165,233,.7)]">
              <Suspense fallback={<DeferredFallback />}><AIInsightCard /></Suspense>
            </div>
            <Suspense fallback={<DeferredFallback />}><WhaleAlertCard /></Suspense>
            <HomeMarketOverview />
            <Suspense fallback={<DeferredFallback />}><HomeNews /></Suspense>
            <Suspense fallback={<DeferredFallback />}><HomeLearningCenter /></Suspense>
          </aside>
        </div>

        <section className="ka-surface px-4 py-3 sm:px-5 sm:py-4 !mt-10" aria-labelledby="founder-leadership-title">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 shadow-[0_0_24px_-10px_rgba(56,189,248,.8)]">
              <UserRound className="h-4.5 w-4.5 text-sky-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sky-300">{text.leadership}</p>
              <h2 id="founder-leadership-title" className="truncate text-sm font-extrabold text-white sm:text-base">Raden Abdul Rahman, M.Sc.</h2>
              <p className="truncate text-[10px] font-semibold text-slate-400 sm:text-[11px]">{text.founderRole}</p>
            </div>
            <Link to={createPageUrl('Founder')} className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-sky-500/25 bg-sky-500/10 px-2.5 py-2 text-[10px] font-semibold text-sky-300 transition-colors hover:bg-sky-500/15">
              {text.aboutFounder}<ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        <Suspense fallback={null}><HomeFooter /></Suspense>
      </div>
    </div>
  );
}
