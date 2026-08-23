import React, { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSystemDarkMode } from './hooks/useSystemDarkMode';
import MobileHeader from './components/mobile/MobileHeader';
import PageTransition from './components/mobile/PageTransition';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Home,
  LayoutGrid,
  Lock,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';
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
  { id: 'portfolio', page: 'PortfolioOverview', icon: BarChart3 },
  { id: 'wallet', page: 'Wallet', icon: Wallet },
  { id: 'security', page: 'SecurityHub', icon: ShieldCheck },
];

const NAV_LABELS = {
  id: { home: 'Beranda', markets: 'Pasar', portfolio: 'Portofolio', wallet: 'Pantau', security: 'Keamanan' },
  en: { home: 'Home', markets: 'Markets', portfolio: 'Portfolio', wallet: 'Watch', security: 'Security' },
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
  { id: 'kycOps', page: 'AdminKYCManagement', icon: ShieldCheck },
  { id: 'balances', page: 'AdminUserBalances', icon: User },
  { id: 'assets', page: 'AdminPlatformAssets', icon: Wallet },
  { id: 'aml', page: 'AMLDashboard', icon: AlertTriangle },
  { id: 'securityCenter', page: 'SecurityCenter', icon: ShieldCheck },
  { id: 'server', page: 'ServerControl', icon: Lock },
];

const ADMIN_SECONDARY_NAV = [
  { id: 'kycMgmt', page: 'AdminKYCManagement', icon: ShieldCheck },
  { id: 'platformDocs', page: 'PlatformDocs', icon: BookOpen },
  { id: 'regulatoryDocs', page: 'RegulatoryDocs', icon: ShieldCheck },
  { id: 'profit', page: 'AdminProfitAnalytics', icon: BarChart3 },
  { id: 'platformAssets', page: 'AdminPlatformAssets', icon: Wallet },
  { id: 'vault', page: 'SecureVault', icon: Lock },
  { id: 'securityCenter', page: 'SecurityCenter', icon: ShieldCheck },
  { id: 'amlScreening', page: 'AMLDashboard', icon: AlertTriangle },
  { id: 'kycReports', page: 'BigQueryKYCReports', icon: BarChart3 },
  { id: 'server', page: 'ServerControl', icon: Lock },
];

const ADMIN_LABELS = {
  id: {
    heading: 'Operasi Admin', access: 'AKSES ADMIN', footer: 'ADMIN OPS', serviceMatrix: 'Matriks Layanan',
    kycOps: 'Operasi KYC', balances: 'Saldo Pengguna', assets: 'Aset Platform', aml: 'Pemantauan AML', securityCenter: 'Pusat Keamanan', server: 'Kontrol Server',
    kycMgmt: 'Kelola KYC', platformDocs: 'Dokumen Platform', regulatoryDocs: 'Dokumen Regulasi', profit: 'Analitik Admin', platformAssets: 'Aset Platform', vault: 'Vault Internal', amlScreening: 'Penyaringan AML', kycReports: 'Laporan KYC',
  },
  en: {
    heading: 'Admin Operations', access: 'ADMIN ACCESS', footer: 'ADMIN OPS', serviceMatrix: 'Service Matrix',
    kycOps: 'KYC Operations', balances: 'User Balances', assets: 'Platform Assets', aml: 'AML Monitoring', securityCenter: 'Security Center', server: 'Server Control',
    kycMgmt: 'KYC Management', platformDocs: 'Platform Docs', regulatoryDocs: 'Regulatory Docs', profit: 'Admin Analytics', platformAssets: 'Platform Assets', vault: 'Internal Vault', amlScreening: 'AML Screening', kycReports: 'KYC Reports',
  },
};

export default function Layout({ children, currentPageName }) {
  const { language } = useLanguage();
  const navLabels = NAV_LABELS[language] || NAV_LABELS.id;
  const desktopLabels = DESKTOP_LABELS[language] || DESKTOP_LABELS.id;
  const adminLabels = ADMIN_LABELS[language] || ADMIN_LABELS.id;
  const [user, setUser] = useState(null);
  const { locked, unlock } = useAppLock(
    parseInt(localStorage.getItem('cv_session_timeout_min') || '5', 10) * 60 * 1000,
  );

  usePWAInitializer();
  useSystemDarkMode();

  useEffect(() => {
    initAnalytics();
    installCrashHandlers();
    base44.auth.me().then((account) => {
      setUser(account);
      identifyUser(account);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentPageName) Analytics.pageViewed(currentPageName);
  }, [currentPageName]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '';

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d18]';

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
            .ka-embedded-nav {
              bottom: calc(0.65rem + env(safe-area-inset-bottom, 0px));
              box-shadow: 0 18px 50px rgba(0,0,0,.58), 0 0 0 1px rgba(56,189,248,.04) inset;
            }
            .ka-embedded-nav::before {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: inherit;
              pointer-events: none;
              background: linear-gradient(180deg, rgba(56,189,248,.06), transparent 38%);
            }
          `}</style>

          <PWAUpdateNotification />
          {user?.role === 'admin' && <AdminDepositNotifier />}

          {user && (
            <header className="ka-global-topbar fixed left-0 right-0 top-0 z-50 safe-area-pt border-b border-sky-500/15 bg-[#050d18]/92 backdrop-blur-xl">
              <div className="flex min-h-10 items-center justify-between gap-2 px-3 py-2 sm:px-4">
                <div className="flex min-w-0 shrink-0 items-center gap-3">
                  <KriptoAmanLogo size={26} showText textSize="text-xs" />
                  <span className="hidden items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/8 px-2.5 py-1 text-[9px] font-extrabold text-sky-300 md:inline-flex">
                    INTELLIGENCE WORKSPACE
                  </span>
                </div>
                <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
                  <LanguageSwitcher compact />
                  <Link
                    to={createPageUrl('Services')}
                    className={`tap-reset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-300 transition-colors hover:bg-sky-500/15 ${focusRing}`}
                    aria-label={language === 'en' ? 'Open services' : 'Buka layanan'}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to={createPageUrl('Settings')}
                    className={`flex min-h-10 min-w-0 items-center gap-1.5 rounded-full border border-sky-500/15 bg-slate-950/55 px-2 py-1 transition-colors hover:border-sky-400/35 sm:gap-2 sm:px-2.5 ${focusRing}`}
                    aria-label={language === 'en' ? 'Open account settings' : 'Buka pengaturan akun'}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[9px] font-black text-slate-950" aria-hidden="true">
                      {initials}
                    </div>
                    <span className="max-w-[72px] truncate text-[11px] font-semibold text-white sm:max-w-[120px]">{user.full_name || user.email}</span>
                    <span className="hidden rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[9px] capitalize text-sky-300 sm:inline">{user.role || 'user'}</span>
                  </Link>
                </div>
              </div>
            </header>
          )}

          <div
            className="fixed left-0 right-0 z-40"
            style={{ top: user ? 'calc(2.5rem + env(safe-area-inset-top, 0px))' : 'env(safe-area-inset-top, 0px)' }}
          >
            <LiveTickerBar />
          </div>

          {user && (
            <aside className="ka-global-sidebar fixed bottom-0 left-0 top-[72px] z-30 hidden w-64 flex-col border-r border-sky-500/12 bg-[#06101b]/95 px-3 py-4 backdrop-blur-xl lg:flex" aria-label={language === 'en' ? 'Desktop navigation' : 'Navigasi desktop'}>
              <div className="mb-3 px-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Workspace</p>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-sky-400/15 bg-sky-400/8 px-3 py-2 text-[10px] text-sky-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {language === 'en' ? 'Global intelligence · Watch-only' : 'Intelijen global · Pemantauan'}
                </div>
              </div>

              <nav className="space-y-1" aria-label={language === 'en' ? 'Main workspace' : 'Ruang kerja utama'}>
                {DESKTOP_NAV.map(({ id, page, icon: Icon, to }) => {
                  const label = desktopLabels[id];
                  const active = currentPageName === page;
                  return (
                    <Link
                      key={page}
                      to={to || createPageUrl(page)}
                      aria-current={active ? 'page' : undefined}
                      className={`ka-sidebar-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${active ? 'is-active' : ''} ${focusRing}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {user?.role === 'admin' && (
                <div className="mt-4 flex min-h-0 flex-col border-t border-sky-500/10 pt-4">
                  <div className="mb-2 flex items-center justify-between gap-2 px-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{adminLabels.heading}</p>
                    <span className="text-[8px] font-black text-sky-300">{adminLabels.access}</span>
                  </div>
                  <nav className="ka-sidebar-admin-scroll space-y-1 overflow-y-auto pr-1" aria-label={adminLabels.heading}>
                    {ADMIN_PRIMARY_NAV.map(({ id, page, icon: Icon }) => {
                      const active = currentPageName === page;
                      return (
                        <Link
                          key={page}
                          to={createPageUrl(page)}
                          aria-current={active ? 'page' : undefined}
                          className={`ka-sidebar-link ka-sidebar-admin-link flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all ${active ? 'is-active' : ''} ${focusRing}`}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{adminLabels[id]}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}

              <div className="mt-auto border-t border-sky-500/10 pt-3">
                <Link
                  to={createPageUrl('Services')}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-semibold text-slate-400 transition-all hover:bg-white/5 hover:text-white ${focusRing}`}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  {adminLabels.serviceMatrix}
                </Link>
              </div>
            </aside>
          )}

          {user && <div style={{ height: 'calc(2.5rem + env(safe-area-inset-top, 0px))' }} />}
          <div className="h-8" />

          <main className={user ? 'lg:pl-64' : ''}>
            <div className="lg:hidden">
              <MobileHeader currentPageName={currentPageName} />
            </div>

            <Suspense fallback={<div className="flex min-h-screen items-center justify-center ka-bg" role="status" aria-label={language === 'en' ? 'Loading page' : 'Memuat halaman'}><div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" /></div>}>
              <PageTransition>{children}</PageTransition>
            </Suspense>
          </main>

          <nav className="ka-embedded-nav fixed left-3 right-3 z-40 rounded-[28px] border border-sky-400/20 bg-[#071321]/94 p-1.5 backdrop-blur-2xl lg:hidden" aria-label={language === 'en' ? 'Primary navigation' : 'Navigasi utama'}>
            <div className="relative z-10 grid grid-cols-5 gap-1.5">
              {BOTTOM_NAV.map(({ id, page, icon: Icon }) => {
                const label = navLabels[id];
                const active = currentPageName === page;
                return (
                  <Link
                    key={page}
                    to={createPageUrl(page)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={label}
                    className={`relative flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] border px-1 transition-all duration-200 ${active ? 'border-sky-400/45 bg-gradient-to-b from-sky-400/20 to-blue-500/10 text-sky-300 shadow-[0_8px_24px_rgba(14,165,233,.16),inset_0_1px_0_rgba(255,255,255,.08)]' : 'border-white/[0.06] bg-slate-950/35 text-slate-400 hover:border-sky-400/20 hover:bg-sky-500/[0.07] hover:text-slate-200'} ${focusRing}`}
                  >
                    {active && <span className="absolute left-1/2 top-1 h-[2px] w-7 -translate-x-1/2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,.85)]" aria-hidden="true" />}
                    <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${active ? 'bg-sky-400/12 ring-1 ring-sky-300/20' : 'bg-white/[0.025]'}`}>
                      <Icon className={`h-[18px] w-[18px] ${active ? 'text-sky-300' : ''}`} aria-hidden="true" />
                    </span>
                    <span className={`w-full truncate text-center text-[10px] font-bold leading-none ${active ? 'text-sky-200' : ''}`}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {user?.role === 'admin' && (
            <div className="fixed bottom-0 left-64 right-0 z-30 hidden items-center gap-3 overflow-x-auto border-t border-sky-500/15 bg-[#06101b]/94 px-4 py-1.5 backdrop-blur-xl lg:flex" aria-label={adminLabels.heading}>
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
              <span className="shrink-0 text-[9px] font-black tracking-wider text-sky-300">{adminLabels.footer}</span>
              {ADMIN_SECONDARY_NAV.map(({ id, page, icon: Icon }) => {
                const active = currentPageName === page;
                return (
                  <Link
                    key={page}
                    to={createPageUrl(page)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[9px] font-semibold transition-all ${active ? 'bg-sky-400 text-slate-950' : 'bg-sky-500/8 text-sky-300 hover:bg-sky-500/14'} ${focusRing}`}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {adminLabels[id]}
                  </Link>
                );
              })}
              <Link
                to={createPageUrl('AdminUserBalances')}
                aria-current={currentPageName === 'AdminUserBalances' ? 'page' : undefined}
                className={`flex min-h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[9px] font-semibold transition-all ${currentPageName === 'AdminUserBalances' ? 'bg-sky-400 text-slate-950' : 'bg-sky-500/8 text-sky-300 hover:bg-sky-500/14'} ${focusRing}`}
              >
                <User className="h-3 w-3" aria-hidden="true" />
                {adminLabels.balances}
              </Link>
            </div>
          )}

          <div className="h-28 lg:h-6" />
        </div>
      </Web3Provider>
    </DisclaimerGate>
  );
}
