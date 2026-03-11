import React, { useEffect, useState, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  { label: 'Market', page: 'Market', icon: TrendingUp },
  { label: 'Wallet', page: 'Wallet', icon: Wallet },
  { label: 'Alerts', page: 'Alerts', icon: Bell },
  { label: 'Profil', page: 'Profile', icon: User },
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
  { label: 'SEO Landing', page: 'SEOLanding', icon: TrendingUp, adminOnly: true },
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
  { label: 'Server Control', page: 'ServerControl', icon: Lock, adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const { locked, unlock } = useAppLock(
    parseInt(localStorage.getItem('cv_session_timeout_min') || '5') * 60 * 1000
  );
  const { swReady } = usePWAInitializer();

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <style>{`
        /* PWA iOS safe area & viewport */
        body { 
          background: #020817;
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
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 px-4 py-2 flex items-center justify-between">
          <KriptoAmanLogo size={26} showText={true} textSize="text-xs" />
          <Link to={createPageUrl('Settings')}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 border border-slate-700/50 rounded-full hover:bg-slate-700 transition-colors">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
              {initials}
            </div>
            <span className="text-white text-[11px] font-semibold max-w-[120px] truncate">{user.full_name || user.email}</span>
            <span className="text-slate-500 text-[9px] capitalize bg-slate-700 px-1.5 py-0.5 rounded-full">{user.role || 'user'}</span>
          </Link>
        </div>
      )}

      {/* Live market ticker */}
      <div className={`fixed ${user ? 'top-10' : 'top-0'} left-0 right-0 z-40`}>
        <LiveTickerBar />
      </div>

      {/* Push content down if top bar is visible */}
      {user && <div className="h-10" />}
      <div className="h-8" />{/* ticker bar height */}

      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /></div>}>
        {children}
      </Suspense>

      {/* Bottom Nav — 5 primary tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 safe-area-pb">
        <div className="flex justify-around items-center py-2 px-2">
          {BOTTOM_NAV.map(({ label, page, icon: Icon }) => {
            const active = currentPageName === page;
            const hasAlert = page === 'Alerts';
            return (
              <Link key={page} to={createPageUrl(page)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-indigo-400 rounded-full" />
                )}
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : ''}`} />
                <span className={`text-[9px] font-semibold ${active ? 'text-indigo-400' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin Quick Links — hanya untuk admin */}
      {user?.role === 'admin' && (
        <div className="fixed bottom-16 left-0 right-0 z-39 bg-rose-950/90 backdrop-blur border-t border-rose-800/60 px-4 py-1.5 flex items-center gap-3 overflow-x-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-rose-400 text-[10px] font-bold shrink-0">ADMIN:</span>
          {NAV.filter(n => n.adminOnly).map(({ label, page, icon: Icon }) => {
            const active = currentPageName === page;
            return (
              <Link key={page} to={createPageUrl(page)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${active ? 'bg-rose-600 text-white' : 'bg-rose-900/60 text-rose-300 hover:bg-rose-800/60'}`}>
                <Icon className="w-3 h-3" />
                {label}
              </Link>
            );
          })}
          <Link to={createPageUrl('AdminUserBalances')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${currentPageName === 'AdminUserBalances' ? 'bg-rose-600 text-white' : 'bg-rose-900/60 text-rose-300 hover:bg-rose-800/60'}`}>
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