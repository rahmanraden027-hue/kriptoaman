import React, { useMemo } from 'react';
import { ArrowRight, Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DATA_STATE } from '@/lib/dataState';
import DataProvenanceBar from './DataProvenanceBar';
import AssetLogo from '@/components/market/AssetLogo';
import { formatChange, formatCompactUsd, formatPrice } from './format';

const ORBIT_POSITIONS = [
  'left-[7%] top-[17%]',
  'right-[6%] top-[20%]',
  'left-[1%] top-[52%]',
  'right-[1%] top-[55%]',
  'left-[13%] bottom-[12%]',
  'right-[12%] bottom-[10%]',
];

const ANCHOR_ORBIT_SYMBOLS = Object.freeze(['BTC', 'ETH', 'SOL', 'BNB', 'XRP']);

const selectOrbitAssets = (assets) => {
  const verified = Array.isArray(assets) ? assets.filter(Boolean) : [];
  const bySymbol = new Map();
  for (const asset of verified) {
    const symbol = String(asset?.sym || '').toUpperCase();
    if (symbol && !bySymbol.has(symbol)) bySymbol.set(symbol, asset);
  }

  const anchors = ANCHOR_ORBIT_SYMBOLS.map((symbol) => bySymbol.get(symbol)).filter(Boolean);
  const used = new Set(anchors.map((asset) => String(asset.sym || '').toUpperCase()));
  const mover = [...verified]
    .filter((asset) => !used.has(String(asset?.sym || '').toUpperCase()))
    .filter((asset) => Number.isFinite(Number(asset?.change24h)))
    .sort((a, b) => Math.abs(Number(b.change24h)) - Math.abs(Number(a.change24h)))[0];

  return [...anchors, ...(mover ? [mover] : [])].slice(0, ORBIT_POSITIONS.length);
};

const safeSum = (assets, key) => assets.reduce((sum, asset) => {
  const value = Number(asset?.[key]);
  return Number.isFinite(value) && value > 0 ? sum + value : sum;
}, 0);

const stateTone = (state) => {
  if ([DATA_STATE.LIVE, DATA_STATE.SYNCED, DATA_STATE.VERIFIED].includes(state)) {
    return 'border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-200';
  }
  if ([DATA_STATE.DELAYED, DATA_STATE.SNAPSHOT, DATA_STATE.CHECKING].includes(state)) {
    return 'border-amber-300/25 bg-amber-300/[0.07] text-amber-200';
  }
  return 'border-slate-300/15 bg-white/[0.035] text-slate-300';
};

function StateBadge({ state }) {
  return (
    <span className={'inline-flex min-h-7 items-center rounded-full border px-2 text-[8px] font-black uppercase tracking-[0.12em] ' + stateTone(state)}>
      ● {state}
    </span>
  );
}

function AssetSignal({ asset, position }) {
  if (!asset) return null;
  const change = Number(asset.change24h);
  const positive = Number.isFinite(change) && change >= 0;

  return (
    <Link
      to={'/Market?search=' + encodeURIComponent(asset.sym)}
      className={'absolute z-20 flex min-h-11 max-w-[122px] items-center gap-2 rounded-xl border border-cyan-200/15 bg-[#06111f]/94 px-2.5 py-1.5 shadow-[0_0_24px_rgba(34,211,238,.08)] backdrop-blur-md transition hover:border-cyan-200/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 motion-reduce:transition-none ' + position}
      aria-label={'Open ' + asset.sym + ' market data'}
    >
      <AssetLogo asset={asset} size={20} />
      <span className="min-w-0">
        <b className="block truncate text-[9px] text-white">{asset.sym}</b>
        <span className={'block truncate text-[7px] font-black ' + (positive ? 'text-emerald-300' : 'text-rose-300')}>
          {formatPrice(asset.price)} · {formatChange(change)}
        </span>
      </span>
    </Link>
  );
}

function NetworkGlobe({ assets, zevaryq }) {
  const block = Number(zevaryq?.network?.blockNumber);
  const networkState = zevaryq?.networkState || DATA_STATE.CHECKING;
  const active = [DATA_STATE.LIVE, DATA_STATE.VERIFIED].includes(networkState);
  const nodes = selectOrbitAssets(assets);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" data-visual-topology="kriptoaman-nexus-with-zevaryq-evidence" data-orbit-mode="anchor-plus-live-mover-v1">
      <div className="absolute inset-[5%] rounded-full bg-[radial-gradient(circle_at_43%_32%,rgba(56,189,248,.28),rgba(3,10,22,.70)_43%,rgba(1,6,14,.98)_72%)] shadow-[0_0_95px_rgba(14,165,233,.17),inset_0_0_60px_rgba(56,189,248,.10)]" />
      <div className="absolute inset-[8%] rounded-full border border-cyan-300/25 shadow-[inset_0_0_42px_rgba(34,211,238,.10)]" />

      <svg className="absolute inset-[8%] h-[84%] w-[84%] opacity-80" viewBox="0 0 400 400" role="img" aria-label="KriptoAman visual topology with verified ZEVARYQ core">
        <defs>
          <radialGradient id="cc-globe-v1" cx="45%" cy="34%" r="68%">
            <stop offset="0%" stopColor="rgba(14,165,233,.28)" />
            <stop offset="62%" stopColor="rgba(8,47,73,.16)" />
            <stop offset="100%" stopColor="rgba(2,6,23,.08)" />
          </radialGradient>
          <linearGradient id="cc-gold-v1" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(245,158,11,.05)" />
            <stop offset="50%" stopColor="rgba(251,191,36,.85)" />
            <stop offset="100%" stopColor="rgba(245,158,11,.05)" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="154" fill="url(#cc-globe-v1)" stroke="rgba(103,232,249,.32)" strokeWidth="1.2" />
        <ellipse cx="200" cy="200" rx="154" ry="57" fill="none" stroke="rgba(103,232,249,.18)" />
        <ellipse cx="200" cy="200" rx="154" ry="103" fill="none" stroke="rgba(103,232,249,.12)" />
        <ellipse cx="200" cy="200" rx="57" ry="154" fill="none" stroke="rgba(103,232,249,.18)" />
        <ellipse cx="200" cy="200" rx="104" ry="154" fill="none" stroke="rgba(103,232,249,.12)" />
        <path d="M57 235 C138 132 276 116 349 198" fill="none" stroke="url(#cc-gold-v1)" strokeWidth="1.8" strokeDasharray="5 8" />
        <path d="M81 123 C168 249 260 264 333 166" fill="none" stroke="rgba(34,211,238,.38)" strokeWidth="1.2" strokeDasharray="3 7" />
        <path d="M101 314 C188 212 280 190 341 91" fill="none" stroke="rgba(251,191,36,.23)" strokeWidth="1.1" strokeDasharray="2 8" />
        <g fill="rgba(103,232,249,.9)">
          <circle cx="85" cy="150" r="3" /><circle cx="316" cy="143" r="3" /><circle cx="111" cy="286" r="3" />
          <circle cx="286" cy="296" r="3" /><circle cx="200" cy="72" r="2.7" /><circle cx="200" cy="330" r="2.7" />
        </g>
      </svg>

      <div className="absolute inset-[20%] rounded-full border border-amber-300/24 motion-safe:animate-[spin_24s_linear_infinite] motion-reduce:animate-none" data-command-orbit="calm" aria-hidden="true">
        <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,.9)] motion-safe:animate-pulse motion-reduce:animate-none" />
        <span className="absolute bottom-[-3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)] motion-safe:animate-pulse motion-reduce:animate-none" />
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 flex h-[32%] w-[32%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-amber-300/25 bg-[#06111f]/95 shadow-[0_0_55px_rgba(245,158,11,.14),inset_0_0_30px_rgba(34,211,238,.10)] backdrop-blur">
        <img src="/brand/kriptoaman-mark-premium.webp" alt="" className="h-11 w-11 object-contain sm:h-14 sm:w-14" />
        <b className="mt-2 text-[9px] tracking-[0.15em] text-amber-200 sm:text-[11px]">KRIPTOAMAN</b>
        <span className="text-[7px] font-black uppercase tracking-[0.1em] text-cyan-300">NEXUS</span>
        <span className={'mt-1 text-[7px] font-black uppercase tracking-[0.08em] ' + (active ? 'text-emerald-300' : 'text-slate-300')}>
          ZVQ {networkState}
        </span>
        <span className="mt-1 text-[7px] text-slate-300">
          {Number.isSafeInteger(block) ? '#' + block.toLocaleString('en-US') : 'Block —'}
        </span>
      </div>

      {nodes.map((asset, index) => <AssetSignal key={asset.id || asset.sym} asset={asset} position={ORBIT_POSITIONS[index]} />)}

      <div className="absolute inset-x-[11%] bottom-[2%] z-20 flex items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-[#030812]/78 px-3 py-1.5 text-center text-[7px] font-black uppercase tracking-[0.12em] text-slate-300 backdrop-blur">
        <Globe2 className="h-3 w-3 text-cyan-300" aria-hidden="true" />
        Visual topology · verified core data only
      </div>
    </div>
  );
}

export default function CommandCenterHero({ market, zevaryq }) {
  const metrics = useMemo(() => {
    const assets = Array.isArray(market?.assets) ? market.assets : [];
    const cap = safeSum(assets, 'marketCap');
    const volume = safeSum(assets, 'volume');
    const positive = Number(market?.breadth?.positive || 0);
    const negative = Number(market?.breadth?.negative || 0);
    const breadthTotal = positive + negative;
    const breadth = breadthTotal > 0 ? (positive / breadthTotal) * 100 : null;
    return { cap, volume, breadth };
  }, [market]);

  const marketState = market?.state || DATA_STATE.UNAVAILABLE;
  const networkState = zevaryq?.networkState || DATA_STATE.CHECKING;
  const network = zevaryq?.network || null;
  const onChain = zevaryq?.onChain || null;
  const block = Number(zevaryq?.network?.blockNumber);
  const onChainHead = Number(onChain?.head?.number);

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border border-cyan-300/[0.13] bg-[radial-gradient(circle_at_53%_16%,rgba(14,165,233,.12),transparent_35%),radial-gradient(circle_at_91%_76%,rgba(245,158,11,.06),transparent_31%),linear-gradient(145deg,#06101d,#020711_64%)] p-4 shadow-[0_28px_100px_rgba(0,0,0,.38)] sm:p-5 lg:p-6"
      aria-label="KriptoAman Global Crypto Intelligence command center"
      data-phase16c-command-center="true"
      data-home-command-center="v1"
      data-market-state={marketState}
      data-network-state={networkState}
    >
      <span className="sr-only">Global Crypto Intelligence</span>
      <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />
        <div className="absolute left-[8%] top-[11%] h-24 w-24 rounded-full bg-cyan-400/[0.05] blur-3xl" />
        <div className="absolute bottom-[8%] right-[9%] h-28 w-28 rounded-full bg-amber-300/[0.04] blur-3xl" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">LIVE INTELLIGENCE COMMAND CENTER</span>
          <span className="hidden text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 sm:inline">REAL DATA · FIRST-PARTY EVIDENCE</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <StateBadge state={marketState} />
          <StateBadge state={zevaryq?.overallState || DATA_STATE.CHECKING} />
        </div>
      </div>

      <div className="relative mt-4 grid gap-5 sm:mt-3 sm:gap-4 xl:grid-cols-[.9fr_1.15fr_.82fr] xl:items-center">
        <div className="py-2 sm:py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.17em] text-cyan-300">KRIPTOAMAN · GLOBAL CRYPTO INTELLIGENCE</p>
          <h1 className="mt-3 max-w-xl text-3xl font-black leading-[1.01] tracking-[-0.055em] text-white sm:text-4xl lg:text-[46px]">
            Blockchain bergerak setiap detik.
            <span className="mt-1 block text-amber-200">Lihat. Pahami. Verifikasi.</span>
          </h1>
          <p className="mt-4 max-w-lg text-[13px] leading-5 text-slate-300 sm:text-sm sm:leading-6">
            Market intelligence real-time, bukti on-chain first-party, dan risk context dalam satu command surface yang dapat diverifikasi.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/IntelligenceHub" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300 px-4 text-[9px] font-black uppercase tracking-[0.1em] text-[#07101c] shadow-[0_0_28px_rgba(251,191,36,.13)] transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Jelajahi Intelligence <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link to="/ZEVARYQ" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.055] px-4 text-[9px] font-black uppercase tracking-[0.1em] text-cyan-200 transition hover:bg-cyan-300/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">
              Live Network <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-2.5">
              <span className="block text-[8px] font-black uppercase tracking-[0.08em] text-slate-300">Tracked Cap</span>
              <b className="mt-1 block truncate text-xs text-white">{metrics.cap > 0 ? formatCompactUsd(metrics.cap) : '—'}</b>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-2.5">
              <span className="block text-[8px] font-black uppercase tracking-[0.08em] text-slate-300">24H Volume</span>
              <b className="mt-1 block truncate text-xs text-white">{metrics.volume > 0 ? formatCompactUsd(metrics.volume) : '—'}</b>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-2.5">
              <span className="block text-[8px] font-black uppercase tracking-[0.08em] text-slate-300">Breadth</span>
              <b className="mt-1 block truncate text-xs text-white">{Number.isFinite(metrics.breadth) ? metrics.breadth.toFixed(1) + '%' : '—'}</b>
            </div>
          </div>
        </div>

        <NetworkGlobe assets={market?.assets || []} zevaryq={zevaryq} />

        <div className="rounded-[24px] border border-amber-300/[0.14] bg-[#06101d]/86 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.17em] text-amber-300">ZEVARYQ NETWORK · LIVE EVIDENCE</p>
              <p className="mt-1 text-lg font-black text-white">Real blockchain state</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.05]">
              <img src="/brand/zevaryq-mark.svg" alt="" className="h-6 w-6" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ['Chain ID', String(zevaryq?.contract?.chainId || 22028), networkState],
              ['Latest Block', Number.isSafeInteger(block) ? '#' + block.toLocaleString('en-US') : '—', networkState],
              ['Sync', zevaryq?.syncState || DATA_STATE.CHECKING, zevaryq?.syncState || DATA_STATE.CHECKING],
              ['Evidence Head', Number.isSafeInteger(onChainHead) ? '#' + onChainHead.toLocaleString('en-US') : '—', zevaryq?.onChainState || DATA_STATE.CHECKING],
              ['Contracts', onChain?.radar?.contractCreationsObserved ?? '—', zevaryq?.onChainState || DATA_STATE.CHECKING],
              ['Metadata', onChain?.radar?.tokenMetadataProven ?? '—', zevaryq?.onChainState || DATA_STATE.CHECKING],
            ].map(([label, value, state]) => (
              <div key={label} className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3">
                <p className="truncate text-sm font-black text-white">{value}</p>
                <p className="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-slate-300">{label}</p>
                <span className={'mt-2 inline-block text-[7px] font-black uppercase ' + (
                  [DATA_STATE.LIVE, DATA_STATE.SYNCED, DATA_STATE.VERIFIED].includes(state)
                    ? 'text-emerald-300'
                    : [DATA_STATE.DELAYED, DATA_STATE.CHECKING].includes(state)
                      ? 'text-amber-300'
                      : 'text-slate-300'
                )}>{state}</span>
              </div>
            ))}
          </div>

          <Link to="/ZEVARYQ" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.055] px-4 text-[9px] font-black uppercase tracking-[0.11em] text-cyan-200 transition hover:bg-cyan-300/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">
            Buka Network Intelligence <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="relative mt-4">
        <DataProvenanceBar
          state={networkState}
          source={network ? 'ZEVARYQ Network Status · rpc.kriptoaman.com' : 'ZEVARYQ network source unavailable'}
          timestamp={zevaryq?.networkObservedAt}
          ageMs={zevaryq?.networkAgeMs}
          label="NETWORK SOURCE"
        />
      </div>
    </section>
  );
}
