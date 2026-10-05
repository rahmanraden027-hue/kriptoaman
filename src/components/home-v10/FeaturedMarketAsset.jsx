import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCompactUsd, formatMagnitude, formatPrice, sparklinePoints } from './format';

const ROTATION_MS = 10000;

export default function FeaturedMarketAsset({ assets = [], state = 'UNAVAILABLE' }) {
  const candidates = useMemo(() => assets.slice(0, 8), [assets]);
  const [index, setIndex] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);

  useEffect(() => {
    if (candidates.length < 2) return undefined;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil || document.visibilityState !== 'visible') return;
      setIndex(current => (current + 1) % candidates.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [candidates.length, pausedUntil]);

  useEffect(() => {
    if (index >= candidates.length) setIndex(0);
  }, [candidates.length, index]);

  const asset = candidates[index];
  const change = Number(asset?.change24h);
  const positive = change >= 0;
  const points = sparklinePoints(asset?.sparkline, 520, 180);
  const hasTrace = Boolean(points);

  if (!asset) {
    return (
      <section className="grid min-h-[360px] place-items-center rounded-[30px] border border-white/[0.07] bg-[#050c16] p-6 text-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{state}</p>
          <p className="mt-3 text-sm text-slate-400">No verified featured asset available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-cyan-400/15 bg-[radial-gradient(circle_at_70%_15%,rgba(34,211,238,.09),transparent_32%),linear-gradient(145deg,#061120,#030812_70%)] p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            {asset.image && <img src={asset.image} alt="" className="h-14 w-14 rounded-full shadow-[0_0_30px_rgba(34,211,238,.16)]" />}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">MOVING NOW · {state}</p>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">{asset.sym}</h1>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">{formatPrice(asset.price)}</div>
            <div className={`mt-2 text-lg font-black ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
              {positive ? '▲ ' : '▼ '}{formatMagnitude(change)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              ['Market Cap', formatCompactUsd(asset.marketCap)],
              ['Volume', formatCompactUsd(asset.volume)],
              ['24H High', formatPrice(asset.high24h)],
              ['24H Low', formatPrice(asset.low24h)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/[0.05] bg-white/[0.025] px-3 py-3">
                <p className="text-sm font-black text-white">{value}</p>
                <p className="mt-1 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          <Link to={`/Market?search=${encodeURIComponent(asset.sym)}`} className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
            Open asset <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative min-h-[180px] rounded-[24px] border border-white/[0.05] bg-black/10 p-3 sm:min-h-[220px]">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
              {hasTrace ? '7D PRICE TRACE' : 'MARKET SNAPSHOT'}
            </span>
            <span className="text-[9px] font-black text-slate-400">#{asset.rank || '—'}</span>
          </div>

          {hasTrace ? (
            <svg viewBox="0 0 520 180" className="absolute inset-x-3 bottom-3 h-[calc(100%-46px)] w-[calc(100%-24px)]" role="img" aria-label={`${asset.sym} price trace`}>
              <line x1="0" y1="90" x2="520" y2="90" stroke="rgba(148,163,184,.12)" strokeWidth="1" />
              <polyline
                points={points}
                fill="none"
                stroke={positive ? 'rgb(110 231 183)' : 'rgb(253 164 175)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : (
            <div className="mt-5">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">7D trace not provided in this snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['Price', formatPrice(asset.price)],
                  ['24H Move', `${positive ? '▲ ' : '▼ '}${formatMagnitude(change)}`],
                  ['Market Cap', formatCompactUsd(asset.marketCap)],
                  ['24H Volume', formatCompactUsd(asset.volume)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <p className={`truncate text-sm font-black ${label === '24H Move' ? (positive ? 'text-emerald-300' : 'text-rose-300') : 'text-white'}`}>{value}</p>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {candidates.length > 1 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {candidates.map((candidate, candidateIndex) => (
            <button
              type="button"
              key={candidate.id}
              onClick={() => {
                setIndex(candidateIndex);
                setPausedUntil(Date.now() + 30000);
              }}
              className={`flex min-h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-[10px] font-black ${candidateIndex === index ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : 'border-white/[0.06] bg-white/[0.02] text-slate-400'}`}
            >
              {candidate.image && <img src={candidate.image} alt="" className="h-4 w-4 rounded-full" />}
              {candidate.sym}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
