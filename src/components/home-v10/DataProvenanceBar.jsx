import React from 'react';
import { DATA_STATE } from '@/lib/dataState';

const POSITIVE = new Set([DATA_STATE.LIVE, DATA_STATE.VERIFIED, DATA_STATE.SYNCED, DATA_STATE.INDEXED]);

const toneFor = (state) => {
  if (POSITIVE.has(state)) return 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200';
  if (state === DATA_STATE.CALCULATED) return 'border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-200';
  if (
    state === DATA_STATE.PARTIAL
    || state === DATA_STATE.SNAPSHOT
    || state === DATA_STATE.DELAYED
    || state === DATA_STATE.CHECKING
  ) {
    return 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200';
  }
  return 'border-slate-300/15 bg-white/[0.03] text-slate-300';
};

const formatTimestamp = (value) => {
  if (!value) return 'time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'time unavailable';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatAge = (ageMs) => {
  const age = Number(ageMs);
  if (!Number.isFinite(age) || age < 0) return null;
  if (age < 60_000) return '<1m';
  if (age < 3_600_000) return Math.floor(age / 60_000) + 'm';
  return Math.floor(age / 3_600_000) + 'h';
};

export default function DataProvenanceBar({
  state = DATA_STATE.UNAVAILABLE,
  source = 'Source unavailable',
  timestamp = null,
  ageMs = null,
  label = 'DATA',
}) {
  const age = formatAge(ageMs);
  const machineAge = Number(ageMs);

  return (
    <div
      className="flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1 overflow-hidden rounded-xl border border-white/[0.06] bg-black/[0.12] px-3 py-2 text-[9px] font-black uppercase tracking-[0.06em] sm:min-h-9 sm:flex-nowrap sm:py-1.5 sm:text-[8px]"
      data-trust-signal="readable-v1"
      data-data-state={state}
      data-data-source={source}
      data-data-timestamp={timestamp || ''}
      data-data-age-ms={Number.isFinite(machineAge) && machineAge >= 0 ? Math.round(machineAge) : ''}
      aria-label={label + ' ' + state + ' from ' + source}
    >
      <span className="shrink-0 text-slate-200">{label}</span>
      <span className={'shrink-0 rounded-full border px-2 py-0.5 ' + toneFor(state)}>● {state}</span>
      <span className="order-3 w-full min-w-0 truncate normal-case tracking-normal text-[10px] font-semibold text-slate-200 sm:order-none sm:w-auto sm:text-[8px]">{source}</span>
      <span className="ml-auto shrink-0 text-slate-200">
        {formatTimestamp(timestamp)}{age ? ' · ' + age : ''}
      </span>
    </div>
  );
}
