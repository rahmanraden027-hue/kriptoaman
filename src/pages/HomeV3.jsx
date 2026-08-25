import React from 'react';
import HomeV2 from './HomeV2.jsx';
import HomeInstitutionalFooter from '@/components/home/HomeInstitutionalFooter';

export default function HomeV3() {
  return (
    <div className="ka-bg min-h-screen text-white">
      <HomeV2 />
      <div className="mx-auto -mt-24 max-w-7xl px-4 pb-1 sm:px-6 sm:pb-2 lg:px-8 lg:pb-0">
        <HomeInstitutionalFooter />
      </div>
    </div>
  );
}
