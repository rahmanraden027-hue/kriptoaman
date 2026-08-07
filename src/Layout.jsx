import React, { useEffect, useState, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSystemDarkMode } from './hooks/useSystemDarkMode';
import MobileHeader from './components/mobile/MobileHeader';
import PageTransition from './components/mobile/PageTransition';
import { Wallet, Coins, Clock, Zap, Settings, BarChart3, LayoutGrid, User, MessageCircle, Info, Mail, AlertTriangle, Home, TrendingUp, Bell, BookOpen, ShieldCheck, Lock, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
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

// Primary bottom nav (5 tabs — shown always)
const BOTTOM_NAV = [
  { label: 'Home', page: 'Home', icon: Home },
  { label: 'Markets', page: 'Market', icon: TrendingUp },
  { label: 'Wallet', page: 'Wallet', icon: Wallet },
  { label: 'Alerts', page: 'Alerts', icon: Bell },
  { label: 'Profile', page: 'Profile', icon: User },
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

      {/* Push content down if top bar is visible */}
      {user && <div className="h-10" />}
      <div className="h-8" />{/* ticker bar height */}

      <MobileHeader currentPageName={currentPageName} />
      <Suspense fallback={<div className="min-h-screen ka-bg flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-ka-emerald border-t-transparent animate-spin" /></div>}>
        <PageTransition>{children}</PageTransition>
      </Suspense>

      {/* Bottom Nav — 5 primary tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0c0a]/95 backdrop-blur border-t border-ka-card-border safe-area-pb">
        <div className="flex justify-around items-center py-2 px-2">
          {BOTTOM_NAV.map(({ label, page, icon: Icon }) => {
            const active = currentPageName === page;
            const hasAlert = page === 'Alerts';
            return (
              <Link key={page} to={createPageUrl(page)}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 min-h-[44px] min-w-[44px] rounded-xl transition-all ${active ? 'text-ka-emerald' : 'text-ka-muted hover:text-white'}`}>
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-ka-emerald rounded-full" />
                )}
                <Icon className={`w-5 h-5 ${active ? 'text-ka-emerald' : ''}`} />
                <span className={`text-[9px] font-semibold ${active ? 'text-ka-emerald' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin Quick Links — hanya untuk admin */}
      {user?.role === 'admin' && (
        <div className="fixed bottom-16 left-0 right-0 z-39 bg-ka-emerald/10 backdrop-blur border-t border-ka-card-border px-4 py-1.5 flex items-center gap-3 overflow-x-auto">
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
      <div className={user?.role === 'admin' ? 'h-24' : 'h-16'} />
      </div>
    </Web3Provider>
    </DisclaimerGate>
  );
}