import React from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Radio } from 'lucide-react';
import { formatChange, formatCompactUsd } from './format';

const iconFor = (event) => {
  if (event.direction === 'up') return ArrowUpRight;
  if (event.direction === 'down') return ArrowDownRight;
  return Activity;
};

const valueFor = (event) => {
  if (event.type === 'VOLUME') return formatCompactUsd(event.value);
  if (event.type === 'BREADTH') return String(event.value);
  return formatChange(event.value);
};

export default function IntelligenceStream({ events = [], state = 'UNAVAILABLE', capturedAt = null }) {
  return (
    <section className="rounded-[26px] border border-cyan-400/10 bg-[#050c16] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Live Intelligence</h2>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
          <Radio className="h-3.5 w-3.5" /> {state}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {events.length ? events.map(event => {
          const Icon = iconFor(event);
          const tone = event.direction === 'up'
            ? 'text-emerald-300'
            : event.direction === 'down'
              ? 'text-rose-300'
              : 'text-cyan-200';
          return (
            <div key={event.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.035] ${tone}`}><Icon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <b className="text-sm text-white">{event.asset}</b>
                  <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{event.type}</span>
                </div>
              </div>
              <b className={`text-xs ${tone}`}>{valueFor(event)}</b>
            </div>
          );
        }) : <p className="py-8 text-center text-[10px] text-slate-400">No verified intelligence event available.</p>}
      </div>

      <p className="mt-3 text-[8px] uppercase tracking-[0.12em] text-slate-400">
        {capturedAt ? `Snapshot ${new Date(capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Snapshot unavailable'}
      </p>
    </section>
  );
}
