import { Toaster } from "@/components/ui/toaster"
import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import KriptoAmanGlobalLanding from './pages/KriptoAmanGlobalLanding';
import EnglishLanding from './pages/EnglishLanding';
import LegalCorporateInformation from './pages/LegalCorporateInformation';
import Founder from './pages/Founder';
import CompanyFacts from './pages/CompanyFacts';
import Research from './pages/Research';
import KAMResearchPaper from './pages/KAMResearchPaper';
import AdminRoute from '@/components/security/AdminRoute';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PrimaryBottomNav from '@/components/mobile/PrimaryBottomNav';
import NativeConnectivityBanner from '@/components/mobile/NativeConnectivityBanner';
import { LanguageProvider } from '@/lib/LanguageContext';

const FeatureUpdateBroadcast = lazy(() => import('./pages/FeatureUpdateBroadcast'));
const AMLAssistant = lazy(() => import('./pages/AMLAssistant'));
const BigQueryKYCReports = lazy(() => import('./pages/BigQueryKYCReports'));
const Services = lazy(() => import('./pages/Services'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const MultiChainWallet = lazy(() => import('./pages/MultiChainWallet'));
const SecurityHub = lazy(() => import('./pages/SecurityHub'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const DashboardPage = Pages.Home ?? MainPage;

const ADMIN_PAGE_KEYS = new Set([
  'AdminKAMAnalytics', 'AdminKAMBulkRewards', 'AdminKAMRewards', 'AdminKAMSnapshotApproval', 'AdminKAMSnapshotReadiness', 'AdminKYCManagement', 'AdminPlatformAssets', 'AdminProfitAnalytics', 'AdminUserBalances',
  'ServerControl', 'BigQueryKYCReports', 'RegulatoryDocs', 'AppBuildAnalytics',
  'AssetManager', 'SecureVault', 'AMLDashboard', 'SecurityCenter', 'KAMIncidentResponse',
  'FeatureUpdateBroadcast',
]);

const STORE_RESTRICTED_PAGE_KEYS = new Set(['AutoTrading', 'DEXSavings', 'P2PLending', 'TradingAnalytics']);

const StoreAvailabilityNotice = () => (
  <div className="ka-bg min-h-screen flex items-center justify-center px-5 text-white">
    <div className="ka-surface max-w-md p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10">
        <img src="/icons/kriptoaman-192.png" alt="KriptoAman" className="h-12 w-12 object-contain" />
      </div>
      <h1 className="text-xl font-bold">Fitur sedang dipersiapkan</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">Fitur transaksi ini belum tersedia pada versi publik. KriptoAman saat ini berfokus pada informasi, pemantauan, edukasi, dan keamanan aset digital.</p>
      <a href="/dashboard" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold hover:bg-blue-500">Kembali ke Dashboard</a>
    </div>
  </div>
);

const PublicMarketWithNav = ({ Page }) => <div className="min-h-screen"><Page /><PrimaryBottomNav currentPageName="Market" /></div>;

const PublicKAMWithDocument = ({ Page }) => (
  <div className="min-h-screen bg-slate-950">
    <Page />
    <section className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-r from-sky-500/10 via-slate-900/90 to-emerald-500/10 p-5 shadow-[0_24px_70px_-50px_rgba(14,165,233,.9)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">KAM GLOBAL ROADMAP</p>
            <h2 className="mt-1 text-lg font-black text-white sm:text-xl">US$29.37 · Indicative Scenario Reference</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">Infrastructure · Utility · Adoption · Liquidity · Global Access · Governance · Market Readiness</p>
          </div>
          <a href="/KAMGlobalRoadmap" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-black text-white shadow-[0_16px_42px_-20px_rgba(14,165,233,.85)] transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" aria-label="Open KAM Global Roadmap">KAM Global Roadmap</a>
        </div>
      </div>
    </section>
  </div>
);

const PUBLIC_PAGE_KEYS = new Set(['AboutUs', 'Edukasi', 'Contact', 'Disclaimer', 'PrivacyPolicy', 'RPCPrivacyPolicy', 'TermsOfService', 'AccountDeletion', 'Market', 'KAM', 'KAMCampaignNews', 'KAMDeveloper', 'KAMGlobalRoadmap', 'KAMLaunchReadiness', 'KAMNetwork', 'KAMNetworkDocs', 'KAMTokenomics']);

const LayoutWrapper = ({ children, currentPageName }) => Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  if (authError && authError.type === 'user_not_registered') return <UserNotRegisteredError />;

  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-slate-950"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-400" /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<KriptoAmanGlobalLanding />} />
        <Route path="/en" element={<EnglishLanding />} />
        <Route path="/KriptoAmanGlobalLanding" element={<KriptoAmanGlobalLanding />} />
        <Route path="/LegalCorporateInformation" element={<LegalCorporateInformation />} />
        <Route path="/founder" element={<Founder />} />
        <Route path="/company" element={<CompanyFacts />} />
        <Route path="/research" element={<Research />} />
        <Route path="/research/kam-mainnet-architecture" element={<KAMResearchPaper />} />
        <Route path="/SystemStatus" element={<SystemStatus />} />

        {Object.entries(Pages).map(([path, Page]) => {
          if (!PUBLIC_PAGE_KEYS.has(path)) return null;
          const element = path === 'Market' ? <PublicMarketWithNav Page={Page} /> : path === 'KAM' ? <PublicKAMWithDocument Page={Page} /> : <Page />;
          const routePath = path === 'KAMCampaignNews' ? '/news/kam-campaign-2026' : `/${path}`;
          return <Route key={path} path={routePath} element={element} />;
        })}

        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/dashboard" element={<LayoutWrapper currentPageName="Home"><DashboardPage /></LayoutWrapper>} />
          {Object.entries(Pages).map(([path, Page]) => {
            if (PUBLIC_PAGE_KEYS.has(path)) return null;
            const wrapped = <LayoutWrapper currentPageName={path}>{STORE_RESTRICTED_PAGE_KEYS.has(path) ? <StoreAvailabilityNotice /> : <Page />}</LayoutWrapper>;
            return <Route key={path} path={`/${path}`} element={ADMIN_PAGE_KEYS.has(path) ? <AdminRoute>{wrapped}</AdminRoute> : wrapped} />;
          })}
          <Route path="/FeatureUpdateBroadcast" element={<AdminRoute><LayoutWrapper currentPageName="FeatureUpdateBroadcast"><FeatureUpdateBroadcast /></LayoutWrapper></AdminRoute>} />
          <Route path="/AMLAssistant" element={<LayoutWrapper currentPageName="AMLAssistant"><AMLAssistant /></LayoutWrapper>} />
          <Route path="/Services" element={<LayoutWrapper currentPageName="Services"><Services /></LayoutWrapper>} />
          <Route path="/MultiChainWallet" element={<LayoutWrapper currentPageName="MultiChainWallet"><MultiChainWallet /></LayoutWrapper>} />
          <Route path="/SecurityHub" element={<LayoutWrapper currentPageName="SecurityHub"><SecurityHub /></LayoutWrapper>} />
          <Route path="/BigQueryKYCReports" element={<AdminRoute><LayoutWrapper currentPageName="BigQueryKYCReports"><BigQueryKYCReports /></LayoutWrapper></AdminRoute>} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <LanguageProvider><AuthProvider><QueryClientProvider client={queryClientInstance}><Router><NavigationTracker /><NativeConnectivityBanner /><AppErrorBoundary><AuthenticatedApp /><PWAInstallPrompt /></AppErrorBoundary></Router><Toaster /></QueryClientProvider></AuthProvider></LanguageProvider>
  )
}

export default App
