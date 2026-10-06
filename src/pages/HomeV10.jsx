import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import DataProvenanceBar from '@/components/home-v10/DataProvenanceBar';
import FeaturedMarketAsset from '@/components/home-v10/FeaturedMarketAsset';
import IntelligenceStream from '@/components/home-v10/IntelligenceStream';
import LiveMarketTicker from '@/components/home-v10/LiveMarketTicker';
import MarketPulse from '@/components/home-v10/MarketPulse';
import OnChainNow from '@/components/home-v10/OnChainNow';
import ProductFlowRail from '@/components/home-v10/ProductFlowRail';
import TopMovers from '@/components/home-v10/TopMovers';
import VerifyAnything from '@/components/home-v10/VerifyAnything';
import ZevaryqLiveStrip from '@/components/home-v10/ZevaryqLiveStrip';
import useMarketSurface from '@/hooks/useMarketSurface';
import { useLanguage } from '@/lib/LanguageContext';
import { PRODUCT_ARCHITECTURE_VERSION } from '@/lib/productArchitecture';
import { PRIMARY_NAV_ITEMS, primaryNavLabels, primaryNavTo } from '@/lib/primaryNavigation';

const HOME_NAV_ITEMS = PRIMARY_NAV_ITEMS.filter((item) => item.id !== 'home');

export default function HomeV10() {
  const market = useMarketSurface();
  const { language } = useLanguage();
  const navLabels = primaryNavLabels(language);

  return (
    <main
      className="min-h-screen bg-[#020711] pb-24 text-white"
      data-product-architecture={'kriptoaman-final-' + PRODUCT_ARCHITECTURE_VERSION}
      data-command-release="phase15d"
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <a
        href="#home-v10-content"
        className="sr-only fixed left-3 top-3 z-[100] rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-[#021018] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to live market data
      </a>
      <header
        className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#020711]/92 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex min-h-14 max-w-[1480px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="inline-flex min-h-11 items-center">
            <Link to="/" className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-black tracking-[0.12em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"><span>KRIPTOAMAN</span></Link>
            <span className="ml-2 hidden text-[8px] font-black tracking-[0.12em] text-cyan-300 lg:inline" aria-hidden="true">INTELLIGENCE</span>
          </div>
          <nav aria-label={language === 'en' ? 'Primary navigation' : 'Navigasi utama'} className="hidden items-center gap-1 md:flex">
            {HOME_NAV_ITEMS.map((item) => <Link key={item.id} to={primaryNavTo(item, 'public')} className="inline-flex min-h-11 items-center rounded-lg px-3 text-[10px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">{navLabels[item.id]}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/Market" aria-label={language === 'en' ? 'Search market' : 'Cari market'} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"><Search className="h-4 w-4" aria-hidden="true" /></Link>
            <Link to="/Alerts" aria-label={language === 'en' ? 'Alerts' : 'Peringatan'} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"><Bell className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </header>

      <LiveMarketTicker assets={market.assets} state={market.state} />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Market data status: {market.state}.
      </span>

      <div id="home-v10-content" tabIndex={-1} className="mx-auto max-w-[1480px] space-y-4 px-3 pt-4 outline-none sm:px-6 sm:pt-6 lg:px-8">
        <section data-command-layer="market" aria-label="Global market command layer" className="space-y-3">
          <FeaturedMarketAsset assets={market.featured} state={market.state} />
          <DataProvenanceBar
            state={market.provenance?.state}
            source={market.provenance?.sourceLabel || 'Source unavailable'}
            timestamp={market.provenance?.capturedAt}
            ageMs={market.provenance?.ageMs}
            label="MARKET FEED"
          />
          <MarketPulse
            gainers={market.gainers}
            active={market.active}
            direction={market.direction}
            assetCount={market.rawAssetCount}
          />
        </section>

        <section data-command-layer="intelligence" aria-label="KriptoAman intelligence layer" className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <TopMovers
            gainers={market.gainers}
            losers={market.losers}
            active={market.active}
            newAssets={market.newAssets}
          />
          <IntelligenceStream events={market.events} state={market.state} />
        </section>

        <section data-command-layer="network" aria-label="ZEVARYQ network layer" className="space-y-3">
          <ZevaryqLiveStrip />
          <OnChainNow />
        </section>

        <section data-command-layer="evidence" aria-label="Verification and evidence layer">
          <VerifyAnything />
        </section>

        <ProductFlowRail />
      </div>

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#020711]/96 px-2 pt-2 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          <Link to="/" aria-current="page" className="grid min-h-11 place-items-center rounded-xl text-[9px] font-black text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">{navLabels.home}</Link>
          {HOME_NAV_ITEMS.map((item) => (
            <Link key={item.id} to={primaryNavTo(item, 'public')} className="grid min-h-11 place-items-center rounded-xl text-center text-[9px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">{navLabels[item.id]}</Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
