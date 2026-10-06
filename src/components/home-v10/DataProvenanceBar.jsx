import React from 'react';
import { DATA_STATE } from '@/lib/dataState';

const POSITIVE = new Set([DATA_STATE.LIVE, DATA_STATE.VERIFIED, DATA_STATE.SYNCED]);

const toneFor = (state) => {
  if (POSITIVE.has(state)) return 'border-emerald-400/15 bg-emerald-400/[0.045] text-emerald-300';
  if (state === DATA_STATE.PARTIAL || state === DATA_STATE.SNAPSHOT || state === DATA_STATE.CHECKING) {
    return 'border-amber-400/15 bg-amber-400/[0.045] text-amber-300';
  }
  return 'border-slate-400/10 bg-white/[0.02] text-slate-400';
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

  return (
    <div
      className="flex min-h-8 items-center gap-2 overflow-hidden rounded-lg border border-white/[0.04] bg-black/[0.08] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em]"
      data-data-state={state}
      data-data-source={source}
    >
      <span className="shrink-0 text-slate-600">{label}</span>
      <span className={'shrink-0 rounded-full border px-1.5 py-0.5 ' + toneFor(state)}>● {state}</span>
      <span className="min-w-0 truncate normal-case tracking-normal text-slate-400">{source}</span>
      <span className="ml-auto shrink-0 text-slate-600">
        {formatTimestamp(timestamp)}{age ? ' · ' + age : ''}
      </span>
    </div>
  );
}
