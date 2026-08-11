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

// Primary bottom nav (5 tabs — shown always)
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
  { label: 'Dashboard', page: 'Home', icon: Home, to: '/dashboard' },
  { label: 'Pasar', page: 'Market', icon: TrendingUp },
  { label: 'Portfolio', page: 'PortfolioOverview', icon: BarChart3 },
  { label: 'Pantau Wallet', page: 'Wallet', icon: Wallet },
  { label: 'Keamanan', page: 'SecurityHub', icon: ShieldCheck },
  { label: 'KYC', page: 'KYC', icon: ShieldCheck },
  { label: 'Edukasi', page: 'Edukasi', icon: BookOpen },
  { label: 'Notifikasi', page: 'Alerts', icon: Bell },
];
// Secondary nav (shown in sidebar/more menu)
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
  const [user, setUser] = useState(null);
  const { locked, unlock } = useAppLock(
    parseInt(localStorage.getItem('cv_session_timeout_min') || '5') * 60 * 1000
  );
  const { swReady } = usePWAInitializer();
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
      <div className="min-h-screen ka-bg">
      <style>{`
        /* PWA iOS safe area & viewport */
        body { 
          background: #0a0c0a;
          overscroll-behavior: none;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
        /* Prevent iOS bounce */
        html { overflow: hidden; height: 100%; }
        body { overflow: auto; height: 100%; }
        /* CSP meta for inline - already in index.html */
        .safe-area-pb { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
      <PWAUpdateNotification />
      {user?.role === 'admin' && <AdminDepositNotifier />}
      
      {/* Top user bar */}
      {user && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0c0a]/95 backdrop-blur border-b border-ka-card-border px-4 py-2 flex items-center justify-between">
          <KriptoAmanLogo size={26} showText={true} textSize="text-xs" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Link to={createPageUrl('Services')} className="flex items-center justify-center w-8 h-8 rounded-xl bg-ka-emerald/12 border border-ka-emerald/25 text-ka-emerald hover:bg-ka-emerald/20 transition-colors tap-reset" aria-label="Layanan">
              <LayoutGrid className="w-4 h-4" />
            </Link>
            <Link to={createPageUrl('Settings')}
              className="flex items-center gap-2 px-2.5 py-1 bg-ka-card border border-ka-card-border rounded-full hover:border-ka-emerald/40 transition-colors">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-ka-emerald to-ka-teal flex items-center justify-center text-black text-[9px] font-bold">
                {initials}
              </div>
              <span className="text-white text-[11px] font-semibold max-w-[120px] truncate">{user.full_name || user.email}</span>
              <span className="text-ka-emerald text-[9px] capitalize bg-ka-emerald/15 px-1.5 py-0.5 rounded-full">{user.role || 'user'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Live market ticker */}
      <div className={`fixed ${user ? 'top-10' : 'top-0'} left-0 right-0 z-40`}>
        <LiveTickerBar />
      </div>
{/* Desktop Sidebar */}
{user && (
  <aside className="hidden lg:flex fixed left-0 top-[72px] bottom-0 z-30 w-60 border-r border-ka-card-border bg-[#07111d]/95 backdrop-blur-xl px-3 py-5 flex-col">
    <div className="px-3 mb-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-ka-muted font-bold">
        Workspace
      </p>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-sky-300 bg-sky-400/10 border border-sky-400/20 rounded-xl px-3 py-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        Fase 1 · Read-only
      </div>
    </div>

    <nav className="space-y-1">
      {DESKTOP_NAV.map(({ label, page, icon: Icon, to }) => {
        const active = currentPageName === page;

        return (
          <Link
            key={label}
            to={to || createPageUrl(page)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              active
                ? 'bg-ka-emerald/15 text-ka-emerald border border-ka-emerald/25'
                : 'text-ka-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>

    {user?.role === 'admin' && (
      <div className="mt-auto pt-4 border-t border-ka-card-border">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.18em] text-ka-muted font-bold">
          Owner Admin
        </p>

        <Link
          to={createPageUrl('ServerControl')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-ka-emerald hover:bg-ka-emerald/10 transition-all"
        >
          <Lock className="w-4 h-4" />
          Admin Control
        </Link>
      </div>
    )}
  </aside>
)}
      {/* Push content down if top bar is visible */}
      {user && <div className="h-10" />}
      <div className="h-8" />{/* ticker bar height */}

      <div className={user ? 'lg:pl-60' : ''}>
  <div className="lg:hidden">
    <MobileHeader currentPageName={currentPageName} />
  </div>

  <Suspense fallback={<div className="min-h-screen ka-bg flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-ka-emerald border-t-transparent animate-spin" /></div>}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
</div>

      {/* Bottom Nav — 5 primary tabs */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07111d]/97 backdrop-blur-xl border-t border-sky-500/20 safe-area-pb shadow-[0_-12px_32px_rgba(0,0,0,0.35)]">
        <div className="flex justify-around items-center py-2 px-1">
          {BOTTOM_NAV.map(({ id, page, icon: Icon }) => {
            const label = navLabels[id];
            const active = currentPageName === page;
            const hasAlert = page === 'Alerts';
            return (
              <Link key={page} to={createPageUrl(page)}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1.5 min-h-[58px] min-w-[56px] rounded-xl transition-all ${active ? 'text-sky-400 bg-sky-500/8' : 'text-slate-400 hover:text-white'}`}>
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-sky-400 rounded-full" />
                )}
                <Icon className={`w-5 h-5 ${active ? 'text-sky-400' : ''}`} />
                <span className={`text-[11px] font-semibold ${active ? 'text-sky-300' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin Quick Links — hanya untuk admin */}
      {user?.role === 'admin' && (
        <div className="hidden lg:flex fixed bottom-0 left-60 right-0 z-30 bg-sky-500/8 backdrop-blur border-t border-sky-500/20 px-4 py-1.5 items-center gap-3 overflow-x-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-ka-emerald shrink-0" />
          <span className="text-ka-emerald text-[10px] font-bold shrink-0">ADMIN:</span>
          {NAV.filter(n => n.adminOnly).map(({ label, page, icon: Icon }) => {
            const active = currentPageName === page;
            return (
              <Link key={page} to={createPageUrl(page)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${active ? 'bg-ka-emerald text-black' : 'bg-ka-emerald/12 text-ka-emerald hover:bg-ka-emerald/20'}`}>
                <Icon className="w-3 h-3" />
                {label}
              </Link>
            );
          })}
          <Link to={createPageUrl('AdminUserBalances')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${currentPageName === 'AdminUserBalances' ? 'bg-ka-emerald text-black' : 'bg-ka-emerald/12 text-ka-emerald hover:bg-ka-emerald/20'}`}>
            <User className="w-3 h-3" />
            User Balances
          </Link>
        </div>
      )}

      {/* Bottom padding for nav */}
      <div className="h-20 lg:h-6" />
      </div>
    </Web3Provider>
    </DisclaimerGate>
  );
}
