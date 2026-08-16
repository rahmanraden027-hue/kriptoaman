import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ROOT_PAGES = ['Home', 'Wallet', 'Alerts', 'Profile', ''];
const ROOT_PATHS = new Set(['/', '/dashboard', '/home', '/wallet', '/alerts', '/profile']);
const MARKET_PATHS = new Set(['/market']);

export default function MobileHeader({ currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = (location.pathname || '/').replace(/\/$/, '').toLowerCase() || '/';
  const isMarket = currentPageName === 'Market' || MARKET_PATHS.has(pathname);
  const isRoot = ROOT_PAGES.includes(currentPageName || '') || ROOT_PATHS.has(pathname);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(createPageUrl('Home'));
    }
  };

  const handleMarketHome = () => {
    navigate(createPageUrl('Home'), { replace: true });
  };

  if (isRoot) return null;

  return (
    <div
      className="sticky z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800/60"
      style={{ top: 0, paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-3 py-1 flex items-center min-h-[44px]">
        {isMarket ? (
          <button
            onClick={handleMarketHome}
            className="inline-flex items-center gap-1.5 px-2.5 min-h-[38px] rounded-lg border border-sky-500/20 bg-sky-500/8 text-sky-300 hover:bg-sky-500/12 active:bg-sky-500/16 transition-colors"
            aria-label="Kembali ke Beranda"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold leading-none">Beranda</span>
          </button>
        ) : (
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 px-2 min-h-[38px] min-w-[44px] rounded-lg text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold leading-none">Kembali</span>
          </button>
        )}
      </div>
    </div>
  );
}
