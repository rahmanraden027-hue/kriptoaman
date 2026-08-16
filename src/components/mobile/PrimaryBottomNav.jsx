import React from 'react';
import { Link } from 'react-router-dom';
import { Home, TrendingUp, Wallet, Bell, User } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const PRIMARY_NAV = [
  { id: 'home', page: 'Home', to: '/dashboard', icon: Home },
  { id: 'markets', page: 'Market', to: '/Market', icon: TrendingUp },
  { id: 'wallet', page: 'Wallet', to: '/Wallet', icon: Wallet },
  { id: 'alerts', page: 'Alerts', to: '/Alerts', icon: Bell },
  { id: 'profile', page: 'Profile', to: '/Profile', icon: User },
];

const LABELS = {
  id: { home: 'Beranda', markets: 'Pasar', wallet: 'Pantau', alerts: 'Peringatan', profile: 'Profil' },
  en: { home: 'Home', markets: 'Markets', wallet: 'Watch', alerts: 'Alerts', profile: 'Profile' },
};

export default function PrimaryBottomNav({ currentPageName }) {
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.id;

  return (
    <nav
      aria-label={language === 'en' ? 'Primary navigation' : 'Navigasi utama'}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07111d]/97 backdrop-blur-xl border-t border-sky-500/20 shadow-[0_-12px_32px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {PRIMARY_NAV.map(({ id, page, to, icon: Icon }) => {
          const active = currentPageName === page;
          return (
            <Link
              key={page}
              to={to}
              className={`relative flex min-h-[58px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl transition-all ${active ? 'bg-sky-500/8 text-sky-400' : 'text-slate-400 hover:text-white'}`}
            >
              {active && (
                <span className="absolute -top-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-sky-400" />
              )}
              <Icon className={`h-5 w-5 ${active ? 'text-sky-400' : ''}`} />
              <span className={`text-[11px] font-semibold ${active ? 'text-sky-300' : ''}`}>
                {labels[id]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
