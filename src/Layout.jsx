import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Wallet, Activity, Coins, Clock } from 'lucide-react';

const NAV = [
  { label: 'Wallet', page: 'Wallet', icon: Wallet },
  { label: 'DEX & Savings', page: 'DEXSavings', icon: Coins },
  { label: 'Harga', page: 'PriceTracker', icon: Activity },
  { label: 'Riwayat', page: 'TxHistory', icon: Clock },
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {children}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 flex justify-around py-2 px-4 safe-area-pb">
        {NAV.map(({ label, page, icon: Icon }) => {
          const active = currentPageName === page;
          return (
            <Link key={page} to={createPageUrl(page)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : ''}`} />
              <span className={`text-[10px] font-semibold ${active ? 'text-blue-400' : ''}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom padding for nav */}
      <div className="h-16" />
    </div>
  );
}