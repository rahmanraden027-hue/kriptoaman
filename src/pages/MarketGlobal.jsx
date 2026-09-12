import React from 'react';
import GlobalMarketsHubV2 from '@/components/market/GlobalMarketsHubV2';
import MarketWithKAM from './MarketWithKAM.jsx';

export default function MarketGlobal() {
  return (
    <div className="min-h-screen ka-bg text-white">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <GlobalMarketsHubV2 />
      </div>
      <MarketWithKAM />
    </div>
  );
}
