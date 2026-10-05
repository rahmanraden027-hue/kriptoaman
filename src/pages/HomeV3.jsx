import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Database,
  ExternalLink,
  Globe2,
  Radar,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import HomeInstitutionalFooter from '@/components/home/HomeInstitutionalFooter';
import NewTokenRadar from '@/components/market/NewTokenRadar';

const verifiedNumber = (value) => (
  value !== null &&
  value !== undefined &&
  value !== '' &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null
);

const fmtUsd = (value) => Number.isFinite(value)
  ? value >= 1e12
    ? '$' + (value / 1e12).toFixed(2) + 'T'
    : value >= 1e9
      ? '$' + (value / 1e9).toFixed(2) + 'B'
      : '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  : 'UNAVAILABLE';

const fmtPct = (value) => Number.isFinite(value) ? value.toFixed(1) + '%' : 'UNAVAILABLE';
const fmtNum = (value) => Number.isFinite(value) ? value.toLocaleString('en-US') : 'UNAVAILABLE';

function StatusCell({ label, value, note, tone = 'sky' }) {
  const toneClass = tone === 'emerald'
    ? 'text-emerald-300'
    : tone === 'amber'
      ? 'text-amber-300'
      : tone === 'violet'
        ? 'text-violet-300'
        : 'text-sky-300';

  return (
    <div className="min-w-0 rounded-2xl border border-white/[.06] bg-white/[.025] px-3 py-3">
      <p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">{label}</p>
      <p className={'mt-1 truncate text-sm font-black ' + toneClass}>{value}</p>
      {note && <p className="mt-1 truncate text-[8px] text-slate-500">{note}</p>}
    </div>
  );
}

function WorkspaceRoute({ icon: Icon, label, note, to, tone = 'sky' }) {
  const toneClass = tone === 'emerald'
    ? 'text-emerald-300'
    : tone === 'violet'
      ? 'text-violet-300'
      : tone === 'amber'
        ? 'text-amber-300'
        : 'text-sky-300';

  return (
    <Link
      to={to}
      className="group flex min-h-[96px] items-start gap-3 rounded-[22px] border border-white/[.06] bg-white/[.025] p-4 transition hover:border-sky-400/20 hover:bg-sky-400/[.04]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.06] bg-[#07111f]">
        <Icon className={'h-4.5 w-4.5 ' + toneClass} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-sm text-white">{label}</b>
        <small className="mt-1 block text-[10px] leading-4 text-slate-500">{note}</small>
      </span>
      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />
    </Link>
  );
}

function MarketCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-sky-400/10 bg-[#07111f]/76 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</span>
        <Icon className="h-3.5 w-3.5 text-sky-300" />
      </div>
      <div className="mt-2 truncate text-base font-black text-white">{value}</div>
      <div className="mt-1 text-[8px] text-slate-500">{note}</div>
    </div>
  );
}

export default function HomeV3() {
  const [market, setMarket] = useState(null);
  const [activeChains, setActiveChains] = useState(null);
  const [zvq, setZvq] = useState(null);
  const [query, setQuery] = useState('');

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    const evm = /^0x[a-fA-F0-9]{40}$/.test(value);
    const tx = /^0x[a-fA-F0-9]{64}$/.test(value);
    const block = /^\d+$/.test(value);

    if (tx) window.location.assign('https://explorer.kriptoaman.com/tx/' + value);
    else if (evm) window.location.assign('/asset-passport/' + value);
    else if (block) window.location.assign('https://explorer.kriptoaman.com/block/' + value);
    else window.location.assign('/Market?search=' + encodeURIComponent(value));
  };

  useEffect(() => {
    let live = true;

    const load = async () => {
      try {
        const [m, n, z] = await Promise.allSettled([
          fetch('/api/market-overview', { headers: { Accept: 'application/json' }, cache: 'no-store' }),
          fetch('/api/network-health', { headers: { Accept: 'application/json' }, cache: 'no-store' }),
          fetch('/api/kam/network-status', { headers: { Accept: 'application/json' }, cache: 'no-store' }),
        ]);

        if (!live) return;

        if (m.status === 'fulfilled' && m.value.ok) {
          const payload = await m.value.json();
          if (live && payload?.status === 'available') setMarket(payload);
        }

        if (n.status === 'fulfilled' && n.value.ok) {
          const payload = await n.value.json();
          const online = Number(payload?.summary?.online);
          if (live && Number.isFinite(online)) setActiveChains(online);
        }

        if (z.status === 'fulfilled' && z.value.ok) {
          const payload = await z.value.json();
          if (live) setZvq(payload?.live === true && payload?.verified === true ? payload : null);
        }

      } catch {
        // Keep verified-data placeholders on failure.
      }
    };

    load();
    const timer = window.setInterval(load, 60000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  const head = verifiedNumber(zvq?.blockNumber);
  const latency = verifiedNumber(zvq?.probeDurationMs);
  const verified = zvq?.verified === true;
  const syncState = verified ? String(zvq?.syncStatus || 'unknown').toUpperCase() : 'UNAVAILABLE';
  const marketAvailable = market?.status === 'available';

  return (
    <div className="ka-home-v3 ka-bg min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/15 bg-[#030914] p-4 shadow-[0_28px_80px_-48px_rgba(14,165,233,.7)] sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-violet-200">
              <BadgeCheck className="h-3.5 w-3.5" /> MY KRIPTOAMAN
            </div>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="max-w-3xl text-[2rem] font-black leading-[1.02] tracking-[-.045em] sm:text-4xl">
                  Your market. Your evidence. <span className="text-sky-300">Your actions.</span>
                </h1>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
                  Personal workspace for watchlists, alerts, portfolio context, discovery, and verified evidence.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to="/Market" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black">
                  <TrendingUp className="h-4 w-4" /> MARKET
                </Link>
                <Link to="/Alerts" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 text-xs font-black text-violet-200">
                  <BellRing className="h-4 w-4" /> ALERTS
                </Link>
                <Link to="/PortfolioOverview" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-xs font-black text-cyan-200">
                  <WalletCards className="h-4 w-4" /> PORTFOLIO
                </Link>
              </div>
            </div>

            <form onSubmit={submitSearch} className="mt-4 flex items-center gap-2 rounded-2xl border border-sky-400/15 bg-[#07111f]/86 p-2">
              <Search className="ml-2 h-4.5 w-4.5 shrink-0 text-sky-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Universal intelligence search"
                placeholder="Token / Contract / Wallet / Transaction / Block"
                className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
              <button type="submit" className="min-h-10 rounded-xl bg-sky-500 px-4 text-[10px] font-black text-slate-950">
                SEARCH
              </button>
            </form>

            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Compact production status">
              <StatusCell
                label="ZEVARYQ"
                value={verified && Number.isFinite(head) ? '#' + fmtNum(head) : 'UNAVAILABLE'}
                note="Verified chain head"
                tone={verified ? 'emerald' : 'amber'}
              />
              <StatusCell
                label="SYNC / RPC"
                value={syncState}
                note={verified && Number.isFinite(latency) ? fmtNum(latency) + ' ms probe' : 'Verified RPC required'}
                tone={syncState === 'SYNCED' ? 'emerald' : 'amber'}
              />
              <StatusCell
                label="MARKET"
                value={marketAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                note="KriptoAman market source"
                tone={marketAvailable ? 'emerald' : 'amber'}
              />
              <StatusCell
                label="NETWORKS"
                value={Number.isFinite(Number(activeChains)) ? fmtNum(Number(activeChains)) : 'UNAVAILABLE'}
                note="Successful live probes"
              />
            </div>
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">MY WORKSPACE</p>
              <h2 className="text-lg font-black">Open what needs your attention.</h2>
            </div>
            <Link to="/IntelligenceHub" className="text-[10px] font-black text-sky-300">INTELLIGENCE HUB →</Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <WorkspaceRoute icon={TrendingUp} label="Discover Market" note="Markets, movers, watchlist context." to="/Market" />
            <WorkspaceRoute icon={WalletCards} label="Portfolio" note="Watch-only holdings and asset context." to="/PortfolioOverview" tone="violet" />
            <WorkspaceRoute icon={BellRing} label="Alerts" note="Signals and monitored conditions." to="/Alerts" tone="amber" />
            <WorkspaceRoute icon={Star} label="Watchlist" note="Saved assets and monitored market context." to="/Market" tone="emerald" />
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-500">MY MARKET</p>
              <h2 className="text-lg font-black">Market context</h2>
            </div>
            <Link to="/Market" className="text-[10px] font-black text-sky-300">FULL MARKET →</Link>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <MarketCard icon={TrendingUp} label="Market Cap" value={fmtUsd(verifiedNumber(market?.marketCap))} note="Market API" />
            <MarketCard icon={Activity} label="24h Volume" value={fmtUsd(verifiedNumber(market?.volume24h))} note="Market API" />
            <MarketCard icon={Database} label="BTC Dominance" value={fmtPct(verifiedNumber(market?.btcDominance))} note="Market API" />
            <MarketCard icon={Radar} label="Tracked Assets" value={fmtNum(verifiedNumber(market?.activeCryptocurrencies))} note="Production source" />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[26px] border border-sky-400/15 bg-[#050d17]/88 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-sky-300">EMERGING ON-CHAIN ACTIVITY</p>
              <h2 className="text-xl font-black">New Token Radar</h2>
            </div>
            <Radar className="h-6 w-6 text-sky-300" />
          </div>
          <NewTokenRadar />
        </section>

        <section className="mt-5 grid gap-3 lg:grid-cols-3">
          <Link to="/QoryVExDiscovery" className="rounded-[24px] border border-violet-400/15 bg-[#050d17]/88 p-4 transition hover:bg-violet-400/[.04]">
            <WalletCards className="h-5 w-5 text-violet-300" />
            <h2 className="mt-3 text-base font-black">Asset Passport & Discovery</h2>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">Inspect contract identity, provenance and discovery evidence.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-violet-300">OPEN DISCOVERY <ArrowRight className="h-3 w-3" /></span>
          </Link>

          <Link to="/SystemStatus" className="rounded-[24px] border border-emerald-400/15 bg-[#050d17]/88 p-4 transition hover:bg-emerald-400/[.04]">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="mt-3 text-base font-black">System Evidence</h2>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">Open RPC, indexer and network diagnostics without repeating them on Home.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-emerald-300">SYSTEM STATUS <ArrowRight className="h-3 w-3" /></span>
          </Link>

          <a
            href="https://explorer.kriptoaman.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-[24px] border border-amber-400/15 bg-[#050d17]/88 p-4 transition hover:bg-amber-400/[.04]"
          >
            <Globe2 className="h-5 w-5 text-amber-300" />
            <h2 className="mt-3 text-base font-black">ZEVARYQ Explorer</h2>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">Verify blocks, transactions and indexed evidence directly.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-amber-300">OPEN EXPLORER <ExternalLink className="h-3 w-3" /></span>
          </a>
        </section>


      </div>

      <div className="mx-auto mt-5 max-w-7xl border-t border-sky-400/10 px-4 pb-1 pt-5 sm:px-6 sm:pb-2 lg:px-8">
        <HomeInstitutionalFooter />
      </div>
    </div>
  );
}
