import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, PieChart, Wallet, ShieldCheck, BadgeCheck } from 'lucide-react';

const ACTIONS = [
  { label: 'Pasar', page: 'Market', icon: TrendingUp },
  { label: 'Portfolio', page: 'PortfolioOverview', icon: PieChart },
  { label: 'Pantau Wallet', page: 'Wallet', icon: Wallet },
  { label: 'Keamanan', page: 'SecurityHub', icon: ShieldCheck },
  { label: 'KYC', page: 'KYC', icon: BadgeCheck },
];

export default function HomeQuickActions() {
  return (
    <div className="ka-surface p-4 ka-fade-up">
      <div className="grid grid-cols-5 gap-2">
        {ACTIONS.map(({ label, page, icon: Icon }) => (
          <Link key={label} to={createPageUrl(page)}
            className="flex flex-col items-center gap-2 py-2 rounded-2xl ka-surface-hover active:scale-95 transition tap-reset">
            <div className="w-12 h-12 rounded-2xl bg-ka-emerald/12 border border-ka-emerald/25 flex items-center justify-center ka-emerald-glow">
              <Icon className="w-5 h-5 text-ka-emerald" />
            </div>
            <span className="text-[11px] font-bold text-white text-center"
          </Link>
        ))}
      </div>
    </div>
  );
}
