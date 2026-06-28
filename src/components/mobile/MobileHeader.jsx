import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ROOT_PAGES = ['Home', 'Market', 'Wallet', 'Alerts', 'Profile', ''];

export default function MobileHeader({ currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isRoot = ROOT_PAGES.includes(currentPageName || '');

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(createPageUrl('Home'));
    }
  };

  if (isRoot) return null;

  return (
    <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 px-2 py-2 flex items-center gap-1">
      <button
        onClick={handleBack}
        className="flex items-center gap-1 px-3 min-h-[44px] min-w-[44px] rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
        aria-label="Kembali"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Kembali</span>
      </button>
    </div>
  );
}