import React from 'react';
import HomeV2 from './HomeV2.jsx';
import HomeInstitutionalFooter from '@/components/home/HomeInstitutionalFooter';

export default function HomeV3() {
  return (
    <div className="ka-home-v3 ka-bg text-white">
      <style>{`
        @media (max-width: 1023px) {
          body:has(.ka-home-v3) .ka-global-shell > div:last-child {
            height: calc(5.5rem + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
      <HomeV2 />
      <div className="mx-auto max-w-7xl px-4 pb-1 sm:px-6 sm:pb-2 lg:px-8 lg:pb-0">
        <HomeInstitutionalFooter />
      </div>
    </div>
  );
}
