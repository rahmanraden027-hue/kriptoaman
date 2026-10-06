import React from 'react';
import { DATA_STATE } from '@/lib/dataState';

const POSITIVE = new Set([DATA_STATE.LIVE, DATA_STATE.VERIFIED, DATA_STATE.SYNCED]);

const toneFor = (state) => {
  if (POSITIVE.has(state)) return 'border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300';
  if (state === DATA_STATE.PARTIAL || state === DATA_STATE.SNAPSHOT || state === DATA_STATE.CHECKING) {
    return 'border-amber-400/15 bg-amber-400/[0.06] text-amber-300';
  }
  return 'border-slate-400/10 bg-white/[0.025] text-slate-400';
};

const formatTimestamp = (value) => {
  if (!value) return 'timestamp unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'timestamp unavailable';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatAge = (ageMs) => {
  const age = Number(ageMs);
  if (!Number.isFinite(age) || age < 0) return null;
  if (age < 60_000) return '<1m old';
  if (age < 3_600_000) return Math.floor(age / 60_000) + 'm old';
  return Math.floor(age / 3_600_000) + 'h old';
};

export default function DataProvenanceBar({
  state = DATA_STATE.UNAVAILABLE,
  source = 'Source unavailable',
  timestamp = null,
  ageMs = null,
  label = 'DATA CONTRACT',
}) {
  const age = formatAge(ageMs);

  return (
    <div
      className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/[0.05] bg-black/10 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.08em]"
      data-data-state={state}
      data-data-source={source}
    >
      <span className="text-slate-500">{label}</span>
      <span className={'rounded-full border px-2 py-1 ' + toneFor(state)}>● {state}</span>
      <span className="text-slate-500">SOURCE</span>
      <span className="normal-case tracking-normal text-slate-300">{source}</span>
      <span className="ml-auto text-slate-500">
        {formatTimestamp(timestamp)}{age ? ' · ' + age : ''}
      </span>
    </div>
  );
}
