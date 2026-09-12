import React from 'react';
import GlobalMarketsHub from './GlobalMarketsHub';
import GlobalMarketIntelligencePanel from './GlobalMarketIntelligencePanel';
import useGlobalMarkets from './useGlobalMarkets';

export default function GlobalMarketsHubV2() {
  const { data, instruments } = useGlobalMarkets();

  return (
    <>
      <GlobalMarketsHub />
      <GlobalMarketIntelligencePanel
        instruments={instruments}
        providerMode={data?.providerMode || 'fallback-reference'}
      />
    </>
  );
}
