import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DATA_STATE } from '@/lib/dataState';
import { formatChange, formatCompactUsd, formatPrice, sparklinePoints } from './format';

const heatTone = (change) => {
  const value = Number(change);
  if (!Number.isFinite(value)) return 'border-slate-300/10 bg-white/[0.025]';
  if (value >= 3) return 'border-emerald-300/20 bg-emerald-400/[0.18]';
  if (value >= 0) return 'border-emerald-300/15 bg-emerald-400/[0.10]';
  if (value <= -3) return 'border-rose-300/20 bg-rose-400/[0.18]';
  return 'border-rose-300/15 bg-rose-400/[0.10]';
};

const sortedByRank = (assets) => [...(Array.isArray(assets) ? assets : [])]
  .sort((a, b) => Number(a?.rank || 999999) - Number(b?.rank || 999999));

function Panel({ title, kicker, children, className = '' }) {
  return (
    <section className={'relative overflow-hidden rounded-[24px] border border-cyan-300/[0.09] bg-[#050c16] p-4 ' + className}>
      <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" aria-hidden="true" />
      <div className="flex items-center justify-between gap-2">
        <div>
          {kicker && <p className="text-[8px] font-black uppercase tracking-[0.14em] text-cyan-300">{kicker}</p>}
          <h2 className="mt-0.5 text-sm font-black text-white sm:text-base">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function MarketCommandGrid({ market, zevaryq }) {
  const rows = useMemo(() => sortedByRank(market?.assets).slice(0, 7), [market?.assets]);
  const heat = useMemo(() => sortedByRank(market?.assets).slice(0, 12), [market?.assets]);
  const featured = market?.featured?.[0] || rows[0] || null;
  const points = sparklinePoints(featured?.sparkline, 500, 150);
  const featuredChange = Number(featured?.change24h);
  const onChain = zevaryq?.onChain || null;
  const onChainState = zevaryq?.onChainState || DATA_STATE.CHECKING;

  const evidence = [
    ['Evidence head', Number.isSafeInteger(Number(onChain?.head?.number)) ? '#' + Number(onChain.head.number).toLocaleString('en-US') : '—'],
    ['Scanned blocks', onChain?.radar?.scannedBlocks ?? '—'],
    ['Contract creation', onChain?.radar?.contractCreationsObserved ?? '—'],
    ['Metadata proven', onChain?.radar?.tokenMetadataProven ?? '—'],
    ['Confirmation depth', onChain?.radar?.confirmationDepth ?? '—'],
    ['RPC latency', Number.isFinite(Number(onChain?.latencyMs)) ? Math.round(Number(onChain.latencyMs)) + ' ms' : '—'],
  ];

  return (
    <section aria-label="KriptoAman live intelligence command grid" className="grid gap-3 xl:grid-cols-12">
      <Panel title="Market Overview" kicker="REAL MARKET DATA" className="xl:col-span-3">
        <div className="mt-3 space-y-1">
          {rows.length ? rows.map((asset, index) => {
            const change = Number(asset.change24h);
            const spark = sparklinePoints(asset.sparkline, 78, 24);
            return (
              <Link
                key={asset.id}
                to={'/Market?search=' + encodeURIComponent(asset.sym)}
                className="grid min-h-11 grid-cols-[24px_1fr_auto] items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
              >
                <span className="text-[8px] font-black text-slate-500">{index + 1}</span>
                <span className="flex min-w-0 items-center gap-2">
                  {asset.image ? <img src={asset.image} alt="" width="22" height="22" className="h-[22px] w-[22px] rounded-full" loading="lazy" decoding="async" /> : null}
                  <span className="min-w-0">
                    <b className="block truncate text-[10px] text-white">{asset.sym}</b>
                    <span className="block truncate text-[8px] text-slate-400">{formatPrice(asset.price)}</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 78 24" className="hidden h-6 w-[78px] sm:block" aria-hidden="true">
                    {spark && <polyline points={spark} fill="none" stroke={change >= 0 ? 'rgb(110 231 183)' : 'rgb(253 164 175)'} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                  </svg>
                  <b className={'text-[9px] ' + (change >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{formatChange(change)}</b>
                </span>
              </Link>
            );
          }) : <p className="py-10 text-center text-[10px] text-slate-400">Verified market data unavailable.</p>}
        </div>
      </Panel>

      <Panel title={featured ? featured.sym + ' Intelligence' : 'Featured Market Intelligence'} kicker="VERIFIED PRICE SERIES" className="xl:col-span-4">
        {featured ? (
          <>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-black tracking-[-0.04em] text-white">{formatPrice(featured.price)}</p>
                <p className={'mt-1 text-[10px] font-black ' + (featuredChange >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{formatChange(featuredChange)} · 24H</p>
              </div>
              <div className="text-right text-[8px] text-slate-400">
                <p>Volume {formatCompactUsd(featured.volume)}</p>
                <p>Market Cap {formatCompactUsd(featured.marketCap)}</p>
              </div>
            </div>
            <div className="mt-4 h-40 rounded-2xl border border-white/[0.055] bg-[linear-gradient(180deg,rgba(14,165,233,.055),transparent)] p-3">
              <svg viewBox="0 0 500 150" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={featured.sym + ' verified seven day price path'}>
                <defs>
                  <linearGradient id="market-line" x1="0" x2="1">
                    <stop offset="0%" stopColor="rgb(34 211 238)" />
                    <stop offset="100%" stopColor="rgb(251 191 36)" />
                  </linearGradient>
                </defs>
                <path d="M0 30 H500 M0 75 H500 M0 120 H500" stroke="rgba(148,163,184,.08)" strokeWidth="1" />
                {points ? <polyline points={points} fill="none" stroke="url(#market-line)" strokeWidth="3" vectorEffect="non-scaling-stroke" /> : null}
              </svg>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] sm:grid-cols-4">
              <div className="rounded-xl bg-white/[0.025] p-2"><span className="text-slate-400">High 24H</span><b className="mt-1 block text-white">{formatPrice(featured.high24h)}</b></div>
              <div className="rounded-xl bg-white/[0.025] p-2"><span className="text-slate-400">Low 24H</span><b className="mt-1 block text-white">{formatPrice(featured.low24h)}</b></div>
              <div className="rounded-xl bg-white/[0.025] p-2"><span className="text-slate-400">Rank</span><b className="mt-1 block text-white">{Number.isFinite(Number(featured.rank)) ? '#' + featured.rank : '—'}</b></div>
              <div className="rounded-xl bg-white/[0.025] p-2"><span className="text-slate-400">State</span><b className="mt-1 block text-cyan-200">{market?.state || DATA_STATE.UNAVAILABLE}</b></div>
            </div>
          </>
        ) : <p className="py-16 text-center text-[10px] text-slate-400">Verified price series unavailable.</p>}
      </Panel>

      <Panel title="On-Chain Evidence" kicker="ZEVARYQ FIRST-PARTY" className="xl:col-span-2">
        <div className="mt-3 grid grid-cols-2 gap-2">
          {evidence.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-2.5">
              <b className="block truncate text-[11px] text-white">{value}</b>
              <span className="mt-1 block text-[7px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] p-2.5 text-[8px] leading-4 text-slate-300">
          <b className={onChainState === DATA_STATE.LIVE ? 'text-emerald-300' : 'text-amber-300'}>● {onChainState}</b>
          <span className="ml-2">Tidak ada whale/DEX event sintetis. Event hanya ditampilkan bila sumber first-party membuktikannya.</span>
        </div>
      </Panel>

      <Panel title="Market Heatmap" kicker="24H CHANGE" className="xl:col-span-3">
        <div className="mt-3 grid grid-cols-3 gap-2">
          {heat.length ? heat.map((asset, index) => (
            <Link
              key={asset.id}
              to={'/Market?search=' + encodeURIComponent(asset.sym)}
              className={'min-h-[72px] rounded-2xl border p-2.5 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ' + heatTone(asset.change24h) + (index < 3 ? ' col-span-1' : '')}
            >
              <b className="block text-sm text-white">{asset.sym}</b>
              <span className={'mt-1 block text-[10px] font-black ' + (Number(asset.change24h) >= 0 ? 'text-emerald-200' : 'text-rose-200')}>{formatChange(asset.change24h)}</span>
              <span className="mt-2 block truncate text-[8px] text-slate-300">{formatPrice(asset.price)}</span>
            </Link>
          )) : <p className="col-span-3 py-10 text-center text-[10px] text-slate-400">Heatmap unavailable.</p>}
        </div>
      </Panel>
    </section>
  );
}
