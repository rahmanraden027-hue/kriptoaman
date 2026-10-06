import React, { useMemo } from 'react';
import {
  Activity,
  Database,
  Globe2,
  Radio,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DATA_STATE } from '@/lib/dataState';
import DataProvenanceBar from './DataProvenanceBar';
import { formatChange, formatCompactUsd, formatPrice } from './format';

const ORBIT_POSITIONS = [
  'left-[7%] top-[17%]',
  'right-[6%] top-[20%]',
  'left-[1%] top-[52%]',
  'right-[1%] top-[55%]',
  'left-[13%] bottom-[12%]',
  'right-[12%] bottom-[10%]',
];

const stateTone = (state) => {
  if ([DATA_STATE.LIVE, DATA_STATE.SYNCED, DATA_STATE.VERIFIED].includes(state)) {
    return 'border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-200';
  }
  if (state === DATA_STATE.DELAYED || state === DATA_STATE.SNAPSHOT || state === DATA_STATE.CHECKING) {
    return 'border-amber-300/25 bg-amber-300/[0.07] text-amber-200';
  }
  if (state === DATA_STATE.CALCULATED) {
    return 'border-cyan-300/25 bg-cyan-300/[0.07] text-cyan-200';
  }
  return 'border-slate-300/15 bg-white/[0.035] text-slate-300';
};

const safeSum = (assets, key) => assets.reduce((sum, asset) => {
  const value = Number(asset?.[key]);
  return Number.isFinite(value) && value > 0 ? sum + value : sum;
}, 0);

function StateBadge({ state }) {
  return (
    <span className={'inline-flex min-h-7 items-center rounded-full border px-2 text-[8px] font-black uppercase tracking-[0.12em] ' + stateTone(state)}>
      ● {state}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, detail, state = DATA_STATE.CALCULATED, tone = 'text-white' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-cyan-300/[0.08] bg-[#06101d]/80 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" aria-hidden="true" />
      <div className="flex items-center justify-between gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.045] text-cyan-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <StateBadge state={state} />
      </div>
      <p className={'mt-4 truncate text-xl font-black tracking-[-0.035em] ' + tone}>{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
    </div>
  );
}

function AssetSignal({ asset, position }) {
  if (!asset) return null;
  const change = Number(asset.change24h);
  const positive = Number.isFinite(change) && change >= 0;

  return (
    <Link
      to={'/Market?search=' + encodeURIComponent(asset.sym)}
      className={'absolute z-20 flex min-h-10 max-w-[118px] items-center gap-2 rounded-xl border border-cyan-200/15 bg-[#06111f]/92 px-2.5 py-1.5 shadow-[0_0_24px_rgba(34,211,238,.08)] backdrop-blur-md transition hover:border-cyan-200/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ' + position}
      aria-label={'Open ' + asset.sym + ' market data'}
    >
      {asset.image ? (
        <img src={asset.image} alt="" width="20" height="20" className="h-5 w-5 rounded-full" loading="lazy" decoding="async" />
      ) : (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-300/10 text-[7px] font-black text-cyan-200">
          {String(asset.sym || '?').slice(0, 2)}
        </span>
      )}
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
  const active = networkState === DATA_STATE.LIVE || networkState === DATA_STATE.VERIFIED;
  const nodes = assets.slice(0, ORBIT_POSITIONS.length);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[510px]" data-visual-topology="market-assets-with-zevaryq-core">
      <div className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_43%_32%,rgba(56,189,248,.22),rgba(3,10,22,.68)_43%,rgba(1,6,14,.96)_70%)] shadow-[0_0_80px_rgba(14,165,233,.13),inset_0_0_55px_rgba(56,189,248,.09)]" />
      <div className="absolute inset-[9%] rounded-full border border-cyan-300/20 shadow-[inset_0_0_40px_rgba(34,211,238,.08)]" />

      <svg className="absolute inset-[9%] h-[82%] w-[82%] opacity-70" viewBox="0 0 400 400" role="img" aria-label="KriptoAman visual topology with verified ZEVARYQ core">
        <defs>
          <radialGradient id="cc-globe" cx="45%" cy="34%" r="68%">
            <stop offset="0%" stopColor="rgba(14,165,233,.22)" />
            <stop offset="62%" stopColor="rgba(8,47,73,.14)" />
            <stop offset="100%" stopColor="rgba(2,6,23,.1)" />
          </radialGradient>
          <linearGradient id="cc-gold" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(245,158,11,.05)" />
            <stop offset="50%" stopColor="rgba(251,191,36,.72)" />
            <stop offset="100%" stopColor="rgba(245,158,11,.05)" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="154" fill="url(#cc-globe)" stroke="rgba(103,232,249,.28)" strokeWidth="1.2" />
        <ellipse cx="200" cy="200" rx="154" ry="57" fill="none" stroke="rgba(103,232,249,.16)" />
        <ellipse cx="200" cy="200" rx="154" ry="103" fill="none" stroke="rgba(103,232,249,.11)" />
        <ellipse cx="200" cy="200" rx="57" ry="154" fill="none" stroke="rgba(103,232,249,.16)" />
        <ellipse cx="200" cy="200" rx="104" ry="154" fill="none" stroke="rgba(103,232,249,.11)" />
        <path d="M57 235 C138 132 276 116 349 198" fill="none" stroke="url(#cc-gold)" strokeWidth="1.5" strokeDasharray="5 8" />
        <path d="M81 123 C168 249 260 264 333 166" fill="none" stroke="rgba(34,211,238,.3)" strokeWidth="1.2" strokeDasharray="3 7" />
        <g fill="rgba(103,232,249,.8)">
          <circle cx="85" cy="150" r="3" /><circle cx="316" cy="143" r="3" /><circle cx="111" cy="286" r="3" />
          <circle cx="286" cy="296" r="3" /><circle cx="200" cy="72" r="2.7" /><circle cx="200" cy="330" r="2.7" />
        </g>
      </svg>

      <div className="absolute inset-[22%] rounded-full border border-amber-300/20 motion-safe:animate-[spin_24s_linear_infinite]" aria-hidden="true">
        <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,.9)]" />
        <span className="absolute bottom-[-3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]" />
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 flex h-[31%] w-[31%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-amber-300/25 bg-[#06111f]/94 shadow-[0_0_45px_rgba(245,158,11,.13),inset_0_0_28px_rgba(34,211,238,.08)] backdrop-blur">
        <img src="/brand/zevaryq-mark.svg" alt="" className="h-9 w-9 sm:h-12 sm:w-12" />
        <b className="mt-2 text-[10px] tracking-[0.16em] text-amber-200 sm:text-xs">ZEVARYQ</b>
        <span className={'mt-1 text-[7px] font-black uppercase tracking-[0.1em] ' + (active ? 'text-emerald-300' : 'text-slate-300')}>
          {networkState}
        </span>
        <span className="mt-1 text-[7px] text-slate-300">
          {Number.isSafeInteger(block) ? '#' + block.toLocaleString('en-US') : 'Block —'}
        </span>
      </div>

      {nodes.map((asset, index) => <AssetSignal key={asset.id || asset.sym} asset={asset} position={ORBIT_POSITIONS[index]} />)}

      <div className="absolute inset-x-[12%] bottom-[2%] z-20 flex items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-[#030812]/75 px-3 py-1.5 text-center text-[7px] font-black uppercase tracking-[0.12em] text-slate-300 backdrop-blur">
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

    return {
      cap,
      volume,
      breadth,
      top: market?.featured?.[0] || null,
    };
  }, [market]);

  const marketState = market?.state || DATA_STATE.UNAVAILABLE;
  const networkState = zevaryq?.networkState || DATA_STATE.CHECKING;
  const network = zevaryq?.network || null;
  const onChain = zevaryq?.onChain || null;
  const block = Number(network?.blockNumber);
  const onChainHead = Number(onChain?.head?.number);

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border border-cyan-300/[0.11] bg-[radial-gradient(circle_at_55%_16%,rgba(14,165,233,.09),transparent_36%),radial-gradient(circle_at_88%_78%,rgba(245,158,11,.055),transparent_32%),linear-gradient(145deg,#06101d,#020711_64%)] p-4 shadow-[0_24px_90px_rgba(0,0,0,.35)] sm:p-5 lg:p-6"
      aria-label="KriptoAman global crypto intelligence command center"
      data-phase16c-command-center="true"
      data-market-state={marketState}
      data-network-state={networkState}
    >
      <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="absolute left-[7%] top-[9%] h-20 w-20 rounded-full bg-cyan-400/[0.04] blur-2xl" />
        <div className="absolute bottom-[9%] right-[10%] h-24 w-24 rounded-full bg-amber-300/[0.035] blur-3xl" />
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.055] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">KRIPTOAMAN</span>
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">Global Crypto Intelligence</span>
          </div>
          <h1 className="mt-2 max-w-2xl text-2xl font-black tracking-[-0.045em] text-white sm:text-3xl lg:text-4xl">
            Live market intelligence with verifiable on-chain evidence.
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <StateBadge state={marketState} />
          <StateBadge state={zevaryq?.overallState || DATA_STATE.CHECKING} />
        </div>
      </div>

      <div className="relative mt-4 grid gap-4 xl:grid-cols-[.78fr_1.2fr_.78fr] xl:items-center">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          <MetricCard
            icon={Database}
            label="Tracked Market Cap"
            value={metrics.cap > 0 ? formatCompactUsd(metrics.cap) : '—'}
            detail="Sum of verified tracked assets"
            state={marketState === DATA_STATE.LIVE ? DATA_STATE.CALCULATED : marketState}
          />
          <MetricCard
            icon={Activity}
            label="24H Tracked Volume"
            value={metrics.volume > 0 ? formatCompactUsd(metrics.volume) : '—'}
            detail="Tracked asset volume"
            state={marketState === DATA_STATE.LIVE ? DATA_STATE.CALCULATED : marketState}
          />
          <MetricCard
            icon={TrendingUp}
            label="Market Breadth"
            value={Number.isFinite(metrics.breadth) ? metrics.breadth.toFixed(1) + '% ↑' : '—'}
            detail={market?.breadth ? market.breadth.positive + ' up · ' + market.breadth.negative + ' down' : 'Breadth unavailable'}
            state={marketState === DATA_STATE.LIVE ? DATA_STATE.CALCULATED : marketState}
            tone={Number.isFinite(metrics.breadth) && metrics.breadth >= 50 ? 'text-emerald-300' : 'text-amber-200'}
          />
          <MetricCard
            icon={Radio}
            label="Leading Signal"
            value={metrics.top?.sym || '—'}
            detail={metrics.top ? formatPrice(metrics.top.price) + ' · ' + formatChange(metrics.top.change24h) : 'Signal unavailable'}
            state={marketState}
            tone="text-cyan-200"
          />
        </div>

        <NetworkGlobe assets={market?.featured || []} zevaryq={zevaryq} />

        <div className="rounded-[24px] border border-amber-300/[0.13] bg-[#06101d]/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.17em] text-amber-300">ZEVARYQ NETWORK CORE</p>
              <p className="mt-1 text-lg font-black text-white">On-chain evidence</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.05]">
              <ShieldCheck className="h-5 w-5 text-amber-200" aria-hidden="true" />
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
                    : state === DATA_STATE.DELAYED || state === DATA_STATE.CHECKING
                      ? 'text-amber-300'
                      : 'text-slate-300'
                )}>{state}</span>
              </div>
            ))}
          </div>

          <Link
            to="/ZEVARYQ"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/[0.055] px-4 text-[9px] font-black uppercase tracking-[0.12em] text-amber-200 transition hover:bg-amber-300/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
          >
            Open Network Intelligence
          </Link>
        </div>
      </div>

      <div className="relative mt-4 grid gap-2 lg:grid-cols-2">
        <DataProvenanceBar
          state={market?.provenance?.state}
          source={market?.provenance?.sourceLabel || 'Source unavailable'}
          timestamp={market?.provenance?.capturedAt}
          ageMs={market?.provenance?.ageMs}
          label="MARKET SOURCE"
        />
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
