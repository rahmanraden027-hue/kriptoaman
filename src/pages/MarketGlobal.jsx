import React from 'react';
import GlobalMarketsHub from '@/components/market/GlobalMarketsHub';
import MarketWithKAM from './MarketWithKAM.jsx';

export default function MarketGlobal() {
  return (
    <div className="min-h-screen ka-bg text-white">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <GlobalMarketsHub />
      </div>
      <MarketWithKAM />
    </div>
  );
}
