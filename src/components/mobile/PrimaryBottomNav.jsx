import React from 'react';
import { Link } from 'react-router-dom';
import { Home, TrendingUp, Wallet, BarChart3, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const PRIMARY_NAV = [
  { id: 'home', page: 'Home', to: '/dashboard', icon: Home },
  { id: 'markets', page: 'Market', to: '/Market', icon: TrendingUp },
  { id: 'portfolio', page: 'PortfolioOverview', to: '/PortfolioOverview', icon: BarChart3 },
  { id: 'wallet', page: 'Wallet', to: '/Wallet', icon: Wallet },
  { id: 'security', page: 'SecurityHub', to: '/SecurityHub', icon: ShieldCheck },
];

const LABELS = {
  id: { home: 'Beranda', markets: 'Pasar', portfolio: 'Portofolio', wallet: 'Pantau', security: 'Keamanan' },
  en: { home: 'Home', markets: 'Markets', portfolio: 'Portfolio', wallet: 'Watch', security: 'Security' },
};

export default function PrimaryBottomNav({ currentPageName }) {
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.id;

  return (
    <nav
      aria-label={language === 'en' ? 'Primary navigation' : 'Navigasi utama'}
      className="ka-primary-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-sky-500/20 bg-[#07111d]/97 shadow-[0_-10px_28px_rgba(0,0,0,0.32)] backdrop-blur-xl"
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
              className={`ka-primary-nav-item relative flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl outline-none transition-all focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111d] ${active ? 'is-active bg-sky-500/8 text-sky-400' : 'text-slate-400 hover:text-white'}`}
            >
              {active && (
                <span aria-hidden="true" className="ka-primary-nav-indicator absolute top-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-sky-400" />
              )}
              <span aria-hidden="true" className={`ka-primary-nav-icon grid h-8 w-8 place-items-center rounded-xl ${active ? 'bg-sky-400/10' : ''}`}>
                <Icon className={`h-[18px] w-[18px] ${active ? 'text-sky-300' : ''}`} />
              </span>
              <span className={`max-w-full truncate px-1 text-[10px] font-semibold leading-none tracking-[-0.01em] ${active ? 'text-sky-200' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
