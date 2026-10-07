import React from 'react';
import AssetLogo from '@/components/market/AssetLogo';
import { formatMagnitude, formatPrice } from './format';

const tickerAssets = (assets) => {
  const top = [...assets]
    .filter(asset => Number.isFinite(Number(asset?.rank)))
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .slice(0, 12);
  return top.length ? top : assets.slice(0, 12);
};

export default function LiveMarketTicker({ assets = [], state = 'UNAVAILABLE' }) {
  const items = tickerAssets(assets);

  return (
    <section className="overflow-hidden border-y border-white/[0.06] bg-[#030812]/92" aria-label="Live market ticker">
      <div className="flex min-h-10 items-center gap-3 px-4">
        <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">● {state}</span>
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-5 py-2 pr-5">
            {items.length ? items.map(asset => {
              const change = Number(asset.change24h);
              return (
                <div key={asset.id} className="flex shrink-0 items-center gap-2 text-[11px]">
                  <AssetLogo asset={asset} size={16} />
                  <b className="text-white">{asset.sym}</b>
                  <span className="text-slate-300">{formatPrice(asset.price)}</span>
                  <span className={change >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    {change >= 0 ? '▲ ' : '▼ '}{formatMagnitude(change)}
                  </span>
                </div>
              );
            }) : <span className="text-[10px] text-slate-400">Market data unavailable</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
