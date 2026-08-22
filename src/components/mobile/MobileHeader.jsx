import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';

const ROOT_PAGES = ['Home', 'Market', 'PortfolioOverview', 'Wallet', 'SecurityHub', ''];
const ROOT_PATHS = new Set(['/', '/dashboard', '/home', '/market', '/portfoliooverview', '/wallet', '/securityhub']);

export default function MobileHeader({ currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const backLabel = language === 'en' ? 'Back' : 'Kembali';

  const pathname = (location.pathname || '/').replace(/\/$/, '').toLowerCase() || '/';
  const normalizedPage = String(currentPageName || '').trim().toLowerCase();

  // Market is a primary bottom-navigation destination. Never render a back header here.
  if (pathname === '/market' || pathname.startsWith('/market/') || normalizedPage === 'market') {
    return null;
  }

  const isRoot = ROOT_PAGES.some(page => page.toLowerCase() === normalizedPage) || ROOT_PATHS.has(pathname);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(createPageUrl('Home'));
    }
  };

  if (isRoot) return null;

  return (
    <div
      className="sticky z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800/60"
      style={{ top: 0, paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-3 py-1 flex items-center min-h-[44px]">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 px-2 min-h-[44px] min-w-[44px] rounded-lg text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
          aria-label={backLabel}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold leading-none">{backLabel}</span>
        </button>
      </div>
    </div>
  );
}
