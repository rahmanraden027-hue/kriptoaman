import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeaturedMarketAsset from '@/components/home-v10/FeaturedMarketAsset';
import IntelligenceStream from '@/components/home-v10/IntelligenceStream';
import LiveMarketTicker from '@/components/home-v10/LiveMarketTicker';
import MarketPulse from '@/components/home-v10/MarketPulse';
import OnChainNow from '@/components/home-v10/OnChainNow';
import TopMovers from '@/components/home-v10/TopMovers';
import VerifyAnything from '@/components/home-v10/VerifyAnything';
import ZevaryqLiveStrip from '@/components/home-v10/ZevaryqLiveStrip';
import useMarketSurface from '@/hooks/useMarketSurface';
import { useLanguage } from '@/lib/LanguageContext';

const NAV_ITEMS = [
  { id: 'markets', to: '/Market' },
  { id: 'intelligence', to: '/IntelligenceHub' },
  { id: 'onchain', to: '/ZEVARYQ' },
  { id: 'ecosystem', to: '/qoryvex/discovery' },
];

const NAV_LABELS = {
  id: { home: 'Beranda', markets: 'Market', intelligence: 'Intelijen', onchain: 'On-Chain', ecosystem: 'Ekosistem' },
  en: { home: 'Home', markets: 'Markets', intelligence: 'Intelligence', onchain: 'On-Chain', ecosystem: 'Ecosystem' },
};

export default function HomeV10() {
  const market = useMarketSurface();
  const { language } = useLanguage();
  const navLabels = NAV_LABELS[language] || NAV_LABELS.id;

  return (
    <main
      className="min-h-screen bg-[#020711] pb-24 text-white"
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
          <Link to="/" className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-black tracking-[0.12em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">KRIPTOAMAN</Link>
          <nav aria-label={language === 'en' ? 'Primary navigation' : 'Navigasi utama'} className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ id, to }) => <Link key={id} to={to} className="inline-flex min-h-11 items-center rounded-lg px-3 text-[10px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">{navLabels[id]}</Link>)}
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
        <FeaturedMarketAsset assets={market.featured} state={market.state} />
        <MarketPulse
          gainers={market.gainers}
          active={market.active}
          direction={market.direction}
          assetCount={market.rawAssetCount}
        />

        <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <TopMovers
            gainers={market.gainers}
            losers={market.losers}
            active={market.active}
            newAssets={market.newAssets}
          />
          <IntelligenceStream events={market.events} state={market.state} capturedAt={market.capturedAt} />
        </section>

        <VerifyAnything />

        <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-stretch">
          <OnChainNow />
          <div className="lg:min-w-[360px]">
            <ZevaryqLiveStrip />
          </div>
        </section>
      </div>

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#020711]/96 px-2 pt-2 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          <Link to="/" aria-current="page" className="grid min-h-11 place-items-center rounded-xl text-[9px] font-black text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">{navLabels.home}</Link>
          {NAV_ITEMS.map(({ id, to }) => (
            <Link key={id} to={to} className="grid min-h-11 place-items-center rounded-xl text-center text-[9px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">{navLabels[id]}</Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
