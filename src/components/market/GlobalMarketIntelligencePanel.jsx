import React, { useMemo, useState } from 'react';
import { Activity, Bell, CalendarDays, ChartNoAxesCombined, Gauge, ShieldCheck, TrendingUp } from 'lucide-react';
import useGlobalMarketIntelligence from './useGlobalMarketIntelligence';
import { useLanguage } from '@/lib/LanguageContext';

const ALERT_KEY = 'ka_global_market_alert_v1';

const COPY = {
  id: {
    eyebrow: 'CROSS-ASSET INTELLIGENCE',
    title: 'Gold · Dollar · Crypto Context',
    body: 'Konteks lintas aset berbasis OHLC, return historis, volatilitas, korelasi dan kalender makro. Statistik deskriptif—bukan sinyal trading.',
    goldChart: 'XAU/USD · 1H OHLC',
    historyUnavailable: 'OHLC profesional akan aktif setelah provider Twelve Data dikonfigurasi.',
    dxy: 'DXY',
    dxyUnavailable: 'Feed DXY belum tersedia pada provider aktif.',
    correlation: 'Korelasi harian',
    volatility: 'Volatilitas tahunan',
    momentum: 'Momentum 20 sesi',
    btcGold: 'BTC ↔ Gold',
    goldDxy: 'Gold ↔ DXY',
    btcDxy: 'BTC ↔ DXY',
    calendar: 'Kalender Makro USD',
    calendarUnavailable: 'Kalender ekonomi siap digunakan setelah credential Trading Economics dikonfigurasi.',
    alerts: 'Alert Harga Lokal',
    alertBody: 'Alert tersimpan hanya pada perangkat ini dan tidak melakukan transaksi.',
    above: 'Di atas',
    below: 'Di bawah',
    target: 'Target harga',
    save: 'Simpan alert',
    remove: 'Hapus',
    triggered: 'TARGET TERCAPAI',
    armed: 'Alert aktif',
    providerReady: 'Provider profesional aktif',
    providerFallback: 'Mode referensi aktif',
    updated: 'Pembaruan analitik',
    noData: 'Belum tersedia',
  },
  en: {
    eyebrow: 'CROSS-ASSET INTELLIGENCE',
    title: 'Gold · Dollar · Crypto Context',
    body: 'Cross-asset context based on OHLC, historical returns, volatility, correlations, and macro events. Descriptive statistics—not trading signals.',
    goldChart: 'XAU/USD · 1H OHLC',
    historyUnavailable: 'Professional OHLC activates after Twelve Data is configured.',
    dxy: 'DXY',
    dxyUnavailable: 'DXY feed is not available from the active provider.',
    correlation: 'Daily correlation',
    volatility: 'Annualized volatility',
    momentum: '20-session momentum',
    btcGold: 'BTC ↔ Gold',
    goldDxy: 'Gold ↔ DXY',
    btcDxy: 'BTC ↔ DXY',
    calendar: 'USD Macro Calendar',
    calendarUnavailable: 'Economic calendar is ready once Trading Economics credentials are configured.',
    alerts: 'Local Price Alert',
    alertBody: 'The alert is stored only on this device and never places trades.',
    above: 'Above',
    below: 'Below',
    target: 'Target price',
    save: 'Save alert',
    remove: 'Remove',
    triggered: 'TARGET REACHED',
    armed: 'Alert active',
    providerReady: 'Professional provider active',
    providerFallback: 'Reference mode active',
    updated: 'Analytics updated',
    noData: 'Unavailable',
  },
};

const fmt = (value, digits = 2) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) })
  : '—';

const pct = value => Number.isFinite(Number(value)) ? `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%` : '—';
const corr = value => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '—';

const readAlert = () => {
  try {
    return JSON.parse(localStorage.getItem(ALERT_KEY) || 'null');
  } catch {
    return null;
  }
};

export default function GlobalMarketIntelligencePanel({ instruments = [], providerMode = 'fallback-reference' }) {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const { intelligence, history, calendar, availability, loading, updatedAt } = useGlobalMarketIntelligence();
  const [alertRule, setAlertRule] = useState(() => readAlert());
  const [symbol, setSymbol] = useState(alertRule?.symbol || 'XAU/USD');
  const [direction, setDirection] = useState(alertRule?.direction || 'above');
  const [target, setTarget] = useState(alertRule?.target ? String(alertRule.target) : '');

  const historyValues = history?.values || [];
  const chart = useMemo(() => {
    const points = historyValues.map(item => Number(item.close)).filter(Number.isFinite);
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = Math.max(max - min, Math.abs(max) * 0.0001, 1e-9);
    const coordinates = points.map((value, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 44 - (((value - min) / range) * 40);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    return { coordinates, min, max, last: points.at(-1) };
  }, [historyValues]);

  const currentInstrument = instruments.find(item => item.symbol === symbol);
  const currentPrice = Number(currentInstrument?.price);
  const alertTarget = Number(alertRule?.target);
  const alertTriggered = Boolean(alertRule && Number.isFinite(currentPrice) && Number.isFinite(alertTarget)
    && (alertRule.direction === 'above' ? currentPrice >= alertTarget : currentPrice <= alertTarget));

  const saveAlert = () => {
    const parsed = Number(target);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const rule = { symbol, direction, target: parsed, savedAt: Date.now() };
    setAlertRule(rule);
    try { localStorage.setItem(ALERT_KEY, JSON.stringify(rule)); } catch { /* optional */ }
  };

  const removeAlert = () => {
    setAlertRule(null);
    try { localStorage.removeItem(ALERT_KEY); } catch { /* optional */ }
  };

  const events = calendar?.events || [];
  const dxyInstrument = instruments.find(item => item.symbol === 'DXY');
  const dxyPrice = dxyInstrument?.price ?? intelligence?.latest?.dxy;
  const professionalActive = providerMode === 'professional';

  return (
    <section className="mt-4 rounded-[26px] border border-sky-400/15 bg-[#07111d]/86 p-4 sm:p-5" aria-labelledby="cross-asset-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-sky-300"><ChartNoAxesCombined className="h-3.5 w-3.5" />{text.eyebrow}</p>
          <h2 id="cross-asset-title" className="mt-1 text-xl font-black tracking-[-0.03em] text-white">{text.title}</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">{text.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${professionalActive ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'}`}>
            <ShieldCheck className="h-3.5 w-3.5" /> {professionalActive ? text.providerReady : text.providerFallback}
          </span>
          {loading && <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-bold text-sky-200"><Activity className="h-3.5 w-3.5 animate-pulse" /> Loading</span>}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.025] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">{text.goldChart}</p>
              <p className="mt-1 text-xl font-black text-white">{chart ? `$${fmt(chart.last, 2)}` : '—'}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-amber-300" />
          </div>
          {chart ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.05] bg-black/20 p-2">
              <svg viewBox="0 0 100 48" className="h-40 w-full" role="img" aria-label="XAU USD hourly price history">
                <line x1="0" y1="44" x2="100" y2="44" stroke="currentColor" className="text-slate-800" strokeWidth="0.35" />
                <line x1="0" y1="24" x2="100" y2="24" stroke="currentColor" className="text-slate-800" strokeWidth="0.25" />
                <polyline points={chart.coordinates} fill="none" stroke="currentColor" className="text-amber-300" strokeWidth="1.15" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="flex justify-between text-[9px] text-slate-500"><span>Low ${fmt(chart.min, 2)}</span><span>High ${fmt(chart.max, 2)}</span></div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-3 text-[10px] leading-4 text-amber-100/80">{text.historyUnavailable}</div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{text.dxy}</p><Gauge className="h-4 w-4 text-sky-300" /></div>
            <p className="mt-2 text-2xl font-black text-white">{Number.isFinite(Number(dxyPrice)) ? fmt(dxyPrice, 3) : '—'}</p>
            {!Number.isFinite(Number(dxyPrice)) && <p className="mt-2 text-[10px] leading-4 text-slate-500">{text.dxyUnavailable}</p>}
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{text.updated}</p>
            <p className="mt-2 text-sm font-black text-white">{updatedAt ? new Date(updatedAt).toLocaleString(language === 'en' ? 'en-US' : 'id-ID') : text.noData}</p>
            <p className="mt-1 text-[9px] text-slate-600">{availability?.intelligence || '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{text.correlation}</p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">{text.btcGold}</span><strong>{corr(intelligence?.correlations?.btcGold)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">{text.goldDxy}</span><strong>{corr(intelligence?.correlations?.goldDxy)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">{text.btcDxy}</span><strong>{corr(intelligence?.correlations?.btcDxy)}</strong></div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{text.volatility}</p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">BTC</span><strong>{pct(intelligence?.volatilityPct?.btc)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Gold</span><strong>{pct(intelligence?.volatilityPct?.gold)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">DXY</span><strong>{pct(intelligence?.volatilityPct?.dxy)}</strong></div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{text.momentum}</p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">BTC</span><strong>{pct(intelligence?.momentum20Pct?.btc)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Gold</span><strong>{pct(intelligence?.momentum20Pct?.gold)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">DXY</span><strong>{pct(intelligence?.momentum20Pct?.dxy)}</strong></div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-violet-300" /><h3 className="text-sm font-black text-white">{text.calendar}</h3></div>
          {events.length ? (
            <div className="mt-3 divide-y divide-white/[0.05]">
              {events.slice(0, 5).map((event, index) => (
                <div key={`${event.id || event.event}-${index}`} className="grid gap-1 py-2.5 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                  <span className="text-[10px] text-slate-500">{new Date(event.date).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-xs font-bold text-slate-200">{event.event}</span>
                  <span className={`w-fit rounded-full px-2 py-1 text-[9px] font-black ${event.importance >= 3 ? 'bg-rose-400/10 text-rose-200' : 'bg-amber-400/10 text-amber-200'}`}>Impact {event.importance}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-[10px] leading-4 text-slate-500">{text.calendarUnavailable}</p>}
        </div>

        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4">
          <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-black text-white">{text.alerts}</h3></div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{text.alertBody}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <select value={symbol} onChange={event => setSymbol(event.target.value)} className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-xs text-white">
              {instruments.map(item => <option key={item.symbol} value={item.symbol}>{item.symbol}</option>)}
            </select>
            <select value={direction} onChange={event => setDirection(event.target.value)} className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-xs text-white">
              <option value="above">{text.above}</option><option value="below">{text.below}</option>
            </select>
            <input value={target} onChange={event => setTarget(event.target.value)} inputMode="decimal" placeholder={text.target} className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-xs text-white placeholder:text-slate-600" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={saveAlert} className="min-h-10 rounded-xl bg-emerald-400 px-4 text-xs font-black text-slate-950">{text.save}</button>
            {alertRule && <button type="button" onClick={removeAlert} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300">{text.remove}</button>}
          </div>
          {alertRule && <div className={`mt-3 rounded-xl border p-3 text-[10px] font-bold ${alertTriggered ? 'border-rose-400/25 bg-rose-400/10 text-rose-100' : 'border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-100'}`}>{alertTriggered ? text.triggered : text.armed}: {alertRule.symbol} {alertRule.direction === 'above' ? '≥' : '≤'} {fmt(alertRule.target, 5)}</div>}
        </div>
      </div>

      {(intelligence?.attribution?.url || history?.attribution?.url) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] text-slate-600">
          <span>Market data:</span>
          <a href="https://twelvedata.com/" target="_blank" rel="noreferrer" className="font-bold text-sky-300 hover:text-sky-200">Twelve Data</a>
          <span>·</span><span>Informational use only</span>
        </div>
      )}
    </section>
  );
}
