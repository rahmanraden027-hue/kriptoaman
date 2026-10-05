import React from 'react';
import { getProductionFreshness } from './productionFreshness';

const fmt = (value) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US')
  : '—';

export default function LandingLiveSystemStrip({ stats }) {
  const block = Number(stats?.zvqBlockNumber);
  const rpc = Number(stats?.zvqProbeDurationMs);
  const chains = Number(stats?.networkActiveCount);
  const liveBlock = Number.isFinite(block);
  const synced = String(stats?.zvqSyncStatus || '').toLowerCase() === 'synced';
  const snapshot = getProductionFreshness(stats);
  const marketAvailable = stats?.marketAvailable === true;
  const marketState = marketAvailable ? snapshot.freshness : 'UNAVAILABLE';
  const marketHealthy = marketAvailable && snapshot.verified && snapshot.freshness !== 'STALE';
  const snapshotHealthy = snapshot.verified && snapshot.freshness !== 'STALE';

  const items = [
    {
      glyph: 'Z',
      label: 'ZEVARYQ',
      value: liveBlock ? 'LIVE' : 'VERIFYING',
      note: liveBlock ? `Block #${fmt(block)}` : 'Waiting for verified head',
      ok: liveBlock,
    },
    {
      glyph: 'R',
      label: 'RPC',
      value: Number.isFinite(rpc) ? `${fmt(rpc)} ms` : 'UNAVAILABLE',
      note: synced ? 'SYNCED' : stats?.zvqSyncStatus ? String(stats.zvqSyncStatus).toUpperCase() : 'NO SYNC CLAIM',
      ok: Number.isFinite(rpc) && synced,
    },
    {
      glyph: 'M',
      label: 'MARKET',
      value: marketState,
      note: marketAvailable ? `${fmt(stats?.assetCount)} assets · ${snapshot.modeLabel}` : 'No synthetic fallback',
      ok: marketHealthy,
    },
    {
      glyph: 'N',
      label: 'NETWORKS',
      value: Number.isFinite(chains) ? fmt(chains) : 'UNAVAILABLE',
      note: Number.isFinite(chains) ? 'responding now' : 'No current probe count',
      ok: Number.isFinite(chains) && chains > 0,
    },
  ];

  return (
    <section className="ka-live-system-strip px-4 sm:px-6 pt-[72px] lg:pt-[68px]" aria-label="KriptoAman live production status">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-2xl border border-blue-400/15 bg-[#04101b]/90 backdrop-blur-xl">
        <div className="grid grid-cols-2 lg:hidden">
          {items.map(({ glyph, label, value, note, ok }, index) => (
            <div
              key={label}
              className={`flex min-w-0 items-center gap-3 px-3 py-3 sm:px-4 ${index % 2 === 0 ? 'border-r border-blue-400/10 lg:border-r' : ''} ${index < 2 ? 'border-b border-blue-400/10 lg:border-b-0' : ''} ${index === 1 ? 'lg:border-r' : ''} ${index === 2 ? 'lg:border-r' : ''}`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${ok ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-400/10 bg-white/[.025] text-slate-400'}`}>
                <span aria-hidden="true" className="text-[9px] font-black tracking-tight">{glyph}</span>
              </span>
              <div className="min-w-0">
                <div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">{label}</div>
                <div className={`mt-0.5 truncate text-[11px] font-black ${ok ? 'text-emerald-300' : 'text-slate-200'}`}>{value}</div>
                <div className="mt-0.5 truncate text-[8px] text-slate-500">{note}</div>
              </div>
            </div>
          ))}
        </div>
        <div
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-blue-400/10 bg-black/10 px-3 py-2.5 text-[9px] sm:px-4 lg:hidden"
          aria-label="Authoritative production snapshot provenance"
        >
          <span className={`inline-flex items-center gap-2 font-black uppercase tracking-[.11em] ${snapshotHealthy ? 'text-emerald-300' : 'text-slate-400'}`}>
            <i aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${snapshotHealthy ? 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.55)]' : 'bg-slate-500'}`} />
            AUTHORITATIVE SNAPSHOT · {snapshot.freshness}
          </span>
          <span className="text-slate-500">
            {snapshot.modeLabel} · AGE {snapshot.ageLabel}{snapshot.generatedLabel ? ` · GENERATED ${snapshot.generatedLabel}` : ''}
          </span>
        </div>

        <div className="hidden min-h-[48px] grid-cols-[repeat(4,minmax(0,1fr))_minmax(300px,auto)] items-stretch lg:grid" aria-label="Compact desktop production status">
          {items.map(({ label, value, note, ok }, index) => (
            <div
              key={`desktop-${label}`}
              className={`flex min-w-0 items-center gap-2 px-3 py-2 ${index < items.length - 1 ? 'border-r border-blue-400/10' : ''}`}
            >
              <i aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.45)]' : 'bg-slate-500'}`} />
              <span className="min-w-0">
                <span className="mr-2 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</span>
                <b className={`text-[11px] font-black ${ok ? 'text-emerald-300' : 'text-slate-200'}`}>{value}</b>
                <small className="ml-2 text-[8px] text-slate-500">{note}</small>
              </span>
            </div>
          ))}
          <div className="flex min-w-0 items-center justify-end gap-3 border-l border-blue-400/10 bg-black/10 px-3 py-2 text-right">
            <span className={`inline-flex items-center gap-2 whitespace-nowrap text-[8px] font-black uppercase tracking-[.1em] ${snapshotHealthy ? 'text-emerald-300' : 'text-slate-400'}`}>
              <i aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${snapshotHealthy ? 'bg-emerald-300' : 'bg-slate-500'}`} />
              SNAPSHOT {snapshot.freshness}
            </span>
            <span className="whitespace-nowrap text-[8px] text-slate-500">
              AGE {snapshot.ageLabel}{snapshot.generatedLabel ? ` · ${snapshot.generatedLabel}` : ''}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
