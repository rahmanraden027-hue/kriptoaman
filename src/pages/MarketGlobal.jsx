import React from 'react';
import FirstPartyCryptoIntelligenceStrip from '@/components/market/FirstPartyCryptoIntelligenceStrip';
import NewTokenRadar from '@/components/market/NewTokenRadar';
import MarketWithKAM from './MarketWithKAM.jsx';

export default function MarketGlobal() {
  return (
    <div className="min-h-screen ka-bg text-white">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <FirstPartyCryptoIntelligenceStrip />
        <div className="mt-3 sm:mt-4">
          <NewTokenRadar />
        </div>
      </div>
      <MarketWithKAM />
    </div>
  );
}
