import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import CommandCenterHero from '@/components/home-v10/CommandCenterHero';
import CommandShortcutRail from '@/components/home-v10/CommandShortcutRail';
import CommandStats from '@/components/home-v10/CommandStats';
import DataProvenanceBar from '@/components/home-v10/DataProvenanceBar';
import EcosystemRail from '@/components/home-v10/EcosystemRail';
import LiveMarketTicker from '@/components/home-v10/LiveMarketTicker';
import MarketCommandGrid from '@/components/home-v10/MarketCommandGrid';
import NetworkPulse from '@/components/home-v10/NetworkPulse';
import OnChainNow from '@/components/home-v10/OnChainNow';
import ProductFlowRail from '@/components/home-v10/ProductFlowRail';
import VerifyAnything from '@/components/home-v10/VerifyAnything';
import ZevaryqLiveStrip from '@/components/home-v10/ZevaryqLiveStrip';
import useMarketSurface from '@/hooks/useMarketSurface';
import useZevaryqSurface from '@/hooks/useZevaryqSurface';
import { useLanguage } from '@/lib/LanguageContext';
import { PRODUCT_ARCHITECTURE_VERSION } from '@/lib/productArchitecture';
import { PRIMARY_NAV_ITEMS, primaryNavLabels, primaryNavTo } from '@/lib/primaryNavigation';

// Legacy Phase 10K surfaces intentionally superseded by the unified command grid:
// FeaturedMarketAsset · MarketPulse · TopMovers · IntelligenceStream
const HOME_NAV_ITEMS = PRIMARY_NAV_ITEMS.filter((item) => item.id !== 'home');

export default function HomeV10() {
  const market = useMarketSurface();
  const zevaryq = useZevaryqSurface();
  const { language } = useLanguage();
  const navLabels = primaryNavLabels(language);
  const english = language === 'en';

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_50%_-8%,rgba(14,165,233,.11),transparent_27%),radial-gradient(circle_at_92%_12%,rgba(245,158,11,.045),transparent_24%),linear-gradient(#020711,#01050c)] pb-24 text-white"
      data-product-architecture={'kriptoaman-final-' + PRODUCT_ARCHITECTURE_VERSION}
      data-command-release="phase15d"
      data-production-data-binding="phase16b-verified-live-state-v1"
      data-runtime-state-unification="first-party-corroborated-v1"
      data-visual-integration="phase16c-final-command-center-v1"
      data-home-composition="home-live-intelligence-command-center-v1"
      data-master-final="clean-command-center-v1"
      data-production-visual-master="v1"
      data-animation-polish="calm-reduced-motion-safe-v1"
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <a
        href="#home-v10-content"
        className="sr-only fixed left-3 top-3 z-[100] rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-[#021018] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to live market data
      </a>

      <header
        className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#020711]/94 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex min-h-16 max-w-[1580px] items-center gap-3 px-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
            aria-label="KriptoAman home"
          >
            <img src="/brand/kriptoaman-mark-premium.webp" alt="" width="36" height="36" className="h-9 w-9 object-contain" />
            <span className="text-sm font-black tracking-[0.08em] text-white sm:text-base">KRIPTOAMAN</span>
          </Link>
          <span className="hidden text-[8px] font-black uppercase tracking-[0.14em] text-cyan-300 lg:inline">INTELLIGENCE</span>
          <span className="hidden text-[7px] font-black uppercase tracking-[0.13em] text-slate-400 xl:inline">
            Crypto Intelligence. Global Market Edge.
          </span>

          <nav aria-label={english ? 'Primary navigation' : 'Navigasi utama'} className="hidden items-center gap-1 md:flex">
            {HOME_NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={primaryNavTo(item, 'public')}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-[10px] font-black text-slate-400 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
              >
                {navLabels[item.id]}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/Market"
              aria-label={language === 'en' ? 'Search market' : 'Cari market'}
              className="grid h-11 min-h-11 w-11 min-w-11 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 lg:hidden"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/Market"
              aria-label={language === 'en' ? 'Search market' : 'Cari market'}
              className="hidden min-h-11 min-w-[220px] items-center gap-2 rounded-xl border border-cyan-300/[0.09] bg-[#06101d]/75 px-3 text-[9px] text-slate-400 transition hover:border-cyan-300/20 lg:flex"
            >
              <Search className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              {english ? 'Search assets, market, intelligence...' : 'Cari aset, market, intelligence...'}
            </Link>
            <Link
              to="/Alerts"
              aria-label={english ? 'Alerts' : 'Peringatan'}
              className="grid h-11 min-h-11 w-11 min-w-11 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/Login"
              className="hidden min-h-11 items-center rounded-xl border border-amber-300/30 bg-amber-300 px-4 text-[9px] font-black uppercase tracking-[0.09em] text-[#07101c] shadow-[0_0_28px_rgba(251,191,36,.12)] transition hover:bg-amber-200 sm:inline-flex"
            >
              {english ? 'Open KriptoAman' : 'Masuk KriptoAman'} →
            </Link>
          </div>
        </div>
      </header>

      <LiveMarketTicker assets={market.assets} state={market.state} />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Market data status: {market.state}. ZEVARYQ data status: {zevaryq.overallState}.
      </span>

      <div
        id="home-v10-content"
        tabIndex={-1}
        className="mx-auto max-w-[1580px] space-y-3 px-3 pt-3 outline-none sm:space-y-4 sm:px-6 sm:pt-5 lg:px-8"
      >
        <section data-command-layer="market" aria-label="Global market command layer" className="space-y-3">
          <CommandCenterHero market={market} zevaryq={zevaryq} />
          <CommandStats market={market} zevaryq={zevaryq} />
          <DataProvenanceBar
            state={market.provenance?.state}
            source={market.provenance?.sourceLabel || 'Source unavailable'}
            timestamp={market.provenance?.capturedAt}
            ageMs={market.provenance?.ageMs}
            label="MARKET FEED"
          />
        </section>

        <section data-command-layer="intelligence" aria-label="KriptoAman intelligence layer" className="space-y-3">
          <CommandShortcutRail />
          <MarketCommandGrid market={market} zevaryq={zevaryq} />
        </section>

        <section
          data-command-layer="network"
          data-zvq-overall-state={zevaryq.overallState}
          aria-label="ZEVARYQ network layer"
          className="space-y-3"
        >
          <ZevaryqLiveStrip surface={zevaryq} />
          <NetworkPulse surface={zevaryq} />
          <OnChainNow surface={zevaryq} />
        </section>

        <section data-command-layer="evidence" aria-label="Verification and evidence layer" className="space-y-3">
          <VerifyAnything />
          <EcosystemRail />
          <ProductFlowRail />
        </section>
      </div>

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#020711]/96 px-2 pt-2 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          <Link
            to="/"
            aria-current="page"
            className="grid min-h-11 place-items-center rounded-xl text-[10px] font-black text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
          >
            {navLabels.home}
          </Link>
          {HOME_NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={primaryNavTo(item, 'public')}
              className="grid min-h-11 place-items-center rounded-xl text-center text-[10px] font-black text-slate-300 hover:bg-white/[0.04] hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
            >
              {navLabels[item.id]}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
