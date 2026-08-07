import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { COIN_META, LIVE_COINS } from './coinMeta';
import InteractiveSparkline from './InteractiveSparkline';
import { Wifi, WifiOff, ChevronRight } from 'lucide-react';

export default function HomeLiveMarket({ prices, markets, idrRate, connected }) {
  const fmtIDR = (usd) => {
    if (usd == null) return '—';
    const v = usd * (idrRate || 0);
    if (!v) return '—';
    if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2)}M`;
    if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(2)} Jt`;
    return `Rp ${v.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '120ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">Live Market</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${connected ? 'bg-ka-emerald/10 border-ka-emerald/25 text-ka-emerald' : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live' : 'Reconnect'}
          </span>
          <Link to={createPageUrl('Market')} className="ka-muted hover:text-ka-emerald transition tap-reset"><ChevronRight className="w-4 h-4" /></Link>
        </div>
      </div>

      <div className="space-y-1">
        {LIVE_COINS.map(sym => {
          const meta = COIN_META[sym] || {};
          const market = markets[sym];
          const live = prices[sym];
          const price = live?.price ?? market?.price;
          const chg = live?.change24h ?? market?.change24h;
          const up = (chg ?? 0) >= 0;
          const tick = live?.tick;
          return (
            <Link key={sym} to={createPageUrl('Market')}
              className="flex items-center justify-between gap-2 py-2.5 px-2 -mx-2 rounded-xl ka-surface-hover">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={meta.logo} alt={sym} className="w-8 h-8 rounded-full shrink-0" loading="lazy" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold">{sym}</p>
                  <p className="ka-muted text-[10px] truncate">{meta.name}</p>
                </div>
              </div>
              <InteractiveSparkline data={market?.sparkline} up={up} height={28} width={72} />
              <div className="text-right shrink-0 min-w-[78px]">
                <p className={`text-sm font-bold ka-num transition-colors ${tick === 'up' ? 'text-ka-emerald' : tick === 'down' ? 'text-[#e74c3c]' : 'text-white'}`}>
                  {fmtIDR(price)}
                </p>
                <p className={`text-[11px] font-semibold ka-num ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
                  {chg != null ? `${up ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}