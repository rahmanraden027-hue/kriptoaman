import React from 'react';
import { ArrowRight, Globe2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DATA_STATE } from '@/lib/dataState';
import DataProvenanceBar from './DataProvenanceBar';
import { formatChange, formatPrice } from './format';

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
      className={'absolute z-20 flex min-h-10 max-w-[122px] items-center gap-2 rounded-xl border border-cyan-200/15 bg-[#06111f]/94 px-2.5 py-1.5 shadow-[0_0_24px_rgba(34,211,238,.08)] backdrop-blur-md transition hover:border-cyan-200/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ' + position}
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
  const active = [DATA_STATE.LIVE, DATA_STATE.VERIFIED].includes(networkState);
  const nodes = assets.slice(0, ORBIT_POSITIONS.length);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" data-visual-topology="kriptoaman-nexus-with-zevaryq-evidence">
      <div className="absolute inset-[5%] rounded-full bg-[radial-gradient(circle_at_43%_32%,rgba(56,189,248,.28),rgba(3,10,22,.70)_43%,rgba(1,6,14,.98)_72%)] shadow-[0_0_95px_rgba(14,165,233,.17),inset_0_0_60px_rgba(56,189,248,.10)]" />
      <div className="absolute inset-[8%] rounded-full border border-cyan-300/25 shadow-[inset_0_0_42px_rgba(34,211,238,.10)]" />

      <svg className="absolute inset-[8%] h-[84%] w-[84%] opacity-80" viewBox="0 0 400 400" role="img" aria-label="KriptoAman intelligence topology with ZEVARYQ verified network evidence">
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

      <div className="absolute inset-[20%] rounded-full border border-amber-300/24 motion-safe:animate-[spin_24s_linear_infinite]" aria-hidden="true">
        <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,.9)]" />
        <span className="absolute bottom-[-3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]" />
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
        Market · On-chain · ZEVARYQ evidence
      </div>
    </div>
  );
}

export default function CommandCenterHero({ market, zevaryq }) {
  const marketState = market?.state || DATA_STATE.UNAVAILABLE;
  const networkState = zevaryq?.networkState || DATA_STATE.CHECKING;
  const network = zevaryq?.network || null;
  const onChain = zevaryq?.onChain || null;
  const block = Number(network?.blockNumber);
  const onChainHead = Number(onChain?.head?.number);

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border border-cyan-300/[0.13] bg-[radial-gradient(circle_at_53%_16%,rgba(14,165,233,.12),transparent_35%),radial-gradient(circle_at_91%_76%,rgba(245,158,11,.06),transparent_31%),linear-gradient(145deg,#06101d,#020711_64%)] p-4 shadow-[0_28px_100px_rgba(0,0,0,.38)] sm:p-5 lg:p-6"
      aria-label="KriptoAman live intelligence command center"
      data-home-command-center="v1"
      data-market-state={marketState}
      data-network-state={networkState}
    >
      <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />
        <div className="absolute left-[8%] top-[11%] h-24 w-24 rounded-full bg-cyan-400/[0.05] blur-3xl" />
        <div className="absolute bottom-[8%] right-[9%] h-28 w-28 rounded-full bg-amber-300/[0.04] blur-3xl" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-300">LIVE INTELLIGENCE COMMAND CENTER</span>
          <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">REAL DATA · FIRST-PARTY EVIDENCE</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <StateBadge state={marketState} />
          <StateBadge state={zevaryq?.overallState || DATA_STATE.CHECKING} />
        </div>
      </div>

      <div className="relative mt-3 grid gap-4 xl:grid-cols-[.9fr_1.15fr_.82fr] xl:items-center">
        <div className="py-2 sm:py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.17em] text-cyan-300">KRIPTOAMAN · GLOBAL CRYPTO INTELLIGENCE</p>
          <h1 className="mt-3 max-w-xl text-3xl font-black leading-[1.01] tracking-[-0.055em] text-white sm:text-4xl lg:text-[46px]">
            Blockchain bergerak setiap detik.
            <span className="mt-1 block text-amber-200">Lihat. Pahami. Verifikasi.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
            Market intelligence real-time, bukti on-chain first-party, dan risk context dalam satu command surface yang dapat diverifikasi.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/IntelligenceHub"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300 px-4 text-[9px] font-black uppercase tracking-[0.1em] text-[#07101c] shadow-[0_0_28px_rgba(251,191,36,.13)] transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Jelajahi Intelligence <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              to="/ZEVARYQ"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.055] px-4 text-[9px] font-black uppercase tracking-[0.1em] text-cyan-200 transition hover:bg-cyan-300/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
            >
              Live Network <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-[8px] sm:grid-cols-4 xl:grid-cols-2">
            {[
              ['Market', marketState],
              ['Network', networkState],
              ['On-chain', zevaryq?.onChainState || DATA_STATE.CHECKING],
              ['Sync', zevaryq?.syncState || DATA_STATE.CHECKING],
            ].map(([label, state]) => (
              <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.025] px-2.5 py-2">
                <span className="block font-black uppercase tracking-[0.09em] text-slate-400">{label}</span>
                <b className={'mt-1 block uppercase ' + ([DATA_STATE.LIVE, DATA_STATE.SYNCED, DATA_STATE.VERIFIED].includes(state) ? 'text-emerald-300' : 'text-amber-300')}>● {state}</b>
              </div>
            ))}
          </div>
        </div>

        <NetworkGlobe assets={market?.featured || []} zevaryq={zevaryq} />

        <div className="rounded-[24px] border border-amber-300/[0.14] bg-[#06101d]/86 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.17em] text-amber-300">ZEVARYQ NETWORK · LIVE EVIDENCE</p>
              <p className="mt-1 text-lg font-black text-white">Real blockchain state</p>
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
              ['RPC Probe', Number.isFinite(Number(network?.probeDurationMs)) ? Math.round(Number(network.probeDurationMs)) + ' ms' : '—', networkState],
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

          <a
            href="https://explorer.kriptoaman.com"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.055] px-4 text-[9px] font-black uppercase tracking-[0.11em] text-cyan-200 transition hover:bg-cyan-300/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
          >
            Buka ZEVARYQ Explorer <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
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
