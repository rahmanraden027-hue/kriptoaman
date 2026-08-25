import React from 'react';
import { Link } from 'react-router-dom';
import { Home, TrendingUp, Wallet, BrainCircuit, UserRound } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const PRIMARY_NAV = [
  { id: 'home', page: 'Home', to: '/dashboard', icon: Home },
  { id: 'markets', page: 'Market', to: '/Market', icon: TrendingUp },
  { id: 'intelligence', page: 'IntelligenceHub', to: '/IntelligenceHub', icon: BrainCircuit },
  { id: 'wallet', page: 'Wallet', to: '/Wallet', icon: Wallet },
  { id: 'profile', page: 'Profile', to: '/Profile', icon: UserRound },
];

const LABELS = {
  id: { home: 'Beranda', markets: 'Pasar', intelligence: 'Intelijen', wallet: 'Pantau', profile: 'Profil' },
  en: { home: 'Home', markets: 'Markets', intelligence: 'Intelligence', wallet: 'Watch', profile: 'Profile' },
};

export default function PrimaryBottomNav({ currentPageName }) {
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.id;

  return (
    <nav
      aria-label={language === 'en' ? 'Primary navigation' : 'Navigasi utama'}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-sky-400/15 bg-[#040b14]/95 shadow-[0_-16px_42px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-xl items-center justify-around px-1.5 py-1.5">
        {PRIMARY_NAV.map(({ id, page, to, icon: Icon }) => {
          const active = currentPageName === page;
          const label = labels[id];
          return (
            <Link
              key={page}
              to={to}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={`relative flex min-h-[58px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040b14] ${active ? 'text-sky-300' : 'text-slate-500 hover:text-slate-200'}`}
            >
              {active && (
                <span aria-hidden="true" className="absolute inset-x-2 top-1 h-10 rounded-2xl border border-sky-400/15 bg-sky-400/[0.07] shadow-[0_10px_28px_-18px_rgba(56,189,248,.85)]" />
              )}
              <Icon aria-hidden="true" className={`relative h-[18px] w-[18px] ${active ? 'text-sky-300' : ''}`} />
              <span className={`relative max-w-full truncate px-1 text-[9px] font-bold leading-none ${active ? 'text-sky-200' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
