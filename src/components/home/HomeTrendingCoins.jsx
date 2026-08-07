import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { COIN_META, TREND_POOL } from './coinMeta';
import { Flame, ChevronRight } from 'lucide-react';

export default function HomeTrendingCoins({ prices }) {
  const gainers = TREND_POOL
    .map(sym => ({ sym, meta: COIN_META[sym] || {}, chg: prices[sym]?.change24h ?? null, price: prices[sym]?.price }))
    .filter(c => c.chg !== null)
    .sort((a, b) => (b.chg || 0) - (a.chg || 0))
    .slice(0, 5);

  return (
    <div className="ka-surface p-4 ka-fade-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-ka-emerald" /> Trending
        </h3>
        <Link to={createPageUrl('Market')} className="text-ka-muted hover:text-ka-emerald transition tap-reset"><ChevronRight className="w-4 h-4" /></Link>
      </div>

      {gainers.length === 0 ? (
        <div className="space-y-2">
          {[0,1,2,3].map(i => <div key={i} className="h-10 ka-shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-1">
          {gainers.map((c, i) => {
            const up = (c.chg || 0) >= 0;
            return (
              <Link key={c.sym} to={createPageUrl('Market')}
                className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl ka-surface-hover">
                <span className="w-5 text-center text-[11px] font-bold ka-muted ka-num">{i + 1}</span>
                <img src={c.meta.logo} alt={c.sym} className="w-7 h-7 rounded-full" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold">{c.sym}</p>
                  <p className="ka-muted text-[10px] truncate">{c.meta.name}</p>
                </div>
                <span className={`text-xs font-bold ka-num ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
                  {up ? '+' : ''}{(c.chg || 0).toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}