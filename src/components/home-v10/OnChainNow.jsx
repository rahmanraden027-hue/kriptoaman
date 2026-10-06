import React from 'react';
import { ArrowRight, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import DataProvenanceBar from './DataProvenanceBar';
import { DATA_STATE } from '@/lib/dataState';

export default function OnChainNow({ surface }) {
  const data = surface?.onChain || null;
  const state = surface?.onChainState || DATA_STATE.CHECKING;
  const verifiedLive = state === DATA_STATE.LIVE;

  const metrics = [
    ['Block', Number.isFinite(Number(data?.head?.number)) ? '#' + Number(data.head.number).toLocaleString('en-US') : '—'],
    ['Contracts', data?.radar?.contractCreationsObserved ?? '—'],
    ['Metadata', data?.radar?.tokenMetadataProven ?? '—'],
  ];

  return (
    <section
      className="rounded-[26px] border border-amber-400/10 bg-[#050c16] p-4 sm:p-5"
      data-zvq-onchain-state={state}
      data-refresh-ms={surface?.refresh?.onChainMs || ''}
      data-freshness-ms={surface?.freshness?.onChainMs || ''}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-amber-300"><Radio className="h-3.5 w-3.5" aria-hidden="true" /> ON-CHAIN NOW</p>
          <h2 className="mt-1 text-lg font-black text-white">ZEVARYQ discovery</h2>
        </div>
        <ShieldCheck className={verifiedLive ? 'h-5 w-5 text-emerald-300' : 'h-5 w-5 text-slate-300'} aria-hidden="true" />
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

      <div className="mt-4 grid grid-cols-3 gap-2">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
            <p className="truncate text-sm font-black text-white">{value}</p>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.1em] text-slate-300">{label}</p>
          </div>
        ))}
      </div>

      <Link to="/QoryVExDiscovery" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80">
        Open discovery <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
