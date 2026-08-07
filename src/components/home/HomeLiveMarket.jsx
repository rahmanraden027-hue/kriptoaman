import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { COIN_META, LIVE_COINS } from './coinMeta';
import { Wifi, WifiOff, ChevronRight } from 'lucide-react';

function Sparkline({ data, up }) {
  if (!data || data.length < 2) return <svg width="56" height="22" className="shrink-0" />;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 56},${21 - ((v - min) / range) * 19}`).join(' ');
  return (
    <svg width="56" height="22" className="shrink-0">
      <polyline points={pts} fill="none" stroke={up ? '#2ecc71' : '#e74c3c'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomeLiveMarket({ prices, idrRate, connected }) {
  const hist = useRef({});

  useEffect(() => {
    LIVE_COINS.forEach(sym => {
      const p = prices[sym]?.price;
      if (!p) return;
      const arr = hist.current[sym] || [];
      if (arr[arr.length - 1] !== p) { arr.push(p); if (arr.length > 24) arr.shift(); hist.current[sym] = arr; }
    });
  }, [prices]);

  const fmtIDR = (usd) => {
    if (!usd) return '—';
    const v = usd * (idrRate || 0);
    if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2)}M`;
    if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(2)} Jt`;
    return `Rp ${v.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="ka-surface p-4 ka-fade-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">Live Market</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${connected ? 'bg-ka-emerald/10 border-ka-emerald/25 text-ka-emerald' : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live' : 'Reconnect'}
          </span>
          <Link to={createPageUrl('Market')} className="text-ka-muted hover:text-ka-emerald transition tap-reset"><ChevronRight className="w-4 h-4" /></Link>
        </div>
      </div>

      <div className="space-y-1">
        {LIVE_COINS.map(sym => {
          const meta = COIN_META[sym] || {};
          const d = prices[sym];
          const chg = d?.change24h;
          const up = (chg || 0) >= 0;
          const tick = d?.tick;
          return (
            <Link key={sym} to={createPageUrl('Market')}
              className="flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-xl ka-surface-hover">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={meta.logo} alt={sym} className="w-8 h-8 rounded-full shrink-0" loading="lazy" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold">{sym}</p>
                  <p className="ka-muted text-[10px] truncate">{meta.name}</p>
                </div>
              </div>
              <Sparkline data={hist.current[sym]} up={up} />
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ka-num transition-colors ${tick === 'up' ? 'text-ka-emerald' : tick === 'down' ? 'text-[#e74c3c]' : 'text-white'}`}>
                  {fmtIDR(d?.price)}
                </p>
                <p className={`text-[11px] font-semibold ka-num ${up ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
                  {chg !== undefined ? `${up ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}