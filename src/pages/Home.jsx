import React, { lazy, Suspense, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import useLivePrices from '../components/market/useLivePrices';
import { Shield, ChevronRight, Radio, Eye } from 'lucide-react';
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
    summary: 'Ringkasan pasar, portofolio, dan keamanan dalam satu layar.',
    live: 'Data langsung', watch: 'Mode pemantauan', kycPending: 'KYC sedang ditinjau',
    kycStart: 'Lengkapi KYC untuk akses yang sesuai',
  },
  en: {
    summary: 'Market, portfolio, and security overview in one place.',
    live: 'Live data', watch: 'Watch-only mode', kycPending: 'KYC is under review',
    kycStart: 'Complete KYC for eligible access',
  },
};

export default function Home() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const { prices, idrRate, connected } = useLivePrices();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setKycStatus(u?.kycStatus);
    }).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  return (
  <div className="ka-bg min-h-screen text-white pb-28">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <p className="ka-muted text-xs">{greeting()},</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {user?.full_name?.split(' ')[0] || 'Pengguna'}
          </h1>
          <p className="ka-muted text-xs mt-1">
            {text.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="ka-chip px-3 py-1.5 text-[10px] font-bold text-ka-emerald inline-flex items-center gap-1.5">
            <Radio className="w-3 h-3" /> {text.live}
          </span>
          <span className="ka-chip px-3 py-1.5 text-[10px] font-bold text-sky-300 inline-flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> {text.watch}
          </span>
        </div>
      </div>

      {kycStatus !== 'approved' && (
        <Link
          to={createPageUrl('KYC')}
          className="flex items-center justify-between ka-surface ka-surface-hover p-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-yellow-300 text-xs font-semibold">
              {kycStatus === 'pending'
                ? text.kycPending
                : text.kycStart}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-yellow-400 shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HomePortfolioSummary user={user} prices={prices} idrRate={idrRate} />
            <HomePortfolioPerformance user={user} prices={prices} />
          </div>

          <HomeQuickActions />
          <div className="hidden md:block"><Suspense fallback={<DeferredFallback />}><HomeTradingViewSection /></Suspense></div>
          <HomeMarketMovers />
        </div>

        <aside className="xl:col-span-4 space-y-4 min-w-0">
          <Suspense fallback={<DeferredFallback />}><AIInsightCard /></Suspense>
          <Suspense fallback={<DeferredFallback />}><WhaleAlertCard /></Suspense>
          <HomeMarketOverview />
          <Suspense fallback={<DeferredFallback />}><HomeNews /></Suspense>
          <Suspense fallback={<DeferredFallback />}><HomeLearningCenter /></Suspense>
        </aside>
      </div>

      <Suspense fallback={null}><HomeFooter /></Suspense>
    </div>
  </div>
);
}
