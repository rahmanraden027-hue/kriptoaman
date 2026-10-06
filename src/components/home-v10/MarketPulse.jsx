import React from 'react';
import { formatChange, formatCompactUsd } from './format';

function PulseCell({ label, value, detail, tone = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-2 truncate text-lg font-black ${tone}`}>{value}</p>
      {detail && <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>}
    </div>
  );
}

export default function MarketPulse({ gainers = [], active = [], direction = 'UNAVAILABLE', assetCount = 0 }) {
  const top = gainers[0];
  const mostActive = active[0];
  const directionTone = direction === 'POSITIVE'
    ? 'text-emerald-300'
    : direction === 'WEAK'
      ? 'text-rose-300'
      : 'text-amber-300';

  return (
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Market pulse" data-assets-tracked={assetCount || undefined}>
      <PulseCell
        label="Top Gainer"
        value={top ? top.sym : '—'}
        detail={top ? formatChange(top.change24h) : 'Unavailable'}
        tone="text-emerald-300"
      />
      <PulseCell
        label="Most Active"
        value={mostActive ? mostActive.sym : '—'}
        detail={mostActive ? formatCompactUsd(mostActive.volume) : 'Unavailable'}
        tone="text-cyan-200"
      />
      <PulseCell label="Market Direction" value={direction} detail="Verified market breadth" tone={directionTone} />
      <PulseCell label="Assets Tracked" value={assetCount ? assetCount.toLocaleString('en-US') : '—'} detail="KriptoAman market database" />
    </section>
  );
}
