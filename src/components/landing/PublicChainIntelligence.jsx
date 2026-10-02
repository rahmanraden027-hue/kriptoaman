import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Database, GitBranch, Radar, Search, ShieldCheck } from 'lucide-react';

const unavailable = 'UNAVAILABLE';
const short = value => typeof value === 'string' && value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value || '—';

export default function PublicChainIntelligence() {
  const [graph, setGraph] = useState(null);
  const [discovery, setDiscovery] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const [g, d] = await Promise.allSettled([
        fetch('/api/intelligence-graph', { cache: 'no-store', headers: { Accept: 'application/json' } }),
        fetch('/api/zvq-first-party-discovery', { cache: 'no-store', headers: { Accept: 'application/json' } }),
      ]);
      if (!active) return;
      if (g.status === 'fulfilled') {
        try { const p = await g.value.json(); if (g.value.ok && p?.status === 'live' && Number(p?.chainId) === 22028) setGraph(p); } catch {}
      }
      if (d.status === 'fulfilled') {
        try { const p = await d.value.json(); if (d.value.ok && p?.status === 'live' && Number(p?.chainId) === 22028) setDiscovery(p); } catch {}
      }
    })();
    return () => { active = false; };
  }, []);

  const nodes = Array.isArray(graph?.graph?.nodes) ? graph.graph.nodes : [];
  const edges = Array.isArray(graph?.graph?.edges) ? graph.graph.edges : [];
  const recent = Array.isArray(discovery?.observation?.contractCreations) ? discovery.observation.contractCreations.slice(0, 3) : [];
  const head = graph?.head?.number ?? discovery?.head?.number ?? null;
  const blockHash = graph?.head?.hash ?? discovery?.head?.hash ?? null;
  const provenTypes = useMemo(() => new Set(nodes.map(n => n?.type).filter(Boolean)), [nodes]);
  const route = () => {
    const value = query.trim();
    if (!value) return;
    if (/^0x[a-fA-F0-9]{64}$/.test(value)) window.location.assign(`https://explorer.kriptoaman.com/tx/${value}`);
    else if (/^0x[a-fA-F0-9]{40}$/.test(value)) window.location.assign(`/asset-passport/${value}`);
    else if (/^\\d+$/.test(value)) window.location.assign(`https://explorer.kriptoaman.com/block/${value}`);
  };

  return (
    <section className="px-4 sm:px-6 py-10" aria-label="Public Chain Intelligence">
      <div className="max-w-[1440px] mx-auto">
        <div className="ka-card p-5 sm:p-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[0.18em] ka-cyan">KRIPTOAMAN · CHAIN INTELLIGENCE OS</p>
              <h2 className="ka-sec-title mt-2 text-2xl sm:text-3xl">See what happened. Understand what it means. Verify it on-chain.</h2>
              <p className="ka-text2 mt-2 max-w-3xl text-sm">Live intelligence is public. Sign in or connect a wallet only when you need personalized or wallet actions.</p>
            </div>
            <span className={graph ? 'ka-green text-xs font-black' : 'ka-gold text-xs font-black'}>{graph ? 'FIRST-PARTY LIVE' : unavailable}</span>
          </div>

          <div className="mt-6 flex gap-2">
            <div className="ka-card2 flex min-w-0 flex-1 items-center gap-2 px-4">
              <Search className="h-4 w-4 ka-blue" />
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && route()} placeholder="Search wallet, contract, tx hash, or block…" className="w-full bg-transparent py-3 text-sm ka-text outline-none" aria-label="Universal Intelligence Search" />
            </div>
            <button type="button" onClick={route} className="ka-card2 px-4 text-sm font-black ka-blue">Verify</button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            <article className="ka-card2 p-4"><Activity className="h-4 w-4 ka-blue" /><p className="mt-3 text-[10px] font-black tracking-[.14em] ka-text2">CHAIN PULSE</p><p className="mt-2 text-xl font-black ka-text">{Number.isFinite(Number(head)) ? Number(head).toLocaleString('id-ID') : '—'}</p><p className="mt-1 text-[11px] ka-text2">Latest verified ZEVARYQ block · Chain 22028</p></article>
            <article className="ka-card2 p-4"><Radar className="h-4 w-4 ka-blue" /><p className="mt-3 text-[10px] font-black tracking-[.14em] ka-text2">GENESIS RADAR</p><p className="mt-2 text-xl font-black ka-text">{recent.length || '—'}</p><p className="mt-1 text-[11px] ka-text2">Recent evidence candidates, not endorsements</p></article>
            <article className="ka-card2 p-4"><GitBranch className="h-4 w-4 ka-gold" /><p className="mt-3 text-[10px] font-black tracking-[.14em] ka-text2">INTELLIGENCE GRAPH</p><p className="mt-2 text-xl font-black ka-text">{nodes.length || '—'} / {edges.length || '—'}</p><p className="mt-1 text-[11px] ka-text2">Evidence-bound nodes / relationships</p></article>
            <article className="ka-card2 p-4"><ShieldCheck className="h-4 w-4 ka-green" /><p className="mt-3 text-[10px] font-black tracking-[.14em] ka-text2">PROOF ENGINE</p><p className="mt-2 text-sm font-black ka-text">{short(blockHash)}</p><p className="mt-1 text-[11px] ka-text2">Block hash · first-party evidence</p></article>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="ka-card2 p-4">
              <div className="flex items-center justify-between"><b className="text-xs ka-text">Live graph preview</b><span className="text-[10px] ka-text2">{edges.length ? `${edges.length} proven edges` : unavailable}</span></div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-black">
                {['CHAIN','WALLET','TRANSACTION','CONTRACT','TOKEN','POOL','DEX'].map((type, i) => <React.Fragment key={type}>{i > 0 && <ArrowRight className="h-3 w-3 ka-text2" />}<span className={provenTypes.has(type) ? 'ka-green' : 'ka-text2 opacity-45'}>{type}</span></React.Fragment>)}
              </div>
              <p className="mt-3 text-[10px] leading-5 ka-text2">Only proven nodes light up. Pool/DEX remain unavailable unless first-party registry and pair evidence passes. Trade relationships remain disabled.</p>
            </div>
            <div className="ka-card2 p-4">
              <div className="flex items-center gap-2"><Database className="h-4 w-4 ka-blue" /><b className="text-xs ka-text">Proof trail</b></div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] ka-text2">
                <span>Observation</span><b className="ka-text">{graph?.observedAt || discovery?.observedAt || unavailable}</b>
                <span>Context</span><b className="ka-text">ZEVARYQ · 22028</b>
                <span>Interpretation</span><b className="ka-text">Evidence-gated</b>
                <span>Source</span><b className="ka-text">{graph?.provenance?.ownership === 'first-party' || discovery?.provenance?.ownership === 'first-party' ? 'FIRST-PARTY' : unavailable}</b>
              </div>
            </div>
          </div>

          {recent.length > 0 && <div className="mt-3 ka-card2 p-4"><p className="text-xs font-black ka-text">Genesis Radar · latest observed candidates</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{recent.map((item, index) => <div key={item?.txHash || item?.address || index} className="rounded-xl border p-3 text-[10px] ka-text2" style={{borderColor:'var(--ka-border)'}}><b className="ka-text">{item?.type || 'OBSERVED'}</b><p className="mt-1">{short(item?.address || item?.contractAddress || item?.txHash)}</p><p className="mt-1">Block {item?.blockNumber ?? '—'}</p></div>)}</div></div>}
        </div>
      </div>
    </section>
  );
}
