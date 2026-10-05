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

const NAV = [
  ['/Market', 'Market'],
  ['/IntelligenceHub', 'Intelligence'],
  ['/PortfolioOverview', 'Portfolio'],
];

export default function HomeV10() {
  const market = useMarketSurface();

  return (
    <main className="min-h-screen bg-[#020711] pb-24 text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#020711]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-[1480px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-sm font-black tracking-[0.12em] text-white">KRIPTOAMAN</Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(([to, label]) => <Link key={to} to={to} className="rounded-lg px-3 py-2 text-[10px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-white">{label}</Link>)}
            <a href="#verify" className="rounded-lg px-3 py-2 text-[10px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-white">Verify</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/Market" aria-label="Search market" className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-400"><Search className="h-4 w-4" /></Link>
            <Link to="/Alerts" aria-label="Alerts" className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-400"><Bell className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      <LiveMarketTicker assets={market.assets} state={market.state} />

      <div className="mx-auto max-w-[1480px] space-y-4 px-3 pt-4 sm:px-6 sm:pt-6 lg:px-8">
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#020711]/96 px-2 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          <Link to="/" className="grid min-h-11 place-items-center rounded-xl text-[9px] font-black text-cyan-300">Home</Link>
          <Link to="/Market" className="grid min-h-11 place-items-center rounded-xl text-[9px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-cyan-300">Market</Link>
          <Link to="/IntelligenceHub" className="grid min-h-11 place-items-center rounded-xl text-[9px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-cyan-300">Intel</Link>
          <a href="#verify" className="grid min-h-11 place-items-center rounded-xl text-[9px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-cyan-300">Verify</a>
          <Link to="/PortfolioOverview" className="grid min-h-11 place-items-center rounded-xl text-[9px] font-black text-slate-400 hover:bg-white/[0.04] hover:text-cyan-300">Portfolio</Link>
        </div>
      </nav>
    </main>
  );
}
