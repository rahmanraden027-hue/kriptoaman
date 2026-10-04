import React from 'react';
import LiveBlockFlow3D from '@/components/home/LiveBlockFlow3D';
import LandingMarketPulse from '@/components/landing/LandingMarketPulse';
import GLandingBody from '@/components/landing/GLandingBody';
import GLandingInstitutional from '@/components/landing/GLandingInstitutional';
import GLandingProductionGateways from '@/components/landing/GLandingProductionGateways';

export default function GLandingDeferredContent({ stats }) {
  return (
    <>
      <section className="px-4 sm:px-6" aria-label="ZEVARYQ live command center">
        <div className="max-w-[1440px] mx-auto">
          <LiveBlockFlow3D
            compactLanding
            betweenBlockAndNode={<LandingMarketPulse />}
          />
        </div>
      </section>
      <GLandingBody stats={stats} />
      <GLandingProductionGateways />
      <GLandingInstitutional />
    </>
  );
}
