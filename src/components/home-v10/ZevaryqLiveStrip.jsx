import React from 'react';
import { DATA_STATE } from '@/lib/dataState';
import { Activity, Blocks, ExternalLink, Gauge, ShieldCheck } from 'lucide-react';
import DataProvenanceBar from './DataProvenanceBar';

const stateTone = (state) => {
  if (state === DATA_STATE.LIVE) return 'text-emerald-300';
  if (state === DATA_STATE.VERIFIED) return 'text-cyan-300';
  if (state === DATA_STATE.DELAYED) return 'text-amber-300';
  return 'text-slate-300';
};

const displayNetworkState = (state) => state === DATA_STATE.LIVE ? DATA_STATE.VERIFIED : state;

function InlineMetric({ icon: Icon, label, value, tone = 'text-white' }) {
  return (
    <div className="flex min-w-[112px] items-center gap-2 rounded-xl border border-white/[0.055] bg-white/[0.022] px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-[7px] font-black uppercase tracking-[0.11em] text-slate-300">{label}</span>
        <b className={'block truncate text-[10px] ' + tone}>{value}</b>
      </span>
    </div>
  );
}

export default function ZevaryqLiveStrip({ surface }) {
  const network = surface?.network || null;
  const state = surface?.networkState || DATA_STATE.CHECKING;
  const syncState = surface?.syncState || DATA_STATE.CHECKING;
  const block = Number(network?.blockNumber);
  const probeMs = Number(network?.probeDurationMs);
  const source = network
    ? 'ZEVARYQ Network Status · rpc.kriptoaman.com'
    : 'ZEVARYQ network source unavailable';

  return (
    <section
      className="relative overflow-hidden rounded-[24px] border border-amber-300/[0.12] bg-[radial-gradient(circle_at_85%_0%,rgba(245,158,11,.055),transparent_30%),#050c16] px-4 py-3 text-[10px]"
      data-zvq-network-state={state}
      data-zvq-chain-id={surface?.contract?.chainId || 22028}
      data-refresh-ms={surface?.refresh?.networkMs || ''}
      data-freshness-ms={surface?.freshness?.networkMs || ''}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/35 to-transparent" aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-300/15 bg-amber-300/[0.05]">
          <ShieldCheck className="h-4 w-4 text-amber-200" aria-hidden="true" />
        </span>
        <div className="mr-2">
          <b className="block text-[10px] tracking-[0.13em] text-amber-200">ZEVARYQ MAINNET</b>
          <span className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-300">Production network evidence</span>
        </div>

        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          ZEVARYQ network status: {state}. Sync status: {syncState}.
        </span>

        <span className={'inline-flex min-h-7 items-center rounded-full border border-current/20 px-2 text-[8px] font-black uppercase tracking-[0.1em] ' + stateTone(state)}>
          ● {displayNetworkState(state)}
        </span>

        <div className="flex flex-1 flex-wrap gap-2">
          <InlineMetric icon={Activity} label="Chain ID" value={String(surface?.contract?.chainId || 22028)} tone="text-cyan-200" />
          <InlineMetric icon={Blocks} label="Latest Block" value={Number.isFinite(block) ? '#' + block.toLocaleString('en-US') : '—'} />
          <InlineMetric icon={ShieldCheck} label="Sync" value={syncState} tone={syncState === DATA_STATE.SYNCED ? 'text-emerald-300' : 'text-amber-200'} />
          <InlineMetric icon={Gauge} label="RPC Probe" value={Number.isFinite(probeMs) ? Math.round(probeMs) + ' ms' : '—'} tone="text-cyan-200" />
        </div>

        <a
          href="https://explorer.kriptoaman.com"
          target="_blank"
          rel="noreferrer"
          aria-label="Open ZEVARYQ Explorer in a new tab"
          className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] px-3 font-black text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
        >
          Explorer <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-2">
        <DataProvenanceBar
          state={state}
          source={source}
          timestamp={surface?.networkObservedAt}
          ageMs={surface?.networkAgeMs}
          label="NETWORK PROOF"
        />
      </div>
    </section>
  );
}
