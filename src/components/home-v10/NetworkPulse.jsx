import React from 'react';
import { Blocks, Gauge, Radio, ShieldCheck } from 'lucide-react';
import { DATA_STATE } from '@/lib/dataState';
import DataProvenanceBar from './DataProvenanceBar';

const stateTone = (state) => {
  if ([DATA_STATE.LIVE, DATA_STATE.SYNCED, DATA_STATE.VERIFIED].includes(state)) return 'text-emerald-300';
  if ([DATA_STATE.DELAYED, DATA_STATE.CHECKING, DATA_STATE.SNAPSHOT].includes(state)) return 'text-amber-300';
  return 'text-slate-300';
};

export default function NetworkPulse({ surface }) {
  const network = surface?.network || null;
  const onChain = surface?.onChain || null;
  const networkState = surface?.networkState || DATA_STATE.CHECKING;
  const onChainState = surface?.onChainState || DATA_STATE.CHECKING;
  const head = Number(network?.blockNumber);
  const blockSequence = Number.isSafeInteger(head) && head >= 5
    ? Array.from({ length: 6 }, (_, index) => head - 5 + index)
    : [];
  const contractCountIsWindowFact = onChain?.truthPolicy?.contractCreationCountIsObservedWindowFact === true;
  const metadataCountIsWindowFact = onChain?.truthPolicy?.tokenMetadataProvenCountIsObservedWindowFact === true;

  const metrics = [
    ['Sync', surface?.syncState || DATA_STATE.CHECKING],
    ['Evidence head', Number.isSafeInteger(Number(onChain?.head?.number)) ? '#' + Number(onChain.head.number).toLocaleString('en-US') : '—'],
    ['Scanned blocks', onChain?.radar?.scannedBlocks ?? '—'],
    ['Confirmation', onChain?.radar?.confirmationDepth ?? '—'],
    ['Contracts observed', contractCountIsWindowFact ? (onChain?.radar?.contractCreationsObserved ?? '—') : 'NOT EXPOSED'],
    ['Metadata proven', metadataCountIsWindowFact ? (onChain?.radar?.tokenMetadataProven ?? '—') : 'NOT EXPOSED'],
  ];

  return (
    <section
      aria-label="ZEVARYQ network pulse"
      className="relative overflow-hidden rounded-[26px] border border-cyan-300/[0.09] bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,.07),transparent_30%),#050c16] p-4 sm:p-5"
      data-network-pulse-state={surface?.overallState || DATA_STATE.CHECKING}
      data-network-source={surface?.networkSourceMode || 'UNAVAILABLE'}
    >
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.16em] text-cyan-300"><Radio className="h-3.5 w-3.5" aria-hidden="true" /> LIVE NETWORK PULSE</p>
          <h2 className="mt-1 text-lg font-black text-white">Block Flow · Evidence · RPC Health</h2>
        </div>
        <div className="flex gap-2">
          <span className={'rounded-full border border-current/15 px-2.5 py-1 text-[8px] font-black uppercase ' + stateTone(networkState)}>Network {networkState}</span>
          <span className={'rounded-full border border-current/15 px-2.5 py-1 text-[8px] font-black uppercase ' + stateTone(onChainState)}>Evidence {onChainState}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-2xl border border-white/[0.055] bg-[#030812]/72 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-300">Verified block height sequence</p>
              <p className="mt-1 text-[10px] text-slate-400">Derived only from the verified current head; no synthetic transaction counts.</p>
            </div>
            <Blocks className="h-5 w-5 text-amber-200" aria-hidden="true" />
          </div>

          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {blockSequence.length ? blockSequence.map((block, index) => (
              <React.Fragment key={block}>
                <div className={'min-w-[110px] rounded-2xl border p-3 ' + (index === blockSequence.length - 1 ? 'border-amber-300/25 bg-amber-300/[0.06]' : 'border-cyan-300/10 bg-cyan-300/[0.035]')}>
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-300">{index === blockSequence.length - 1 ? 'LATEST' : 'HEIGHT'}</span>
                  <b className="mt-1 block text-sm text-white">#{block.toLocaleString('en-US')}</b>
                </div>
                {index < blockSequence.length - 1 ? <span className="shrink-0 text-cyan-300/60" aria-hidden="true">→</span> : null}
              </React.Fragment>
            )) : <p className="py-8 text-[10px] text-slate-400">Verified block sequence unavailable.</p>}
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.025] p-2.5">
              <Gauge className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              <b className="mt-2 block text-sm text-white">{Number.isFinite(Number(network?.probeDurationMs)) ? Math.round(Number(network.probeDurationMs)) + ' ms' : '—'}</b>
              <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-300">RPC probe</span>
            </div>
            <div className="rounded-xl bg-white/[0.025] p-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <b className="mt-2 block text-sm text-white">{surface?.contract?.chainId || 22028}</b>
              <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-300">Chain ID</span>
            </div>
            <div className="rounded-xl bg-white/[0.025] p-2.5" data-pending-pool-telemetry="not-exposed">
              <Radio className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <b className="mt-2 block text-sm text-amber-200">NOT EXPOSED</b>
              <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-300">Pending-pool telemetry</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2" data-zero-evidence-semantics="observed-window-fact">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-3">
              <b className="block truncate text-sm text-white">{value}</b>
              <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.09em] text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <DataProvenanceBar
          state={networkState}
          source={surface?.networkSourceMode === 'FIRST_PARTY_CORROBORATED'
            ? 'ZEVARYQ first-party JSON-RPC · corroborated evidence'
            : network
              ? 'ZEVARYQ Network Status · rpc.kriptoaman.com'
              : 'ZEVARYQ network source unavailable'}
          timestamp={surface?.networkObservedAt}
          ageMs={surface?.networkAgeMs}
          label="NETWORK PULSE SOURCE"
        />
        <DataProvenanceBar
          state={onChainState}
          source={onChain?.provenance?.endpoint ? 'ZEVARYQ first-party JSON-RPC' : 'ZEVARYQ evidence source unavailable'}
          timestamp={surface?.onChainObservedAt}
          ageMs={surface?.onChainAgeMs}
          label="ON-CHAIN PULSE SOURCE"
        />
      </div>
    </section>
  );
}
