import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Wallet, Activity, Coins, Clock, Zap, Settings, BarChart3, LayoutGrid } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PinUnlock, useAppLock } from './components/security/PinLock';
import { initAnalytics, identifyUser, Analytics } from './components/analytics/mixpanel';
import LiveTickerBar from './components/market/LiveTickerBar';
import { usePWAInitializer, PWAUpdateNotification } from './components/pwa/PWAInitializer';
import AdminDepositNotifier from './components/admin/AdminDepositNotifier';

const NAV = [
  { label: 'Portfolio', page: 'PortfolioOverview', icon: BarChart3 },
  { label: 'Wallet', page: 'Wallet', icon: Wallet },
  { label: 'DEX & Savings', page: 'DEXSavings', icon: Coins },
  { label: 'Aset', page: 'AssetManager', icon: LayoutGrid },
  { label: 'Auto-Trade', page: 'AutoTrading', icon: Zap },
  { label: 'Riwayat', page: 'TxHistory', icon: Clock },
  { label: 'Settings', page: 'Settings', icon: Settings },
  { label: 'Admin Profit', page: 'AdminProfitAnalytics', icon: BarChart3, adminOnly: true },
  { label: 'Aset Platform', page: 'AdminPlatformAssets', icon: Wallet, adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const { locked, unlock } = useAppLock(
    parseInt(localStorage.getItem('cv_session_timeout_min') || '5') * 60 * 1000
  );
  const { swReady } = usePWAInitializer();

  useEffect(() => {
    initAnalytics();
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
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5"/><path d="M9 8.5C9 8.5 9 7 11 7C13 7 14.5 8 14.5 10C14.5 12 12.5 12.5 12 13C11.5 13.5 11.5 14.5 11.5 14.5" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="11.5" cy="17" r="1" fill="white"/></svg>
            </div>
            <span className="text-white text-xs font-bold tracking-wider">COINVAULT</span>
          </div>
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

      {children}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 flex justify-around py-2 px-1 safe-area-pb">
        {NAV.map(({ label, page, icon: Icon, adminOnly }) => {
          if (adminOnly && user?.role !== 'admin') return null;
          const active = currentPageName === page;
          return (
            <Link key={page} to={createPageUrl(page)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : ''}`} />
              <span className={`text-[9px] font-semibold ${active ? 'text-blue-400' : ''}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom padding for nav */}
      <div className="h-16" />
    </div>
  );
}