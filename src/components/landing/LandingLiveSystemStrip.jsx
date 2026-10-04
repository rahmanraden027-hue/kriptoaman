import React from 'react';
import { Activity, Database, Gauge, Radio } from 'lucide-react';

const fmt = (value) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US')
  : '—';

export default function LandingLiveSystemStrip({ stats }) {
  const block = Number(stats?.zvqBlockNumber);
  const rpc = Number(stats?.zvqProbeDurationMs);
  const chains = Number(stats?.networkActiveCount);
  const liveBlock = Number.isFinite(block);
  const marketLive = stats?.marketAvailable === true;
  const synced = String(stats?.zvqSyncStatus || '').toLowerCase() === 'synced';

  const items = [
    {
      icon: Activity,
      label: 'ZEVARYQ',
      value: liveBlock ? 'LIVE' : 'VERIFYING',
      note: liveBlock ? `Block #${fmt(block)}` : 'Waiting for verified head',
      ok: liveBlock,
    },
    {
      icon: Gauge,
      label: 'RPC',
      value: Number.isFinite(rpc) ? `${fmt(rpc)} ms` : 'UNAVAILABLE',
      note: synced ? 'SYNCED' : stats?.zvqSyncStatus ? String(stats.zvqSyncStatus).toUpperCase() : 'NO SYNC CLAIM',
      ok: Number.isFinite(rpc) && synced,
    },
    {
      icon: Database,
      label: 'MARKET',
      value: marketLive ? 'LIVE' : 'UNAVAILABLE',
      note: marketLive ? `${fmt(stats?.assetCount)} assets` : 'No synthetic fallback',
      ok: marketLive,
    },
    {
      icon: Radio,
      label: 'NETWORKS',
      value: Number.isFinite(chains) ? fmt(chains) : 'UNAVAILABLE',
      note: Number.isFinite(chains) ? 'responding now' : 'No current probe count',
      ok: Number.isFinite(chains) && chains > 0,
    },
  ];

  return (
    <section className="ka-live-system-strip px-4 sm:px-6 pt-[72px]" aria-label="KriptoAman live production status">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-2xl border border-blue-400/15 bg-[#04101b]/90 backdrop-blur-xl">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, value, note, ok }, index) => (
            <div
              key={label}
              className={`flex min-w-0 items-center gap-3 px-3 py-3 sm:px-4 ${index % 2 === 0 ? 'border-r border-blue-400/10 lg:border-r' : ''} ${index < 2 ? 'border-b border-blue-400/10 lg:border-b-0' : ''} ${index === 1 ? 'lg:border-r' : ''} ${index === 2 ? 'lg:border-r' : ''}`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${ok ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-400/10 bg-white/[.025] text-slate-400'}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">{label}</div>
                <div className={`mt-0.5 truncate text-[11px] font-black ${ok ? 'text-emerald-300' : 'text-slate-200'}`}>{value}</div>
                <div className="mt-0.5 truncate text-[8px] text-slate-500">{note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
