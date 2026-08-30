import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Bell, BrainCircuit, FlaskConical, Home, Search, ShieldCheck, TrendingUp, Wallet, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

const ONBOARDING_KEY = 'ka_financial_intelligence_onboarding_v1';

const SEARCH_ITEMS = [
  { id: 'dashboard', path: '/dashboard', icon: Home, idLabel: 'Dasbor', enLabel: 'Dashboard', keywords: 'home overview command center' },
  { id: 'market', path: '/Market', icon: TrendingUp, idLabel: 'Market Intelligence', enLabel: 'Market Intelligence', keywords: 'market prices movers breadth crypto' },
  { id: 'portfolio', path: '/PortfolioOverview', icon: BarChart3, idLabel: 'Portfolio Intelligence', enLabel: 'Portfolio Intelligence', keywords: 'portfolio risk exposure allocation pnl' },
  { id: 'intelligence', path: '/IntelligenceHub', icon: BrainCircuit, idLabel: 'Intelligence Hub', enLabel: 'Intelligence Hub', keywords: 'ai insight research intelligence' },
  { id: 'paper', path: '/PaperTrading', icon: FlaskConical, idLabel: 'Trading Workspace', enLabel: 'Trading Workspace', keywords: 'paper trading simulation virtual order' },
  { id: 'alerts', path: '/Alerts', icon: Bell, idLabel: 'Alerts Intelligence', enLabel: 'Alerts Intelligence', keywords: 'alert notification target price' },
  { id: 'wallet', path: '/Wallet', icon: Wallet, idLabel: 'Pantau Wallet', enLabel: 'Watch Wallet', keywords: 'wallet watch portfolio address' },
  { id: 'security', path: '/SecurityHub', icon: ShieldCheck, idLabel: 'Security Hub', enLabel: 'Security Hub', keywords: 'security protection safety' },
  { id: 'security-admin', path: '/SecurityCenter', icon: ShieldCheck, idLabel: 'Security Center Admin', enLabel: 'Admin Security Center', keywords: 'admin security posture score controls', adminOnly: true },
];

const ONBOARDING = {
  id: [
    { title: 'Financial Intelligence Workspace', body: 'KriptoAman sekarang menggabungkan market, portofolio, keamanan, insight, dan simulasi dalam satu workspace.' },
    { title: 'Cari dari mana saja', body: 'Gunakan pencarian global atau tekan Ctrl/⌘ + K untuk membuka Market Intelligence, Portfolio, Alerts, dan workspace lain.' },
    { title: 'Insight berbasis data', body: 'AI Insight menggunakan snapshot data yang tersedia dan tidak boleh mengarang harga atau sinyal yang tidak memiliki sumber.' },
    { title: 'Simulation-first', body: 'Trading Workspace tetap menggunakan saldo virtual. Tidak ada dana nyata, private key, seed phrase, atau transaksi blockchain.' },
  ],
  en: [
    { title: 'Financial Intelligence Workspace', body: 'KriptoAman brings markets, portfolio, security, insight, and simulation into one workspace.' },
    { title: 'Search from anywhere', body: 'Use Global Search or press Ctrl/⌘ + K to open Market Intelligence, Portfolio, Alerts, and other workspaces.' },
    { title: 'Data-grounded insight', body: 'AI Insight uses available market snapshots and must not invent prices or unsupported signals.' },
    { title: 'Simulation-first', body: 'Trading Workspace remains virtual. No real funds, private keys, seed phrases, or blockchain execution are involved.' },
  ],
};

export default function WorkspaceExperience() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps = ONBOARDING[language] || ONBOARDING.id;

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      if (localStorage.getItem(ONBOARDING_KEY) !== 'done') setOnboardingOpen(true);
    } catch {
      // Storage restrictions should not block the workspace.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isAuthenticated) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthenticated]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
    else setQuery('');
  }, [open]);

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SEARCH_ITEMS
      .filter((item) => !item.adminOnly || user?.role === 'admin')
      .filter((item) => {
        if (!normalized) return true;
        const label = language === 'en' ? item.enLabel : item.idLabel;
        return `${label} ${item.keywords}`.toLowerCase().includes(normalized);
      })
      .slice(0, 8);
  }, [language, query, user?.role]);

  const finishOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, 'done'); } catch { /* ignore */ }
    setOnboardingOpen(false);
    setStep(0);
  };

  const go = (path) => {
    setOpen(false);
    if (location.pathname !== path) navigate(path);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <style>{`
        .ka-global-shell { min-height: 100dvh; overflow-x: clip; }
        .ka-global-shell main { min-width: 0; }
        .ka-global-shell img, .ka-global-shell svg, .ka-global-shell canvas { max-width: 100%; }
        @media (max-width: 767px) {
          .ka-global-shell input, .ka-global-shell select, .ka-global-shell textarea { font-size: 16px; }
          .ka-global-shell .ka-command-panel, .ka-global-shell .ka-surface { max-width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ka-global-shell *, .ka-workspace-experience * { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ka-workspace-experience fixed bottom-[calc(6.7rem+env(safe-area-inset-bottom,0px))] right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/25 bg-[#071321]/95 text-sky-200 shadow-[0_18px_50px_rgba(0,0,0,.45)] backdrop-blur-xl transition hover:border-sky-300/45 hover:bg-sky-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 lg:bottom-5"
        aria-label={language === 'en' ? 'Open global search' : 'Buka pencarian global'}
        title={language === 'en' ? 'Global Search · Ctrl/⌘ K' : 'Pencarian Global · Ctrl/⌘ K'}
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div className="ka-workspace-experience fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/76 px-3 pt-[max(5rem,env(safe-area-inset-top,0px))] backdrop-blur-md sm:px-5 sm:pt-24" role="dialog" aria-modal="true" aria-label="Global Search">
          <button className="absolute inset-0 cursor-default" aria-label={language === 'en' ? 'Close search' : 'Tutup pencarian'} onClick={() => setOpen(false)} />
          <section className="relative w-full max-w-2xl overflow-hidden rounded-[26px] border border-sky-400/20 bg-[#071321] shadow-[0_32px_100px_rgba(0,0,0,.62)]">
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-sky-300" />
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === 'en' ? 'Search markets, portfolio, security…' : 'Cari pasar, portofolio, keamanan…'} className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-600" />
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[min(62vh,520px)] overflow-y-auto p-2">
              {items.length ? items.map((item) => {
                const Icon = item.icon;
                const label = language === 'en' ? item.enLabel : item.idLabel;
                return (
                  <button key={item.id} type="button" onClick={() => go(item.path)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-sky-400/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/15 bg-sky-400/8 text-sky-300"><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0"><span className="block truncate text-sm font-extrabold text-white">{label}</span><span className="block truncate text-[11px] text-slate-500">{item.path}</span></span>
                  </button>
                );
              }) : <div className="px-5 py-10 text-center text-sm text-slate-500">{language === 'en' ? 'No matching workspace found.' : 'Workspace yang sesuai tidak ditemukan.'}</div>}
            </div>
            <div className="border-t border-white/8 px-4 py-2.5 text-[10px] text-slate-600">Ctrl/⌘ + K · {language === 'en' ? 'Navigation only — no transactions are executed from search.' : 'Hanya navigasi — pencarian tidak mengeksekusi transaksi.'}</div>
          </section>
        </div>
      )}

      {onboardingOpen && (
        <div className="ka-workspace-experience fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="KriptoAman onboarding">
          <section className="w-full max-w-lg rounded-[28px] border border-sky-400/20 bg-[#071321] p-5 shadow-[0_32px_100px_rgba(0,0,0,.65)] sm:p-6">
            <div className="flex items-center justify-between gap-3"><span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[9px] font-black tracking-[.14em] text-sky-300">KRIPTOAMAN 2.0</span><span className="text-[10px] font-bold text-slate-500">{step + 1}/{steps.length}</span></div>
            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10"><BrainCircuit className="h-6 w-6 text-sky-300" /></div>
            <h2 className="mt-4 text-xl font-black text-white sm:text-2xl">{steps[step].title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{steps[step].body}</p>
            <div className="mt-5 flex gap-1.5">{steps.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-sky-400' : 'bg-white/8'}`} />)}</div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={finishOnboarding} className="min-h-11 px-2 text-xs font-bold text-slate-500 hover:text-slate-300">{language === 'en' ? 'Skip' : 'Lewati'}</button>
              <button type="button" onClick={() => step === steps.length - 1 ? finishOnboarding() : setStep((value) => value + 1)} className="min-h-11 rounded-xl bg-sky-500 px-5 text-sm font-black text-slate-950 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">{step === steps.length - 1 ? (language === 'en' ? 'Open workspace' : 'Buka workspace') : (language === 'en' ? 'Next' : 'Lanjut')}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
