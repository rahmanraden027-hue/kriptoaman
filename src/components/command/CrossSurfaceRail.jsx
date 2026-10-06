import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import {
  BarChart3,
  BrainCircuit,
  Grid2X2,
  Network,
  PieChart,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

export const CROSS_SURFACE_ITEMS = Object.freeze([
  Object.freeze({ id: 'command-center', label: 'Command', to: '/', icon: Grid2X2 }),
  Object.freeze({ id: 'market', label: 'Market', to: '/Market', icon: BarChart3 }),
  Object.freeze({ id: 'intelligence', label: 'Intelligence', to: '/IntelligenceHub', icon: BrainCircuit }),
  Object.freeze({ id: 'network', label: 'Network', to: '/ZEVARYQ', icon: Network }),
  Object.freeze({ id: 'portfolio', label: 'Portfolio', to: '/PortfolioOverview', icon: PieChart }),
  Object.freeze({ id: 'security', label: 'Security', to: '/SecurityHub', icon: ShieldCheck }),
  Object.freeze({ id: 'wallet', label: 'Wallet', to: '/wallet-app', icon: WalletCards }),
]);

const SECONDARY_SURFACE_IDS = Object.freeze(['portfolio', 'security', 'wallet']);

const SURFACE_LABELS = Object.freeze({
  id: Object.freeze({
    'command-center': 'Beranda',
    market: 'Market',
    intelligence: 'Intelijen',
    network: 'Jaringan',
    portfolio: 'Portofolio',
    security: 'Keamanan',
    wallet: 'ZEVARYQ Wallet',
  }),
  en: Object.freeze({
    'command-center': 'Home',
    market: 'Markets',
    intelligence: 'Intelligence',
    network: 'Network',
    portfolio: 'Portfolio',
    security: 'Security',
    wallet: 'ZEVARYQ Wallet',
  }),
});

export default function CrossSurfaceRail({ current, compact = false }) {
  const { language } = useLanguage();
  const labels = SURFACE_LABELS[language] || SURFACE_LABELS.id;
  const visibleItems = CROSS_SURFACE_ITEMS.filter(({ id }) => SECONDARY_SURFACE_IDS.includes(id));

  return (
    <nav
      aria-label={language === 'en' ? 'Additional workspace tools' : 'Alat workspace tambahan'}
      data-product-continuity="phase15f"
      data-primary-navigation-owner="canonical-shell"
      data-secondary-tools-only="true"
      data-current-surface={current}
      className={`overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#06101b]/82 backdrop-blur-xl ${compact ? 'p-1.5' : 'p-2'}`}
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex min-w-max items-center gap-1.5">
        {visibleItems.map(({ id, label, to, icon: Icon }) => {
          const active = id === current;
          return (
            <Link
              key={id}
              to={to}
              aria-current={active ? 'page' : undefined}
              data-surface-link={id}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${active
                ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,.08)]'
                : 'border-white/[0.05] bg-black/15 text-slate-500 hover:border-sky-400/20 hover:text-slate-200'}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{labels[id] || label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
