import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Binary, Boxes, CheckCircle2, Clock3, Database,
  ExternalLink, Fingerprint, Radar, RefreshCw, Search, ShieldCheck, Waves,
} from 'lucide-react';

const ENDPOINT = 'https://rpc.kriptoaman.com/qoryvex/v1/discovery';
const EXPLORER = 'https://explorer.kriptoaman.com';

function short(value, head = 8, tail = 6) {
  const text = String(value || '');
  return text.length > head + tail + 3 ? `${text.slice(0, head)}…${text.slice(-tail)}` : text || '—';
}

function formatMs(value) {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString()} ms` : '—';
}

function formatSupply(raw, decimals) {
  if (typeof raw !== 'string' || !/^0x[0-9a-f]+$/i.test(raw) || !Number.isInteger(decimals)) return '—';
  try {
    const digits = BigInt(raw).toString(10);
    if (decimals === 0) return digits;
    const padded = digits.padStart(decimals + 1, '0');
    const whole = padded.slice(0, -decimals);
    const fraction = padded.slice(-decimals).slice(0, 6).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
  } catch {
    return '—';
  }
}

function statusStyle(status) {
  if (status === 'confirmed') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300';
  if (status === 'reorged') return 'border-rose-400/25 bg-rose-400/10 text-rose-300';
  return 'border-amber-400/25 bg-amber-400/10 text-amber-300';
}

function EventCard({ event }) {
  const passport = event?.discovery?.passport;
  const dna = event?.discovery?.launchDNA;
  const verified = event?.discovery?.kind === 'NEW_TOKEN';
  const confirmations = dna?.fingerprint?.confirmations;
  const address = passport?.address || event?.contractAddress;
  const state = passport?.provenance?.confirmationState || event?.confirmationState || 'observed';

  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 open:border-sky-400/25 open:bg-sky-400/[0.045]">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${verified ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300' : 'border-slate-500/25 bg-slate-500/10 text-slate-300'}`}>
                {verified ? 'NEW TOKEN' : 'NEW CONTRACT'}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyle(state)}`}>{state}</span>
              {verified && <span className="text-xs font-bold text-white">{passport?.name} · {passport?.symbol}</span>}
            </div>
            <p className="mt-2 truncate font-mono text-xs text-slate-300">{address || 'Contract address unavailable'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right sm:flex sm:gap-5">
            <div><p className="text-[9px] uppercase tracking-widest text-slate-500">Block</p><p className="mt-1 text-sm font-bold text-white">{event?.blockNumber?.toLocaleString?.() || '—'}</p></div>
            <div><p className="text-[9px] uppercase tracking-widest text-slate-500">Confirmations</p><p className="mt-1 text-sm font-bold text-white">{Number.isInteger(confirmations) ? confirmations : '—'}</p></div>
          </div>
        </div>
      </summary>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 lg:grid-cols-2">
        <section className="rounded-xl border border-sky-400/15 bg-slate-950/50 p-4">
          <div className="flex items-center gap-2 text-sky-300"><Fingerprint size={16}/><h3 className="text-sm font-black">Asset Passport</h3></div>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
            <dt className="text-slate-500">Classification</dt><dd className="text-slate-200">{passport?.classification || 'unclassified-contract'}</dd>
            <dt className="text-slate-500">Standard</dt><dd className="text-slate-200">{passport?.tokenStandard || 'Not proven'}</dd>
            <dt className="text-slate-500">Creator</dt><dd className="break-all font-mono text-slate-300">{passport?.provenance?.creator || '—'}</dd>
            <dt className="text-slate-500">Creation tx</dt><dd className="break-all font-mono text-slate-300">{passport?.provenance?.txHash || '—'}</dd>
            {verified && <>
              <dt className="text-slate-500">Decimals</dt><dd className="text-slate-200">{passport?.decimals}</dd>
              <dt className="text-slate-500">Total supply</dt><dd className="break-all text-slate-200">{formatSupply(passport?.totalSupplyRaw, passport?.decimals)} {passport?.symbol}</dd>
            </>}
          </dl>
        </section>

        <section className="rounded-xl border border-amber-400/15 bg-slate-950/50 p-4">
          <div className="flex items-center gap-2 text-amber-300"><Binary size={16}/><h3 className="text-sm font-black">Launch DNA</h3></div>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
            <dt className="text-slate-500">Bytecode</dt><dd className="text-slate-200">{Number.isInteger(dna?.fingerprint?.bytecodeBytes) ? `${dna.fingerprint.bytecodeBytes.toLocaleString()} bytes` : '—'}</dd>
            <dt className="text-slate-500">Metadata proof</dt><dd className={dna?.fingerprint?.metadataProven ? 'text-emerald-300' : 'text-amber-300'}>{dna?.fingerprint?.metadataProven ? 'Proven' : 'Not proven'}</dd>
            <dt className="text-slate-500">Labels</dt><dd className="text-slate-200">{dna?.labels?.join(' · ') || '—'}</dd>
            <dt className="text-slate-500">Observed</dt><dd className="text-slate-200">{event?.observedAt ? new Date(event.observedAt).toLocaleString() : '—'}</dd>
          </dl>
          <p className="mt-3 text-[10px] leading-5 text-slate-500">{dna?.disclaimer || 'Technical fingerprint only; not an audit or investment recommendation.'}</p>
        </section>
      </div>

      {address && <a href={`${EXPLORER}/address/${address}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-sky-200">Verify on ZEVARYQ Explorer <ExternalLink size={13}/></a>}
    </details>
  );
}

export default function QoryVExDiscovery() {
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    let controller = new AbortController();

    const load = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const response = await fetch(ENDPOINT, { cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } });
        const payload = await response.json().catch(() => null);
        if (!alive) return;
        const valid = payload && Number(payload.chainId) === 22028 && payload.chainIdHex === '0x560c' && Array.isArray(payload.events);
        if (!valid) throw new Error('Invalid first-party discovery payload');
        setData(payload);
        setPhase(response.ok && payload.status === 'live' ? 'live' : 'degraded');
        setError('');
      } catch (err) {
        if (!alive || err?.name === 'AbortError') return;
        setPhase('unavailable');
        setError(err?.message || 'Discovery stream unavailable');
      }
    };

    load();
    const timer = setInterval(load, 4000);
    return () => { alive = false; clearInterval(timer); controller.abort(); };
  }, [refreshKey]);

  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.events || []).filter(event => {
      const kind = event?.discovery?.kind;
      const state = event?.confirmationState;
      if (filter === 'token' && kind !== 'NEW_TOKEN') return false;
      if (filter === 'contract' && kind === 'NEW_TOKEN') return false;
      if (filter === 'reorg' && state !== 'reorged') return false;
      if (!q) return true;
      const p = event?.discovery?.passport || {};
      return [p.address, p.name, p.symbol, p.provenance?.creator, p.provenance?.txHash]
        .some(value => String(value || '').toLowerCase().includes(q));
    });
  }, [data, filter, query]);

  const verifiedCount = (data?.events || []).filter(event => event?.discovery?.kind === 'NEW_TOKEN').length;
  const reorgCount = (data?.events || []).filter(event => event?.confirmationState === 'reorged').length;

  return (
    <main className="min-h-screen bg-[#030815] px-3 pb-28 pt-4 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="relative overflow-hidden rounded-[30px] border border-cyan-400/20 bg-gradient-to-br from-[#08295a]/80 via-[#061426] to-[#020611] p-5 shadow-[0_35px_100px_rgba(0,0,0,.35)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{backgroundImage:'radial-gradient(circle at 85% 15%,rgba(34,211,238,.22),transparent 25%),linear-gradient(rgba(56,189,248,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.035) 1px,transparent 1px)',backgroundSize:'auto,30px 30px,30px 30px'}}/>
          <div className="relative grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-cyan-300"><Radar size={19}/><p className="text-[10px] font-black tracking-[.2em]">QORYVEX · FIRST-PARTY ON-CHAIN DISCOVERY</p></div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">New Token Radar</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Contract creation → ERC-20 proof → Asset Passport → Launch DNA. Data originates from the ZEVARYQ first-party WebSocket/JSON-RPC indexer; unproven contracts remain explicitly unclassified.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold ${phase === 'live' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : phase === 'unavailable' ? 'border-rose-400/25 bg-rose-400/10 text-rose-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}`}>
                  <Waves size={12}/>{phase === 'live' ? 'LIVE WEBSOCKET SOURCE' : phase === 'loading' ? 'CONNECTING' : phase.toUpperCase()}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-300">Chain ID 22028 · 0x560c</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-300">UI refresh 4s</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                [Boxes, 'Head', data?.head?.number?.toLocaleString?.() || '—'],
                [Clock3, 'P50 latency', formatMs(data?.latency?.p50Ms)],
                [Activity, 'P95 latency', formatMs(data?.latency?.p95Ms)],
                [Database, 'Events', (data?.events?.length || 0).toLocaleString()],
              ].map(([Icon,label,value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-3"><Icon size={15} className="text-cyan-300"/><p className="mt-2 text-lg font-black">{value}</p><p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p></div>)}
            </div>
          </div>
        </header>

        {phase === 'unavailable' && <div role="alert" className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"><AlertTriangle className="mt-0.5 shrink-0" size={17}/><div><p className="font-bold">First-party discovery unavailable</p><p className="mt-1 text-xs text-rose-200/75">{error || 'No live payload is currently available. No synthetic fallback data is shown.'}</p></div></div>}

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4"><CheckCircle2 size={17} className="text-cyan-300"/><p className="mt-2 text-2xl font-black">{verifiedCount}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Verified token records</p></div>
          <div className="rounded-2xl border border-sky-400/15 bg-sky-400/[0.04] p-4"><Fingerprint size={17} className="text-sky-300"/><p className="mt-2 text-2xl font-black">{(data?.events?.length || 0) - verifiedCount}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Unclassified contracts</p></div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4"><ShieldCheck size={17} className="text-amber-300"/><p className="mt-2 text-2xl font-black">{reorgCount}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Reorg-marked records</p></div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search token, contract, creator or transaction…" className="h-11 w-full rounded-xl border border-white/10 bg-black/25 pl-10 pr-3 text-sm outline-none focus:border-cyan-400/40"/></div>
            <div className="flex flex-wrap gap-2">
              {[['all','All'],['token','Verified tokens'],['contract','Contracts'],['reorg','Reorged']].map(([key,label]) => <button key={key} onClick={()=>setFilter(key)} className={`min-h-10 rounded-xl border px-3 text-xs font-bold ${filter===key?'border-cyan-400/35 bg-cyan-400/10 text-cyan-200':'border-white/10 bg-white/[0.03] text-slate-400'}`}>{label}</button>)}
              <button onClick={()=>setRefreshKey(x=>x+1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-slate-300"><RefreshCw size={14}/>Refresh</button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {events.length ? events.map(event => <EventCard key={event?.txHash || `${event?.blockNumber}-${event?.contractAddress}`} event={event}/>) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <Radar className="mx-auto text-slate-600" size={28}/>
                <p className="mt-3 text-sm font-bold text-slate-300">{phase === 'live' ? 'No matching discovery events in the retained window.' : 'Waiting for verified first-party data.'}</p>
                <p className="mt-1 text-xs text-slate-500">QoryVEx does not fabricate token listings when the source is unavailable or evidence is incomplete.</p>
              </div>
            )}
          </div>
        </section>

        <footer className="rounded-2xl border border-white/10 p-4 text-[11px] leading-6 text-slate-500">
          Asset Passport and Launch DNA describe observable technical evidence only. They do not establish audit status, ownership legitimacy, liquidity, exchange listing, market value, safety, or expected returns.
          {data?.publishedAt ? <span className="ml-2 text-slate-400">Published {new Date(data.publishedAt).toLocaleString()} · source {short(data?.source?.ownership)}.</span> : null}
        </footer>
      </div>
    </main>
  );
}
