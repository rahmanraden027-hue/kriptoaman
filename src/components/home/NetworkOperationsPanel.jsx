import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Boxes, Database, Gauge, Network, Radio, ShieldCheck, TimerReset } from 'lucide-react';

const fmt = (value, digits = 0) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
  : '—';

function Sparkline({ values, suffix = '', tone = 'cyan' }) {
  const clean = values.map(Number).filter(Number.isFinite);
  const points = useMemo(() => {
    if (!clean.length) return '';
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const span = max - min || 1;
    return clean.map((value, index) => {
      const x = clean.length === 1 ? 50 : (index / (clean.length - 1)) * 100;
      const y = 28 - ((value - min) / span) * 22;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }, [clean.join('|')]);

  const stroke = tone === 'emerald' ? '#34d399' : tone === 'amber' ? '#fbbf24' : tone === 'violet' ? '#a78bfa' : '#22d3ee';
  const latest = clean.length ? clean[clean.length - 1] : null;

  return (
    <div className="rounded-xl border border-white/[.05] bg-black/10 px-2 py-2">
      <svg viewBox="0 0 100 32" className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="28" x2="100" y2="28" stroke="rgba(148,163,184,.12)" strokeWidth=".7" />
        {points && <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="mt-1 text-right text-[8px] font-black text-slate-400">{latest == null ? 'NO HISTORY' : `${fmt(latest, latest < 10 ? 2 : 0)}${suffix}`}</div>
    </div>
  );
}

function OpsCard({ icon: Icon, label, value, note, children, tone = 'cyan' }) {
  const toneClass = tone === 'emerald'
    ? 'text-emerald-300'
    : tone === 'amber'
      ? 'text-amber-300'
      : tone === 'violet'
        ? 'text-violet-300'
        : 'text-cyan-300';
  return (
    <article className="rounded-2xl border border-white/[.06] bg-[#07111f]/76 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[.12em] ${toneClass}`}>
          <Icon className="h-4 w-4" /> {label}
        </div>
      </div>
      <div className="mt-3 text-lg font-black text-white">{value}</div>
      {note && <div className="mt-1 min-h-8 text-[9px] leading-4 text-slate-500">{note}</div>}
      {children && <div className="mt-3">{children}</div>}
    </article>
  );
}

export default function NetworkOperationsPanel({ samples = [], evidence, live, compact = false }) {
  const rpcHistory = samples.map((sample) => sample.rpcLatencyMs).filter(Number.isFinite);
  const blockTimeHistory = samples.map((sample) => sample.blockTimeSeconds).filter(Number.isFinite);
  const lagHistory = samples.map((sample) => sample.indexerLagBlocks).filter(Number.isFinite);

  const sync = evidence?.sync;
  const peerCount = evidence?.peerCount;
  const validatorSet = evidence?.validatorSet;
  const proposers = evidence?.observedProposers;

  const validatorValue = validatorSet?.available
    ? fmt(validatorSet.count)
    : 'UNAVAILABLE';

  const validatorNote = validatorSet?.available
    ? 'Authoritative set returned by public QBFT RPC for this observation.'
    : proposers?.available
      ? `Authoritative validator set unavailable. ${fmt(proposers.count)} recent proposer(s) observed across ${fmt(proposers.sampleBlocks)} blocks.`
      : 'Neither public QBFT validator-set evidence nor recent proposer evidence is available.';

  if (compact) {
    return (
      <section className="mt-4 overflow-hidden rounded-[24px] border border-violet-400/12 bg-[#050b17]/90 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">NETWORK OPERATIONS</p>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] ${live ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}`}>
                {live ? 'LIVE EVIDENCE' : 'DEGRADED'}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-black sm:text-xl">Network Operations</h3>
            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">Four production metrics only. Detailed validator, proposer and evidence diagnostics stay in System Status.</p>
          </div>
          <Link to="/SystemStatus" className="inline-flex min-h-9 items-center rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 text-[9px] font-black uppercase tracking-[.1em] text-violet-200">
            View Details →
          </Link>
        </div>

        <div className="grid gap-2 grid-cols-2 xl:grid-cols-4">
          <OpsCard
            icon={Gauge}
            label="RPC Latency"
            value={rpcHistory.length ? `${fmt(rpcHistory[rpcHistory.length - 1])} ms` : 'UNAVAILABLE'}
            note="Verified chain identity + head probe."
          >
            <Sparkline values={rpcHistory} suffix=" ms" />
          </OpsCard>

          <OpsCard
            icon={TimerReset}
            label="Block Time"
            value={blockTimeHistory.length ? `${fmt(blockTimeHistory[blockTimeHistory.length - 1], 2)} s` : 'UNAVAILABLE'}
            note="Observed recent block timestamps."
            tone="violet"
          >
            <Sparkline values={blockTimeHistory} suffix=" s" tone="violet" />
          </OpsCard>

          <OpsCard
            icon={Database}
            label="Indexer Lag"
            value={lagHistory.length ? `${fmt(lagHistory[lagHistory.length - 1])} block(s)` : 'UNAVAILABLE'}
            note="RPC head minus Explorer indexed head."
            tone={lagHistory.length && lagHistory[lagHistory.length - 1] === 0 ? 'emerald' : 'amber'}
          >
            <Sparkline values={lagHistory} tone={lagHistory.length && lagHistory[lagHistory.length - 1] === 0 ? 'emerald' : 'amber'} />
          </OpsCard>

          <OpsCard
            icon={Network}
            label="Peer Count"
            value={peerCount?.available ? fmt(peerCount.count) : 'UNAVAILABLE'}
            note={peerCount?.available ? 'Direct public net_peerCount evidence.' : 'Not exposed by public RPC.'}
            tone={peerCount?.available ? 'emerald' : 'amber'}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[.06] pt-3 text-[8px] font-bold uppercase tracking-[.09em] text-slate-400">
          <span>Sync · {sync?.available ? String(sync.status || 'unavailable').toUpperCase() : 'UNAVAILABLE'}</span>
          <span>Evidence · FAIL-CLOSED</span>
          <span>No synthetic metrics</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[26px] border border-violet-400/12 bg-[#050b17]/90 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">NODE MASTER 3D · NETWORK OPERATIONS</p>
            <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] ${live ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}`}>
              {live ? 'LIVE EVIDENCE' : 'DEGRADED'}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-black sm:text-xl">Network Operations Console</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-slate-500">
            Rolling history is built only from successful first-party ZEVARYQ observations in this browser session. Unsupported RPC evidence stays unavailable rather than being estimated.
          </p>
        </div>
        <div className="rounded-xl border border-white/[.06] bg-white/[.025] px-3 py-2 text-[9px] text-slate-400">
          History window · last {Math.min(samples.length, 24)} verified sample{samples.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <OpsCard
          icon={Gauge}
          label="RPC Latency"
          value={rpcHistory.length ? `${fmt(rpcHistory[rpcHistory.length - 1])} ms` : 'UNAVAILABLE'}
          note="Observed chain identity + head probe latency; not end-user transaction latency."
        >
          <Sparkline values={rpcHistory} suffix=" ms" />
        </OpsCard>

        <OpsCard
          icon={TimerReset}
          label="Block Time"
          value={blockTimeHistory.length ? `${fmt(blockTimeHistory[blockTimeHistory.length - 1], 2)} s` : 'UNAVAILABLE'}
          note="Average interval derived from timestamps of the current verified block window."
          tone="violet"
        >
          <Sparkline values={blockTimeHistory} suffix=" s" tone="violet" />
        </OpsCard>

        <OpsCard
          icon={Database}
          label="Indexer Lag"
          value={lagHistory.length ? `${fmt(lagHistory[lagHistory.length - 1])} block(s)` : 'UNAVAILABLE'}
          note="Difference between verified RPC head and Explorer indexed head."
          tone={lagHistory.length && lagHistory[lagHistory.length - 1] === 0 ? 'emerald' : 'amber'}
        >
          <Sparkline values={lagHistory} suffix="" tone={lagHistory.length && lagHistory[lagHistory.length - 1] === 0 ? 'emerald' : 'amber'} />
        </OpsCard>

        <OpsCard
          icon={Activity}
          label="Sync State"
          value={sync?.available ? String(sync.status || 'UNAVAILABLE').toUpperCase() : 'UNAVAILABLE'}
          note={sync?.available ? 'Direct public eth_syncing evidence.' : 'Public eth_syncing evidence is unavailable for this observation.'}
          tone={sync?.status === 'synced' ? 'emerald' : sync?.status === 'syncing' ? 'amber' : 'cyan'}
        />
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <OpsCard
          icon={Network}
          label="Peer Count"
          value={peerCount?.available ? fmt(peerCount.count) : 'UNAVAILABLE'}
          note={peerCount?.available ? 'Direct public net_peerCount evidence.' : 'Public net_peerCount is unavailable or intentionally not exposed.'}
          tone={peerCount?.available ? 'emerald' : 'amber'}
        />
        <OpsCard
          icon={ShieldCheck}
          label="Validator Set"
          value={validatorValue}
          note={validatorNote}
          tone={validatorSet?.available ? 'emerald' : 'amber'}
        />
        <OpsCard
          icon={Boxes}
          label="Observed Proposers"
          value={proposers?.available ? fmt(proposers.count) : 'UNAVAILABLE'}
          note={proposers?.available ? `Observed directly in the latest ${fmt(proposers.sampleBlocks)} public block(s); not equivalent to the authoritative validator set.` : 'No proposer addresses were present in the current verified block window.'}
        />
        <OpsCard
          icon={Radio}
          label="Evidence Policy"
          value="FAIL-CLOSED"
          note="No peer count, validator count, health state, or historical point is synthesized when the source is unavailable."
          tone="violet"
        />
      </div>
    </section>
  );
}
