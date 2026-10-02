import React, { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Database, ExternalLink, ShieldAlert, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';

const short = value => value ? `${String(value).slice(0, 10)}…${String(value).slice(-8)}` : '—';
const Field = ({ label, value, mono = false }) => <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className={`mt-2 break-all text-sm font-bold text-slate-100 ${mono ? 'font-mono' : ''}`}>{value ?? 'UNAVAILABLE'}</p></div>;

export default function PairPassport() {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    let active = true;
    fetch('/api/zvq-liquidity-evidence', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok || payload?.status !== 'live') throw new Error(payload?.message || payload?.code || 'Liquidity evidence unavailable');
        return payload;
      })
      .then(data => active && setState({ loading: false, data, error: null }))
      .catch(error => active && setState({ loading: false, data: null, error: error?.message || 'Liquidity evidence unavailable' }));
    return () => { active = false; };
  }, []);

  const d = state.data;
  const pairProven = Boolean(d?.pair && d?.poolEvidence === 'FIRST_PARTY_ON_CHAIN');
  const reservesProven = d?.liquidityEvidence === 'RESERVES_PRESENT';

  return <main className="min-h-screen bg-[#020611] px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-6xl">
    <Link to="/qoryvex/discovery" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300"><ArrowLeft className="h-4 w-4" /> QoryVEx Discovery</Link>
    <section className="mt-5 rounded-[30px] border border-cyan-400/15 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.12),transparent_30%),#06101b] p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300">QORYVEX · PAIR PASSPORT · CHAIN 22028</p><h1 className="mt-2 text-3xl font-black">Liquidity Evidence</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Read-only proof of router → factory → pair → token identity → reserves from the first-party ZEVARYQ RPC.</p></div>{pairProven && <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black text-emerald-300"><BadgeCheck className="h-4 w-4"/>PAIR PROVEN</span>}</div>
      {state.loading ? <p className="mt-8 text-sm text-slate-400">Verifying pair evidence…</p> : state.error ? <div className="mt-8 rounded-2xl border border-amber-400/15 bg-amber-400/[.04] p-5"><ShieldAlert className="h-5 w-5 text-amber-300"/><p className="mt-2 text-sm font-bold">{state.error}</p><p className="mt-1 text-xs text-slate-500">No synthetic pair or reserve values are substituted.</p></div> : <>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Router" value={d.router} mono/><Field label="Factory" value={d.factory} mono/><Field label="Pair" value={d.pair || 'NO_PAIR'} mono/><Field label="Observed head" value={d.head ? Number.parseInt(d.head,16).toLocaleString('en-US') : null}/><Field label="Token 0" value={d.token0} mono/><Field label="Token 1" value={d.token1} mono/><Field label="Reserve 0 · raw" value={d.reserve0} mono/><Field label="Reserve 1 · raw" value={d.reserve1} mono/></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[.035] p-4"><p className="flex items-center gap-2 text-xs font-black text-cyan-300"><Database className="h-4 w-4"/>Provenance</p><p className="mt-3 text-xs leading-6 text-slate-400">First-party JSON-RPC<br/>Chain {d.chainId}<br/>Observation {short(d.observationId)}</p></div><div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[.035] p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-300"><Waves className="h-4 w-4"/>Liquidity state</p><p className="mt-3 text-xs leading-6 text-slate-400">Pool {d.poolEvidence}<br/>Liquidity {d.liquidityEvidence}<br/>Reserves {reservesProven ? 'PROVEN NON-ZERO' : 'NOT PROVEN NON-ZERO'}</p></div><div className="rounded-2xl border border-amber-400/10 bg-amber-400/[.035] p-4"><p className="text-xs font-black text-amber-300">Execution Gate</p><p className="mt-3 text-xs leading-6 text-slate-400">Swap execution: {d.executionEnabled ? 'ENABLED' : 'DISABLED'}<br/>This passport never signs, approves, creates pairs, or moves liquidity.</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2">{d.pair && <a href={`https://explorer.kriptoaman.com/address/${d.pair}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200">Pair Explorer <ExternalLink className="h-3.5 w-3.5"/></a>}<a href={`https://explorer.kriptoaman.com/address/${d.factory}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-slate-300">Factory Explorer <ExternalLink className="h-3.5 w-3.5"/></a></div>
      </>}
    </section>
    <p className="mt-4 text-center text-[10px] leading-5 text-slate-600">Pair Passport reports observable contract and reserve evidence. It is not a valuation, safety score, liquidity guarantee, or trade recommendation.</p>
  </div></main>;
}