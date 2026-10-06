import React from 'react';
import { DATA_STATE } from '@/lib/dataState';
import { ExternalLink } from 'lucide-react';
import DataProvenanceBar from './DataProvenanceBar';

const stateTone = (state) => {
  if (state === DATA_STATE.LIVE) return 'text-emerald-300';
  if (state === DATA_STATE.VERIFIED) return 'text-cyan-300';
  if (state === DATA_STATE.DELAYED) return 'text-amber-300';
  return 'text-slate-300';
};

export default function ZevaryqLiveStrip({ surface }) {
  const network = surface?.network || null;
  const state = surface?.networkState || DATA_STATE.CHECKING;
  const syncState = surface?.syncState || DATA_STATE.CHECKING;
  const block = Number(network?.blockNumber);
  const source = network
    ? 'ZEVARYQ Network Status · rpc.kriptoaman.com'
    : 'ZEVARYQ network source unavailable';

  return (
    <section
      className="rounded-2xl border border-amber-400/10 bg-[#050c16] px-4 py-2.5 text-[10px]"
      data-zvq-network-state={state}
      data-zvq-chain-id={surface?.contract?.chainId || 22028}
      data-refresh-ms={surface?.refresh?.networkMs || ''}
      data-freshness-ms={surface?.freshness?.networkMs || ''}
    >
      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1">
        <b className="text-amber-300">ZEVARYQ</b>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          ZEVARYQ network status: {state}. Sync status: {syncState}.
        </span>
        <span className={stateTone(state)}>● {state}</span>
        <span className="text-slate-300">|</span>
        <span className="font-black text-white">{Number.isFinite(block) ? '#' + block.toLocaleString('en-US') : '—'}</span>
        <span className="text-slate-300">|</span>
        <span className={syncState === DATA_STATE.SYNCED ? 'text-emerald-300' : 'text-slate-300'}>
          {syncState}
        </span>
        <a
          href="https://explorer.kriptoaman.com"
          target="_blank"
          rel="noreferrer"
          aria-label="Open ZEVARYQ Explorer in a new tab"
          className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-black text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
        >
          Explorer <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
      <DataProvenanceBar
        state={state}
        source={source}
        timestamp={surface?.networkObservedAt}
        ageMs={surface?.networkAgeMs}
        label="NETWORK PROOF"
      />
    </section>
  );
}
