import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, PieChart, Wallet, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const ACTIONS = [
  { id: 'market', page: 'Market', icon: TrendingUp },
  { id: 'portfolio', page: 'PortfolioOverview', icon: PieChart },
  { id: 'wallet', page: 'Wallet', icon: Wallet },
  { id: 'security', page: 'SecurityHub', icon: ShieldCheck },
  { id: 'kyc', page: 'KYC', icon: BadgeCheck },
];
const LABELS = {
  id: { market: 'Pasar', portfolio: 'Portofolio', wallet: 'Pantau Wallet', security: 'Keamanan', kyc: 'KYC' },
  en: { market: 'Markets', portfolio: 'Portfolio', wallet: 'Watch Wallet', security: 'Security', kyc: 'KYC' },
};

export default function HomeQuickActions() {
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.id;
  return (
    <div className="ka-surface p-4 ka-fade-up">
      <div className="grid grid-cols-5 gap-2">
        {ACTIONS.map(({ id, page, icon: Icon }) => {
          const label = labels[id];
          return (
          <Link key={label} to={createPageUrl(page)}
            className="flex flex-col items-center gap-2 py-2 rounded-2xl ka-surface-hover active:scale-95 transition tap-reset">
            <div className="w-12 h-12 rounded-2xl bg-ka-emerald/12 border border-ka-emerald/25 flex items-center justify-center ka-emerald-glow">
              <Icon className="w-5 h-5 text-ka-emerald" />
            </div>
            <span className="text-[11px] font-bold text-white text-center">{label}</span>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
