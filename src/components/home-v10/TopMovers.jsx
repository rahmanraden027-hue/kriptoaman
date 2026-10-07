import React, { useMemo, useState } from 'react';
import AssetLogo from '@/components/market/AssetLogo';
import { formatMagnitude, formatPrice, sparklinePoints } from './format';

const TABS = [
  ['gainers', 'Gainers'],
  ['losers', 'Losers'],
  ['active', 'Active'],
  ['newAssets', 'New'],
];

export default function TopMovers({ gainers = [], losers = [], active = [], newAssets = [] }) {
  const [tab, setTab] = useState('gainers');
  const groups = useMemo(() => ({ gainers, losers, active, newAssets }), [active, gainers, losers, newAssets]);
  const rows = (groups[tab] || []).slice(0, 6);

  return (
    <section className="rounded-[26px] border border-white/[0.07] bg-[#050c16] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white">Top Movers</h2>
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={value === 'newAssets' && newAssets.length === 0}
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={`min-h-11 shrink-0 rounded-lg px-2.5 text-[9px] font-black uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ${tab === value ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-400'} disabled:opacity-35`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 divide-y divide-white/[0.05]">
        {rows.length ? rows.map(asset => {
          const change = Number(asset.change24h);
          const points = sparklinePoints(asset.sparkline, 90, 28);
          return (
            <a key={asset.id} href={`/Market?search=${encodeURIComponent(asset.sym)}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 sm:grid-cols-[1fr_auto_auto_100px]">
              <div className="flex min-w-0 items-center gap-2.5">
                <AssetLogo asset={asset} size={28} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{asset.sym}</p>
                  <p className="truncate text-[9px] text-slate-400">{asset.name}</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-200">{formatPrice(asset.price)}</span>
              <span className={`text-xs font-black ${change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {change >= 0 ? '▲ ' : '▼ '}{formatMagnitude(change)}
              </span>
              <svg viewBox="0 0 90 28" className="hidden h-7 w-[90px] sm:block" aria-hidden="true">
                {points && <polyline points={points} fill="none" stroke={change >= 0 ? 'rgb(110 231 183)' : 'rgb(253 164 175)'} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
              </svg>
            </a>
          );
        }) : (
          <div className="py-8 text-center text-[10px] text-slate-400">Verified data unavailable for this view.</div>
        )}
      </div>
    </section>
  );
}
