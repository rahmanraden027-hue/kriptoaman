import React from 'react';
import { formatMagnitude, formatPrice } from './format';

const tickerAssets = (assets) => {
  const top = [...assets]
    .filter(asset => Number.isFinite(Number(asset?.rank)))
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .slice(0, 12);
  return top.length ? top : assets.slice(0, 12);
};

function TickerItems({ items, duplicate = false }) {
  return (
    <div className="flex shrink-0 items-center gap-5 pr-5" aria-hidden={duplicate ? 'true' : undefined}>
      {items.map(asset => {
        const change = Number(asset.change24h);
        return (
          <div key={(duplicate ? 'copy-' : '') + asset.id} className="flex shrink-0 items-center gap-2 text-[11px]">
            {asset.image && <img src={asset.image} alt="" className="h-4 w-4 rounded-full" loading="lazy" />}
            <b className="text-white">{asset.sym}</b>
            <span className="text-slate-300">{formatPrice(asset.price)}</span>
            <span className={change >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {change >= 0 ? '▲ ' : '▼ '}{formatMagnitude(change)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function LiveMarketTicker({ assets = [], state = 'UNAVAILABLE' }) {
  const items = tickerAssets(assets);

  return (
    <section className="overflow-hidden border-y border-white/[0.06] bg-[#030812]/92" aria-label="Live market ticker">
      <style>{`
        @keyframes ka-v10-market-ticker {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(-50%,0,0); }
        }
        .ka-v10-ticker-track { animation: ka-v10-market-ticker 42s linear infinite; }
        .ka-v10-ticker-window:hover .ka-v10-ticker-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .ka-v10-ticker-window { overflow-x: auto !important; }
          .ka-v10-ticker-track { animation: none !important; }
          .ka-v10-ticker-copy { display: none !important; }
        }
      `}</style>
      <div className="flex min-h-10 items-center gap-3 px-4">
        <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">● {state}</span>
        <div className="ka-v10-ticker-window min-w-0 flex-1 overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.length ? (
            <div className="ka-v10-ticker-track flex w-max items-center py-2 will-change-transform">
              <TickerItems items={items} />
              <div className="ka-v10-ticker-copy"><TickerItems items={items} duplicate /></div>
            </div>
          ) : (
            <span className="block py-2 text-[10px] text-slate-400">Market data unavailable</span>
          )}
        </div>
      </div>
    </section>
  );
}
