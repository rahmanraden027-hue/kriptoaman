import React, { useEffect, useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSystemDarkMode } from './hooks/useSystemDarkMode';
import MobileHeader from './components/mobile/MobileHeader';
import PageTransition from './components/mobile/PageTransition';
import { Wallet, Coins, Clock, Zap, Settings, BarChart3, LayoutGrid, User, MessageCircle, Info, Mail, AlertTriangle, Home, TrendingUp, Bell, BookOpen, ShieldCheck, Lock } from 'lucide-react';
import KriptoAmanLogo from './components/brand/KriptoAmanLogo';
import { installCrashHandlers } from './components/utils/crashAnalytics';
import { base44 } from '@/api/base44Client';
import { PinUnlock, useAppLock } from './components/security/PinLock';
import { initAnalytics, identifyUser, Analytics } from './components/analytics/mixpanel';
import LiveTickerBar from './components/market/LiveTickerBar';
import { usePWAInitializer, PWAUpdateNotification } from './components/pwa/PWAInitializer';
import AdminDepositNotifier from './components/admin/AdminDepositNotifier';
import DisclaimerGate from './components/disclaimer/DisclaimerGate';
import { Web3Provider } from './components/web3/Web3Provider';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useLanguage } from './lib/LanguageContext';

const BOTTOM_NAV = [
  { id: 'home', page: 'Home', icon: Home },
  { id: 'markets', page: 'Market', icon: TrendingUp },
  { id: 'wallet', page: 'Wallet', icon: Wallet },
  { id: 'alerts', page: 'Alerts', icon: Bell },
  { id: 'profile', page: 'Profile', icon: User },
];

const NAV_LABELS = {
  id: { home: 'Beranda', markets: 'Pasar', wallet: 'Pantau', alerts: 'Peringatan', profile: 'Profil' },
  en: { home: 'Home', markets: 'Markets', wallet: 'Watch', alerts: 'Alerts', profile: 'Profile' },
};

const DESKTOP_NAV = [
  { id: 'home', page: 'Home', icon: Home, to: '/dashboard' },
  { id: 'markets', page: 'Market', icon: TrendingUp },
  { id: 'portfolio', page: 'PortfolioOverview', icon: BarChart3 },
  { id: 'wallet', page: 'Wallet', icon: Wallet },
  { id: 'security', page: 'SecurityHub', icon: ShieldCheck },
  { id: 'kyc', page: 'KYC', icon: ShieldCheck },
  { id: 'education', page: 'Edukasi', icon: BookOpen },
  { id: 'alerts', page: 'Alerts', icon: Bell },
];

const DESKTOP_LABELS = {
  id: { home: 'Dasbor', markets: 'Pasar', portfolio: 'Portofolio', wallet: 'Pantau Wallet', security: 'Keamanan', kyc: 'KYC', education: 'Edukasi', alerts: 'Peringatan' },
  en: { home: 'Dashboard', markets: 'Markets', portfolio: 'Portfolio', wallet: 'Watch Wallet', security: 'Security', kyc: 'KYC', education: 'Education', alerts: 'Alerts' },
};

const ADMIN_PRIMARY_NAV = [
  { label: 'KYC Operations', page: 'AdminKYCManagement', icon: ShieldCheck },
  { label: 'User Balances', page: 'AdminUserBalances', icon: User },
  { label: 'Platform Assets', page: 'AdminPlatformAssets', icon: Wallet },
  { label: 'AML Monitoring', page: 'AMLDashboard', icon: AlertTriangle },
  { label: 'Security Center', page: 'SecurityCenter', icon: ShieldCheck },
  { label: 'Server Control', page: 'ServerControl', icon: Lock },
];

const NAV = [
  { label: 'KYC Verification', page: 'KYCVerificationPage', icon: ShieldCheck },
  { label: 'Admin KYC Mgmt', page: 'AdminKYCManagement', icon: ShieldCheck, adminOnly: true },
  { label: 'Portfolio', page: 'PortfolioOverview', icon: BarChart3 },
  { label: 'DEX & Savings', page: 'DEXSavings', icon: Coins },
  { label: 'P2P Lending', page: 'P2PLending', icon: Coins },
  { label: 'Market Research', page: 'MarketResearch', icon: BarChart3 },
  { label: 'Aset', page: 'AssetManager', icon: LayoutGrid },
  { label: 'Auto-Trade', page: 'AutoTrading', icon: Zap },
  { label: 'Premium', page: 'Premium', icon: Zap },
  { label: 'Edukasi', page: 'Edukasi', icon: BookOpen },
  { label: 'Riwayat', page: 'TxHistory', icon: Clock },
  { label: 'Settings', page: 'Settings', icon: Settings },
  { label: 'Support', page: 'Support', icon: MessageCircle },
  { label: 'SEO Landing', page: 'SEOLanding', icon: TrendingUp },
  { label: 'About', page: 'AboutUs', icon: Info },
  { label: 'Kontak', page: 'Contact', icon: Mail },
  { label: 'Disclaimer', page: 'Disclaimer', icon: AlertTriangle },
  { label: 'Platform Docs', page: 'PlatformDocs', icon: BookOpen, adminOnly: true },
  { label: 'Dok. Regulasi', page: 'RegulatoryDocs', icon: ShieldCheck, adminOnly: true },
  { label: 'Admin Profit', page: 'AdminProfitAnalytics', icon: BarChart3, adminOnly: true },
  { label: 'Aset Platform', page: 'AdminPlatformAssets', icon: Wallet, adminOnly: true },
  { label: 'Secure Vault', page: 'SecureVault', icon: Lock, adminOnly: true },
  { label: 'Security Center', page: 'SecurityCenter', icon: ShieldCheck, adminOnly: true },
  { label: 'AML Screening', page: 'AMLDashboard', icon: AlertTriangle, adminOnly: true },
  { label: 'BQ KYC Reports', page: 'BigQueryKYCReports', icon: BarChart3, adminOnly: true },
  { label: 'AML Assistant', page: 'AMLAssistant', icon: ShieldCheck },
  { label: 'Server Control', page: 'ServerControl', icon: Lock, adminOnly: true },
  { label: 'Broadcast Fitur', page: 'FeatureUpdateBroadcast', icon: Mail, adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
  const { language } = useLanguage();
  const navLabels = NAV_LABELS[language] || NAV_LABELS.id;
  const desktopLabels = DESKTOP_LABELS[language] || DESKTOP_LABELS.id;
  const [user, setUser] = useState(null);
  const { locked, unlock } = useAppLock(
    parseInt(localStorage.getItem('cv_session_timeout_min') || '5') * 60 * 1000
  );
  usePWAInitializer();
  useSystemDarkMode();

  useEffect(() => {
    initAnalytics();
    installCrashHandlers();
    base44.auth.me().then(u => {
      setUser(u);
      identifyUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentPageName) Analytics.pageViewed(currentPageName);
  }, [currentPageName]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '';

  if (locked) {
    return <PinUnlock onUnlocked={unlock} onForgot={() => { localStorage.clear(); window.location.reload(); }} />;
  }

  return (
    <DisclaimerGate>
      <Web3Provider>
        <div className="min-h-screen ka-bg ka-global-shell">
          <style>{`
            body {
              background: #050d18;
              overscroll-behavior: none;
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-callout: none;
            }
            html { overflow: hidden; height: 100%; }
            body { overflow: auto; height: 100%; }
            .safe-area-pb { padding-bottom: env(safe-area-inset-bottom, 16px); }
            .safe-area-pt { padding-top: env(safe-area-inset-top, 0px); }
          `}</style>

          <PWAUpdateNotification />
          {user?.role === 'admin' && <AdminDepositNotifier />}

          {user && (
            <div className="ka-global-topbar fixed top-0 left-0 right-0 z-50 safe-area-pt border-b border-sky-500/15 bg-[#050d18]/92 backdrop-blur-xl">
              <div className="min-h-10 px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0 shrink-0 flex items-center gap-3">
                  <KriptoAmanLogo size={26} showText={true} textSize="text-xs" />
                  <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-[9px] font-extrabold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
                    INTELLIGENCE WORKSPACE
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
                  <LanguageSwitcher compact />
                  <Link to={createPageUrl('Services')} className="flex items-center justify-center w-8 h-8 shrink-0 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/15 transition-colors tap-reset" aria-label={language === 'en' ? 'Services' : 'Layanan'}>
                    <LayoutGrid className="w-4 h-4" />
                  </Link>
                  <Link to={createPageUrl('Settings')}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 min-w-0 bg-slate-950/55 border border-sky-500/15 rounded-full hover:border-sky-400/35 transition-colors">
                    <div className="w-5 h-5 rounded-full shrink-0 bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-slate-950 text-[9px] font-black">
                      {initials}
                    </div>
                    <span className="text-white text-[11px] font-semibold max-w-[72px] sm:max-w-[120px] truncate">{user.full_name || user.email}</span>
                    <span className="hidden sm:inline text-sky-300 text-[9px] capitalize bg-sky-500/10 px-1.5 py-0.5 rounded-full">{user.role || 'user'}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div
            className="fixed left-0 right-0 z-40"
            style={{ top: user ? 'calc(2.5rem + env(safe-area-inset-top, 0px))' : 'env(safe-area-inset-top, 0px)' }}
          >
            <LiveTickerBar />
          </div>

          {user && (
            <aside className="ka-global-sidebar hidden lg:flex fixed left-0 top-[72px] bottom-0 z-30 w-64 border-r border-sky-500/12 bg-[#06101b]/95 backdrop-blur-xl px-3 py-4 flex-col">
              <div className="px-3 mb-3">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Workspace</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-sky-300 bg-sky-400/8 border border-sky-400/15 rounded-xl px-3 py-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Global intelligence · Watch-only' : 'Intelijen global · Pemantauan'}
                </div>
              </div>

              <nav className="space-y-1">
                {DESKTOP_NAV.map(({ id, page, icon: Icon, to }) => {
                  const label = desktopLabels[id];
                  const active = currentPageName === page;
                  return (
                    <Link
                      key={label}
                      to={to || createPageUrl(page)}
                      className={`ka-sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${active ? 'is-active' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {user?.role === 'admin' && (
                <div className="mt-4 pt-4 border-t border-sky-500/10 min-h-0 flex flex-col">
                  <div className="px-3 mb-2 flex items-center justify-between gap-2">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Owner Operations</p>
                    <span className="text-[8px] font-black text-emerald-300">SECURE</span>
                  </div>
                  <nav className="space-y-1 overflow-y-auto pr-1 ka-sidebar-admin-scroll">
                    {ADMIN_PRIMARY_NAV.map(({ label, page, icon: Icon }) => {
                      const active = currentPageName === page;
                      return (
                        <Link
                          key={page}
                          to={createPageUrl(page)}
                          className={`ka-sidebar-link ka-sidebar-admin-link flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${active ? 'is-active' : ''}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-sky-500/10">
                <Link to={createPageUrl('Services')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  <LayoutGrid className="w-4 h-4" />
                  Service Matrix
                </Link>
              </div>
            </aside>
          )}

          {user && <div style={{ height: 'calc(2.5rem + env(safe-area-inset-top, 0px))' }} />}
          <div className="h-8" />

          <div className={user ? 'lg:pl-64' : ''}>
            <div className="lg:hidden">
              <MobileHeader currentPageName={currentPageName} />
            </div>

            <Suspense fallback={<div className="min-h-screen ka-bg flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" /></div>}>
              <PageTransition>{children}</PageTransition>
            </Suspense>
          </div>

          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06101b]/97 backdrop-blur-xl border-t border-sky-500/20 safe-area-pb shadow-[0_-12px_32px_rgba(0,0,0,0.35)]">
            <div className="flex justify-around items-center py-2 px-1">
              {BOTTOM_NAV.map(({ id, page, icon: Icon }) => {
                const label = navLabels[id];
                const active = currentPageName === page;
                return (
                  <Link key={page} to={createPageUrl(page)}
                    className={`relative flex flex-1 flex-col items-center justify-center gap-1.5 min-h-[58px] min-w-[56px] rounded-xl transition-all ${active ? 'text-sky-400 bg-sky-500/8' : 'text-slate-400 hover:text-white'}`}>
                    {active && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,.75)]" />}
                    <Icon className={`w-5 h-5 ${active ? 'text-sky-400' : ''}`} />
                    <span className={`text-[11px] font-semibold ${active ? 'text-sky-300' : ''}`}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {user?.role === 'admin' && (
            <div className="hidden lg:flex fixed bottom-0 left-64 right-0 z-30 bg-[#06101b]/94 backdrop-blur-xl border-t border-sky-500/15 px-4 py-1.5 items-center gap-3 overflow-x-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 text-[9px] font-black tracking-wider shrink-0">OWNER OPS</span>
              {NAV.filter(n => n.adminOnly).map(({ label, page, icon: Icon }) => {
                const active = currentPageName === page;
                return (
                  <Link key={page} to={createPageUrl(page)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold whitespace-nowrap transition-all shrink-0 ${active ? 'bg-sky-400 text-slate-950' : 'bg-sky-500/8 text-sky-300 hover:bg-sky-500/14'}`}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </Link>
                );
              })}
              <Link to={createPageUrl('AdminUserBalances')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold whitespace-nowrap transition-all shrink-0 ${currentPageName === 'AdminUserBalances' ? 'bg-sky-400 text-slate-950' : 'bg-sky-500/8 text-sky-300 hover:bg-sky-500/14'}`}>
                <User className="w-3 h-3" />
                User Balances
              </Link>
            </div>
          )}

          <div className="h-20 lg:h-6" />
        </div>
      </Web3Provider>
    </DisclaimerGate>
  );
}
