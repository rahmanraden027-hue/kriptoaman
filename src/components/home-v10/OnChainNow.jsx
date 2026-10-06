import React from 'react';
import { ArrowRight, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import DataProvenanceBar from './DataProvenanceBar';
import { DATA_STATE } from '@/lib/dataState';

export default function OnChainNow({ surface }) {
  const data = surface?.onChain || null;
  const state = surface?.onChainState || DATA_STATE.CHECKING;
  const verifiedLive = state === DATA_STATE.LIVE;
  const latency = Number(data?.latencyMs);

  const metrics = [
    ['Block', Number.isFinite(Number(data?.head?.number)) ? '#' + Number(data.head.number).toLocaleString('en-US') : '—'],
    ['Scanned', data?.radar?.scannedBlocks ?? '—'],
    ['Contracts', data?.radar?.contractCreationsObserved ?? '—'],
    ['Metadata', data?.radar?.tokenMetadataProven ?? '—'],
    ['Confirm Depth', data?.radar?.confirmationDepth ?? '—'],
    ['RPC Latency', Number.isFinite(latency) ? Math.round(latency) + ' ms' : '—'],
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[26px] border border-cyan-300/[0.09] bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,.06),transparent_28%),#050c16] p-4 sm:p-5"
      data-zvq-onchain-state={state}
      data-source-mode={data?.sourceMode || ''}
      data-refresh-ms={surface?.refresh?.onChainMs || ''}
      data-freshness-ms={surface?.freshness?.onChainMs || ''}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" aria-hidden="true" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-amber-300"><Radio className="h-3.5 w-3.5" aria-hidden="true" /> ON-CHAIN NOW</p>
          <h2 className="mt-1 text-lg font-black text-white">ZEVARYQ evidence radar</h2>
        </div>
        <span className={'grid h-10 w-10 place-items-center rounded-2xl border ' + (
          verifiedLive
            ? 'border-emerald-300/20 bg-emerald-300/[0.055]'
            : 'border-slate-300/10 bg-white/[0.025]'
        )}>
          <ShieldCheck className={verifiedLive ? 'h-5 w-5 text-emerald-300' : 'h-5 w-5 text-slate-300'} aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3">
        <DataProvenanceBar
          state={state}
          source={data?.provenance?.endpoint ? 'ZEVARYQ first-party JSON-RPC' : 'ZEVARYQ evidence source unavailable'}
          timestamp={surface?.onChainObservedAt}
          ageMs={surface?.onChainAgeMs}
          label="ON-CHAIN EVIDENCE"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3">
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-cyan-300/35 via-cyan-300/5 to-transparent" aria-hidden="true" />
            <p className="truncate text-sm font-black text-white">{value}</p>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.1em] text-slate-300">{label}</p>
          </div>
        ))}
      </div>

      <Link to="/QoryVExDiscovery" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300/10 bg-amber-300/[0.035] px-3 text-[9px] font-black uppercase tracking-[0.12em] text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80">
        Open discovery <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
