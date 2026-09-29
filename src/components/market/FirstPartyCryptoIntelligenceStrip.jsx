import React, { useEffect, useState } from 'react';
import { Activity, Boxes, Database, Radio, ShieldCheck } from 'lucide-react';

const REFRESH_MS = 12000;

export default function FirstPartyCryptoIntelligenceStrip() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    let timer;
    const load = async () => {
      try {
        const response = await fetch('/api/zvq-first-party-discovery', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();
        if (!response.ok || payload?.status !== 'live') throw new Error(payload?.message || 'First-party feed unavailable');
        if (active) setState({ loading: false, data: payload, error: null });
      } catch (error) {
        if (active) setState(previous => ({ loading: false, data: previous.data, error: error?.message || 'Unavailable' }));
      } finally {
        if (active) timer = window.setTimeout(load, REFRESH_MS);
      }
    };
    load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const { data, loading, error } = state;
  const ageMs = data?.observedAt ? Math.max(0, Date.now() - Number(data.observedAt)) : null;
  const fresh = !error && ageMs != null && ageMs < REFRESH_MS * 2;
  const block = Number(data?.head?.number);

  return (
    <section className="rounded-[26px] border border-sky-400/15 bg-[#07111d]/86 p-4 sm:p-5" aria-label="KriptoAman first-party crypto intelligence">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-sky-300">
            <Radio className="h-3.5 w-3.5" /> FIRST-PARTY CRYPTO INTELLIGENCE
          </p>
          <h2 className="mt-1 text-lg font-black text-white sm:text-xl">ZEVARYQ direct chain evidence</h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
            Read-only evidence observed directly from KriptoAman-operated ZEVARYQ RPC. No external market provider is used for this strip.
          </p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black ${
          fresh ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${fresh ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {loading ? 'CONNECTING' : fresh ? 'FIRST-PARTY LIVE' : data ? 'LAST VERIFIED' : 'UNAVAILABLE'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [Boxes, 'ZEVARYQ Block', Number.isFinite(block) ? block.toLocaleString('en-US') : '—'],
          [Activity, 'Recent Contracts', data?.observation?.contractCreationCount ?? '—'],
          [Database, 'Source', data?.provenance?.ownership === 'first-party' ? 'KriptoAman RPC' : '—'],
          [ShieldCheck, 'Latency', Number.isFinite(Number(data?.latencyMs)) ? `${data.latencyMs} ms` : '—'],
        ].map(([Icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
            <Icon className="h-4 w-4 text-sky-300" />
            <p className="mt-2 truncate text-sm font-black text-white">{value}</p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-500">
        <span>Chain ID 22028</span>
        <span>Transport: JSON-RPC</span>
        <span>State: observed, not finalized</span>
        <span>Contract creation ≠ token listing or endorsement</span>
        {error && <span className="text-amber-300">Refresh issue: preserving last verified observation</span>}
      </div>
    </section>
  );
}
