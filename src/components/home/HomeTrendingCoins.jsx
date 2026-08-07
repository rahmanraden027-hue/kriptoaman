import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import InteractiveSparkline from './InteractiveSparkline';
import { Flame, ChevronRight } from 'lucide-react';

export default function HomeTrendingCoins({ markets }) {
  const pool = Object.keys(markets);
  const gainers = pool
    .map(sym => ({ sym, m: markets[sym] }))
    .filter(c => c.m && c.m.change24h != null)
    .sort((a, b) => b.m.change24h - a.m.change24h)
    .slice(0, 5);

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '180ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-ka-emerald" /> Trending
        </h3>
        <Link to={createPageUrl('Market')} className="ka-muted hover:text-ka-emerald transition tap-reset"><ChevronRight className="w-4 h-4" /></Link>
      </div>

      {gainers.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-12 ka-shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-1">
          {gainers.map((c, i) => {
            const up = (c.m.change24h || 0) >= 0;
            return (
              <Link key={c.sym} to={createPageUrl('Market')}
                className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl ka-surface-hover">
                <span className="w-4 text-center text-[11px] font-bold ka-muted ka-num">{i + 1}</span>
                <img src={c.m.image} alt={c.sym} className="w-7 h-7 rounded-full shrink-0" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold">{c.sym}</p>
                  <p className="ka-muted text-[10px] truncate">{c.m.name}</p>
                </div>
                <InteractiveSparkline data={c.m.sparkline} up={up} height={26} width={60} />
                <span className={`text-xs font-bold ka-num shrink-0 ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
                  {up ? '+' : ''}{(c.m.change24h || 0).toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}