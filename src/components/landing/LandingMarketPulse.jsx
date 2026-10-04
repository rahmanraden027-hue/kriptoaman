import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Clock3, Database, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COIN_META } from '@/components/home/coinMeta';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
const POLL_MS = 15_000;

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return '—';
  if (price >= 10000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 100) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function formatCapturedAt(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ms));
}

export default function LandingMarketPulse() {
  const [state, setState] = useState({
    loading: true,
    available: false,
    healthy: false,
    freshness: 'unavailable',
    source: null,
    capturedAt: null,
    assets: [],
  });

  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      try {
        const response = await fetch('/api/market-hot', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json().catch(() => null);
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const assets = rows
          .filter((item) => SYMBOLS.includes(String(item?.symbol || '').toUpperCase()))
          .map((item) => ({
            symbol: String(item.symbol).toUpperCase(),
            price: Number(item.price),
            change24h: Number(item.change24h),
          }))
          .filter((item) => Number.isFinite(item.price))
          .sort((a, b) => SYMBOLS.indexOf(a.symbol) - SYMBOLS.indexOf(b.symbol));

        if (!active) return;
        setState({
          loading: false,
          available: response.ok && payload?.available === true && assets.length >= 2,
          healthy: payload?.healthy === true,
          freshness: payload?.freshness || 'unavailable',
          source: payload?.source || null,
          capturedAt: payload?.capturedAt || null,
          assets,
        });
      } catch {
        if (!active) return;
        setState((current) => ({ ...current, loading: false, available: false, healthy: false, freshness: 'unavailable' }));
      } finally {
        if (active) timer = window.setTimeout(load, POLL_MS);
      }
    };

    load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const items = useMemo(() => SYMBOLS.map((symbol) => {
    const data = state.assets.find((item) => item.symbol === symbol);
    return { symbol, data, meta: COIN_META[symbol] || null };
  }), [state.assets]);

  const capturedAt = formatCapturedAt(state.capturedAt);
  const statusLabel = state.loading
    ? 'VERIFYING'
    : state.available
      ? state.healthy && state.freshness === 'live' ? 'LIVE VERIFIED' : String(state.freshness || 'AVAILABLE').toUpperCase()
      : 'UNAVAILABLE';

  return (
    <section className="ka-market-pulse-shell px-4 sm:px-6" aria-label="KriptoAman verified market pulse">
      <div className="ka-market-pulse max-w-[1440px] mx-auto">
        <div className="ka-market-pulse-head">
          <div className="min-w-0">
            <p className="ka-market-pulse-kicker"><Activity className="h-3.5 w-3.5" /> VERIFIED MARKET PULSE</p>
            <p className="ka-market-pulse-sub">Major assets from the KriptoAman-owned read path. Missing values stay unavailable.</p>
          </div>
          <div className="ka-market-pulse-status">
            <span className={state.available ? 'is-live' : 'is-idle'}><i />{statusLabel}</span>
            {capturedAt ? <small><Clock3 />{capturedAt}</small> : null}
          </div>
        </div>

        <div className="ka-market-pulse-grid">
          {items.map(({ symbol, data, meta }) => {
            const change = Number(data?.change24h);
            const hasChange = Number.isFinite(change);
            return (
              <article key={symbol} className="ka-market-asset">
                <div className="ka-market-asset-logo">
                  {meta?.logo ? <img src={meta.logo} alt={`${meta.name || symbol} logo`} loading="lazy" /> : <b>{symbol.slice(0, 1)}</b>}
                </div>
                <div className="min-w-0">
                  <div className="ka-market-asset-id"><b>{symbol}</b><span>{meta?.name || symbol}</span></div>
                  <div className="ka-market-asset-price">
                    <strong>{data ? formatPrice(data.price) : '—'}</strong>
                    <small className={hasChange ? (change >= 0 ? 'up' : 'down') : ''}>{hasChange ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'UNAVAILABLE'}</small>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="ka-market-pulse-foot">
          <div><ShieldCheck /><span>Truth policy</span><b>{state.available ? 'SOURCE-BOUND' : 'NO SYNTHETIC FALLBACK'}</b></div>
          <div><Database /><span>Source</span><b>{state.source || 'UNAVAILABLE'}</b></div>
          <Link to="/Market">Open Market Intelligence <ArrowRight /></Link>
        </div>
      </div>
      <style>{`
        .ka-market-pulse-shell{position:relative;z-index:6;margin-top:-10px;padding-bottom:16px}
        .ka-market-pulse{overflow:hidden;border:1px solid color-mix(in srgb,var(--ka-blue) 27%,var(--ka-border));border-radius:22px;background:linear-gradient(145deg,rgba(5,18,34,.96),rgba(2,8,17,.98));box-shadow:0 22px 70px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.025)}
        .ka-market-pulse-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 15px;border-bottom:1px solid rgba(59,130,246,.12)}
        .ka-market-pulse-kicker{display:flex;align-items:center;gap:7px;color:var(--ka-cyan);font-size:9px;font-weight:900;letter-spacing:.16em}
        .ka-market-pulse-sub{margin-top:3px;color:var(--ka-text2);font-size:9px;line-height:1.45}
        .ka-market-pulse-status{display:flex;align-items:flex-end;flex-direction:column;gap:3px;flex:none}
        .ka-market-pulse-status>span{display:flex;align-items:center;gap:6px;font-size:9px;font-weight:900;letter-spacing:.08em;color:var(--ka-gold)}
        .ka-market-pulse-status>span.is-live{color:var(--ka-green)}
        .ka-market-pulse-status i{width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 12px currentColor}
        .ka-market-pulse-status small{display:flex;align-items:center;gap:4px;color:var(--ka-text2);font-size:8px}.ka-market-pulse-status small svg{width:10px;height:10px}
        .ka-market-pulse-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}
        .ka-market-asset{display:flex;align-items:center;gap:10px;min-width:0;padding:14px;border-right:1px solid rgba(59,130,246,.10);background:linear-gradient(180deg,rgba(255,255,255,.012),transparent);transition:background .2s,border-color .2s}
        .ka-market-asset:last-child{border-right:0}.ka-market-asset:hover{background:rgba(37,99,235,.055)}
        .ka-market-asset-logo{display:grid;place-items:center;width:38px;height:38px;flex:none;border:1px solid rgba(148,163,184,.16);border-radius:50%;background:rgba(3,12,24,.86);box-shadow:0 9px 26px rgba(0,0,0,.28)}
        .ka-market-asset-logo img{display:block;width:28px;height:28px;object-fit:contain;border-radius:50%}.ka-market-asset-logo b{font-size:13px;color:var(--ka-text)}
        .ka-market-asset-id{display:flex;align-items:baseline;gap:6px;min-width:0}.ka-market-asset-id b{font-size:11px;color:var(--ka-text)}.ka-market-asset-id span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ka-text2);font-size:8px}
        .ka-market-asset-price{display:flex;align-items:baseline;gap:7px;margin-top:3px}.ka-market-asset-price strong{color:var(--ka-text);font-size:13px;white-space:nowrap}.ka-market-asset-price small{color:var(--ka-text2);font-size:8px;font-weight:800}.ka-market-asset-price small.up{color:var(--ka-green)}.ka-market-asset-price small.down{color:#fb7185}
        .ka-market-pulse-foot{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;align-items:center;border-top:1px solid rgba(59,130,246,.10);background:rgba(2,8,17,.54)}
        .ka-market-pulse-foot>div,.ka-market-pulse-foot>a{display:flex;align-items:center;gap:7px;min-width:0;padding:10px 14px;border-right:1px solid rgba(59,130,246,.10);font-size:8px;text-decoration:none}.ka-market-pulse-foot>*:last-child{border-right:0}
        .ka-market-pulse-foot svg{width:12px;height:12px;color:var(--ka-blue);flex:none}.ka-market-pulse-foot span{color:var(--ka-text2);text-transform:uppercase;letter-spacing:.08em}.ka-market-pulse-foot b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ka-text);font-size:8px}.ka-market-pulse-foot>a{justify-content:center;color:var(--ka-blue);font-weight:900;white-space:nowrap}.ka-market-pulse-foot>a svg{width:13px;height:13px}
        @media(max-width:900px){.ka-market-pulse-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ka-market-asset{border-bottom:1px solid rgba(59,130,246,.10)}.ka-market-asset:nth-child(2n){border-right:0}.ka-market-asset:last-child{grid-column:1/-1;border-bottom:0}.ka-market-pulse-foot{grid-template-columns:1fr 1fr}.ka-market-pulse-foot>a{grid-column:1/-1;border-right:0;border-top:1px solid rgba(59,130,246,.10)}}
        @media(max-width:520px){.ka-market-pulse-shell{padding-left:14px;padding-right:14px}.ka-market-pulse-head{align-items:flex-start}.ka-market-pulse-sub{max-width:220px}.ka-market-pulse-status small{display:none}.ka-market-pulse-grid{grid-template-columns:1fr 1fr}.ka-market-asset{padding:12px 11px;gap:8px}.ka-market-asset-logo{width:34px;height:34px}.ka-market-asset-logo img{width:25px;height:25px}.ka-market-asset-id span{display:none}.ka-market-asset-price{display:block}.ka-market-asset-price small{display:block;margin-top:2px}.ka-market-pulse-foot{grid-template-columns:1fr}.ka-market-pulse-foot>div{border-right:0;border-bottom:1px solid rgba(59,130,246,.10)}.ka-market-pulse-foot>a{grid-column:auto;border-top:0}}
        @media(prefers-reduced-motion:reduce){.ka-market-asset{transition:none}}
      `}</style>
    </section>
  );
}
