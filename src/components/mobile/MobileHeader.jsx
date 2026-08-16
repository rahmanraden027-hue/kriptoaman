import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ROOT_PAGES = ['Home', 'Market', 'Wallet', 'Alerts', 'Profile', ''];

export default function MobileHeader({ currentPageName }) {
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
    <div
      className="sticky z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800/60"
      style={{ top: 0, paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-2 py-1.5 flex items-center min-h-[48px]">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-2.5 min-h-[40px] min-w-[44px] rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
          aria-label="Kembali"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold leading-none">Kembali</span>
        </button>
      </div>
    </div>
  );
}
