import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Database, GitBranch, Radar, Search, ShieldCheck } from 'lucide-react';

const unavailable = 'UNAVAILABLE';
const short = value => typeof value === 'string' && value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value || '—';
const typePos = { CHAIN:[50,50], WALLET:[15,28], TRANSACTION:[34,18], CONTRACT:[72,20], TOKEN:[86,48], POOL:[68,80], DEX:[28,82] };

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
  const graphDots = useMemo(() => [...provenTypes].map(type => ({ type, pos: typePos[type], ids: nodes.filter(n => n?.type === type).map(n => n?.id).filter(Boolean) })).filter(item => item.pos), [provenTypes, nodes]);
  const graphLines = useMemo(() => edges.map((edge, index) => {
    const from = graphDots.find(dot => dot.ids.includes(edge?.from));
    const to = graphDots.find(dot => dot.ids.includes(edge?.to));
    return from && to ? { key: `${edge.from}:${edge.to}:${edge.type || index}`, from, to } : null;
  }).filter(Boolean), [edges, graphDots]);
  const route = () => {
    const value = query.trim();
    if (!value) return;
    if (/^0x[a-fA-F0-9]{64}$/.test(value)) window.location.assign(`https://explorer.kriptoaman.com/tx/${value}`);
    else if (/^0x[a-fA-F0-9]{40}$/.test(value)) window.location.assign(`/asset-passport/${value}`);
    else if (/^\\d+$/.test(value)) window.location.assign(`https://explorer.kriptoaman.com/block/${value}`);
  };

  return (
    <section className="ka-intel-shell px-4 sm:px-6 py-10" aria-label="Public Chain Intelligence">
      <div className="max-w-[1440px] mx-auto">
        <div className="ka-intel-command p-5 sm:p-7">
          <div className="ka-intel-grid-bg" aria-hidden="true" />
          <div className="relative z-[1] flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-[10px] font-black tracking-[0.18em] ka-cyan">KRIPTOAMAN · CHAIN INTELLIGENCE OS</p><h2 className="ka-sec-title mt-2 text-2xl sm:text-3xl">See what happened. Understand what it means. Verify it on-chain.</h2><p className="ka-text2 mt-2 max-w-3xl text-sm">Public first-party intelligence. Every illuminated signal below is bound to production evidence.</p></div>
            <span className={graph ? 'ka-intel-live' : 'ka-intel-unavailable'}><i />{graph ? 'FIRST-PARTY LIVE' : unavailable}</span>
          </div>
          <div className="relative z-[1] mt-6 flex gap-2"><div className="ka-intel-search flex min-w-0 flex-1 items-center gap-2 px-4"><Search className="h-4 w-4 ka-blue" /><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && route()} placeholder="Search wallet, contract, tx hash, or block…" className="w-full bg-transparent py-3 text-sm ka-text outline-none" aria-label="Universal Intelligence Search" /></div><button type="button" onClick={route} className="ka-intel-verify px-4 text-sm font-black">Verify</button></div>
          <div className="relative z-[1] mt-5 ka-intel-orbit-stage" aria-label="Live evidence network visualization">
            <div className="ka-orbit-copy">
              <p>GLOBAL EVIDENCE NETWORK</p>
              <h3>Live signals. Proven relationships.</h3>
              <span>Visual depth is driven only by evidence returned from the production intelligence APIs.</span>
            </div>
            <div className="ka-network-globe" aria-hidden="true">
              <i className="ka-globe-shell" />
              <i className="ka-globe-lat lat-a" /><i className="ka-globe-lat lat-b" />
              <i className="ka-globe-lon lon-a" /><i className="ka-globe-lon lon-b" />
              <i className="ka-globe-orbit orbit-a" /><i className="ka-globe-orbit orbit-b" />
              <b className="ka-globe-core">KA</b>
              {graphDots.map((item) => <span key={`orb-${item.type}`} style={{ left: item.pos[0] + '%', top: item.pos[1] + '%' }} title={item.type}>{item.type.slice(0, 2)}</span>)}
            </div>
            <div className="ka-orbit-telemetry">
              <div><span>VERIFIED HEAD</span><b>{Number.isFinite(Number(head)) ? Number(head).toLocaleString('id-ID') : '—'}</b></div>
              <div><span>PROVEN NODES</span><b>{nodes.length || '—'}</b></div>
              <div><span>PROVEN EDGES</span><b>{edges.length || '—'}</b></div>
              <div><span>RECENT CREATIONS</span><b>{recent.length || '—'}</b></div>
            </div>
          </div>
          <div className="relative z-[1] mt-5 grid gap-3 lg:grid-cols-3">
            <article className="ka-intel-engine"><div className="flex items-center justify-between"><Activity className="h-5 w-5 ka-blue" /><span className={head ? 'ka-intel-mini-live' : 'ka-intel-mini-idle'}>{head ? 'LIVE' : unavailable}</span></div><p className="mt-4 text-[10px] font-black tracking-[.16em] ka-text2">CHAIN PULSE</p><p className="mt-2 text-3xl font-black ka-text">{Number.isFinite(Number(head)) ? Number(head).toLocaleString('id-ID') : '—'}</p><div className="ka-pulse-bars mt-4" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div><p className="mt-3 text-[11px] ka-text2">Latest verified ZEVARYQ block · Chain 22028 · signal visualization</p></article>
            <article className="ka-intel-engine"><div className="flex items-center justify-between"><Radar className="h-5 w-5 ka-blue" /><span className={discovery ? 'ka-intel-mini-scan' : 'ka-intel-mini-idle'}>{discovery ? 'SCANNING' : unavailable}</span></div><p className="mt-4 text-[10px] font-black tracking-[.16em] ka-text2">GENESIS RADAR</p><div className="ka-radar mt-3" aria-label="Observed contract creation radar"><i className="r1"/><i className="r2"/><i className="r3"/><b />{recent.map((item,i)=><span key={item?.txHash||i} style={{transform:`rotate(${i*117+35}deg) translateX(${34+i*12}px)`}} />)}</div><p className="mt-3 text-[11px] ka-text2">{recent.length ? `${recent.length} recent contract creation observation${recent.length===1?'':'s'}` : 'No recent contract creation evidence in the scanned window'}</p></article>
            <article className="ka-intel-engine"><div className="flex items-center justify-between"><GitBranch className="h-5 w-5 ka-gold" /><span className={nodes.length ? 'ka-intel-mini-live' : 'ka-intel-mini-idle'}>{nodes.length ? 'EVIDENCE' : unavailable}</span></div><p className="mt-4 text-[10px] font-black tracking-[.16em] ka-text2">INTELLIGENCE GRAPH</p><div className="ka-graph-map mt-3" aria-label="Evidence-bound graph preview"><svg viewBox="0 0 100 100" role="img" aria-label="Verified relationship map">{graphLines.map(line=><line key={line.key} x1={line.from.pos[0]} y1={line.from.pos[1]} x2={line.to.pos[0]} y2={line.to.pos[1]} />)}</svg>{graphDots.map(item=><span key={item.type} style={{left:item.pos[0]+'%',top:item.pos[1]+'%'}} title={item.type}>{item.type.slice(0,2)}</span>)}</div><p className="mt-3 text-[11px] ka-text2">{nodes.length || '—'} proven nodes · {edges.length || '—'} proven relationships</p></article>
          </div>
          <div className="relative z-[1] mt-3 grid gap-3 lg:grid-cols-[1.4fr_.6fr]"><div className="ka-intel-proof p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 ka-green"/><b className="text-xs ka-text">PROOF ENGINE</b></div><div className="mt-3 grid gap-2 sm:grid-cols-4 text-[10px]"><div><span>BLOCK HASH</span><b>{short(blockHash)}</b></div><div><span>CONTEXT</span><b>ZEVARYQ · 22028</b></div><div><span>INTERPRETATION</span><b>EVIDENCE-GATED</b></div><div><span>SOURCE</span><b>{graph?.provenance?.ownership === 'first-party' || discovery?.provenance?.ownership === 'first-party' ? 'FIRST-PARTY' : unavailable}</b></div></div></div><div className="ka-intel-proof p-4"><div className="flex items-center gap-2"><Database className="h-4 w-4 ka-blue"/><b className="text-xs ka-text">TRUTH POLICY</b></div><p className="mt-3 text-[10px] leading-5 ka-text2">Unavailable is never converted to zero. Unproven relationships remain dark. Transaction submission is disabled.</p></div></div>
          {recent.length > 0 && <div className="relative z-[1] mt-3 ka-intel-proof p-4"><p className="text-xs font-black ka-text">Genesis Radar · latest observed evidence</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{recent.map((item,index)=><a key={item?.txHash||index} href={item?.txHash ? `https://explorer.kriptoaman.com/tx/${item.txHash}` : undefined} className="ka-evidence-chip"><b>CONTRACT CREATION</b><span>{short(item?.txHash)}</span><small>Block {item?.blockNumber ?? '—'}</small></a>)}</div></div>}
        </div>
      </div>
    </section>
  );
}
