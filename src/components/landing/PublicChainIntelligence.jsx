import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Database, ExternalLink, GitBranch, Radar, Search, ShieldCheck, X } from 'lucide-react';

const unavailable = 'UNAVAILABLE';
const short = value => typeof value === 'string' && value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value || '—';
const typePos = { CHAIN:[50,52], BLOCK:[50,14], WALLET:[13,32], TRANSACTION:[31,16], CONTRACT:[72,18], TOKEN:[88,48], POOL:[70,82], DEX:[28,84] };

export default function PublicChainIntelligence() {
  const [graph, setGraph] = useState(null);
  const [discovery, setDiscovery] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [headHistory, setHeadHistory] = useState([]);

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
  useEffect(() => {
    const numericHead = Number(head);
    if (!Number.isSafeInteger(numericHead)) return;
    setHeadHistory(history => {
      if (history.at(-1)?.head === numericHead) return history;
      return [...history, { head: numericHead, observedAt: Date.now() }].slice(-24);
    });
  }, [head]);
  const pulseDelta = headHistory.length > 1 ? headHistory.at(-1).head - headHistory.at(-2).head : null;
  const pulsePoints = useMemo(() => {
    if (headHistory.length < 2) return '';
    const values = headHistory.map(item => item.head);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);
    return headHistory.map((item, index) => `${(index / (headHistory.length - 1)) * 100},${92 - ((item.head - min) / span) * 78}`).join(' ');
  }, [headHistory]);
  const provenTypes = useMemo(() => new Set(nodes.map(n => n?.type).filter(Boolean)), [nodes]);
  const graphDots = useMemo(() => [...provenTypes].map(type => ({ type, pos: typePos[type], ids: nodes.filter(n => n?.type === type).map(n => n?.id).filter(Boolean) })).filter(item => item.pos), [provenTypes, nodes]);
  const graphLines = useMemo(() => edges.map((edge, index) => {
    const from = graphDots.find(dot => dot.ids.includes(edge?.from));
    const to = graphDots.find(dot => dot.ids.includes(edge?.to));
    return from && to ? { key: `${edge.from}:${edge.to}:${edge.type || index}`, from, to, edge } : null;
  }).filter(Boolean), [edges, graphDots]);
  const liveEvents = useMemo(() => nodes
    .filter(node => ['TRANSACTION', 'CONTRACT', 'TOKEN'].includes(node?.type))
    .filter(node => node?.evidence?.source === 'first-party')
    .filter(node => Number.isSafeInteger(Number(node?.evidence?.blockNumber)) && /^0x[a-fA-F0-9]{64}$/.test(node?.evidence?.blockHash || '') && /^0x[a-fA-F0-9]{64}$/.test(node?.evidence?.transactionHash || ''))
    .map(node => ({ ...node, blockNumber: Number(node.evidence.blockNumber) }))
    .sort((a, b) => b.blockNumber - a.blockNumber)
    .filter((node, index, list) => list.findIndex(item => `${item.type}:${item.evidence.transactionHash}:${item.id}` === `${node.type}:${node.evidence.transactionHash}:${node.id}`) === index)
    .slice(0, 6), [nodes]);

  const selectNode = item => {
    const nodeEvidence = nodes.find(n => item.ids.includes(n?.id));
    if (nodeEvidence) setSelectedEvidence({ kind: 'NODE', ...nodeEvidence });
  };
  const selectEdge = line => setSelectedEvidence({ kind: 'RELATIONSHIP', ...line.edge });
  const evidenceLink = selectedEvidence?.type === 'TRANSACTION' && selectedEvidence?.label ? `https://explorer.kriptoaman.com/tx/${selectedEvidence.label}`
    : selectedEvidence?.type === 'BLOCK' && selectedEvidence?.evidence?.blockNumber != null ? `https://explorer.kriptoaman.com/block/${selectedEvidence.evidence.blockNumber}`
    : selectedEvidence?.type === 'CONTRACT' && selectedEvidence?.label ? `/asset-passport/${selectedEvidence.label}`
    : null;
  const evidence = selectedEvidence?.evidence || {};
  const evidenceObservedAt = evidence?.observedAt ?? null;

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
          <style>{`
            @media (max-width: 639px) {
              .ka-intel-command { padding-left: 14px !important; padding-right: 14px !important; }
              .ka-production-pulse { height: 112px !important; min-height: 112px !important; }
              .ka-intel-engine-graph .ka-graph-map { min-height: 310px !important; height: 310px !important; }
              .ka-intel-engine-pulse { min-height: 0 !important; }
              .ka-intel-engine-graph .ka-graph-node { transform: translate(-50%, -50%) scale(1.32); }
              .ka-intel-orbit-stage { min-height: 0 !important; }
              .ka-evidence-chip { min-height: 48px; }
              [data-install-cta="true"] { bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important; }
              .ka-intel-engine-graph .ka-graph-node { min-width: 58px; min-height: 58px; box-shadow: 0 0 28px rgba(55,145,255,.24); }
              .ka-intel-engine-graph .ka-graph-node small { font-size: 8px; letter-spacing: .08em; }
              .ka-intel-engine-graph .ka-graph-map svg line { stroke-width: 1.7; filter: drop-shadow(0 0 4px rgba(55,145,255,.55)); }
            }
            .ka-production-pulse { height: 168px; min-height: 168px; border: 1px solid var(--ka-border); border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, rgba(35,118,255,.08), rgba(3,14,28,.16)); }
            .ka-production-pulse svg { width: 100%; height: 100%; display: block; }
            .ka-production-pulse polyline { fill: none; stroke: var(--ka-blue); stroke-width: 2; vector-effect: non-scaling-stroke; filter: drop-shadow(0 0 5px rgba(58,145,255,.55)); }
            .ka-production-pulse-empty { height: 100%; display: grid; place-items: center; padding: 16px; text-align: center; font-size: 10px; color: var(--ka-text2); }
            @media (min-width: 1024px) { .ka-intel-engine-graph .ka-graph-map { min-height: 360px; height: 360px; } }
            .ka-intel-engine-graph { background: radial-gradient(circle at 50% 48%, rgba(31,111,255,.10), transparent 42%), var(--ka-card); }
            .ka-graph-map::before { content:''; position:absolute; inset:12%; border:1px solid rgba(64,142,255,.10); border-radius:50%; box-shadow:0 0 55px rgba(43,128,255,.08) inset; pointer-events:none; }
          `}</style>
          <div className="relative z-[1] mt-5 grid gap-3 lg:grid-cols-3">
            <article className="ka-intel-engine ka-intel-engine-pulse"><div className="flex items-center justify-between"><Activity className="h-5 w-5 ka-blue" /><span className={head ? 'ka-intel-mini-live' : 'ka-intel-mini-idle'}>{head ? 'LIVE' : unavailable}</span></div><p className="mt-4 text-[10px] font-black tracking-[.16em] ka-text2">CHAIN PULSE</p><p className="mt-2 text-3xl font-black ka-text">{Number.isFinite(Number(head)) ? Number(head).toLocaleString('id-ID') : '—'}</p><div className="ka-production-pulse mt-4" aria-label="Observed block progression">{pulsePoints ? <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Verified block head progression"><polyline points={pulsePoints} /></svg> : <div className="ka-production-pulse-empty">Collecting verified head observations…</div>}</div><div className="mt-3 flex items-center justify-between gap-3 text-[10px] ka-text2"><span>Chain 22028</span><span>{headHistory.length > 1 ? `${headHistory.length} verified observations · Δ +${Math.max(0, pulseDelta ?? 0)} blocks` : 'Waiting for progression'}</span></div></article>
            <article className="ka-intel-engine"><div className="flex items-center justify-between"><Radar className="h-5 w-5 ka-blue" /><span className={discovery ? 'ka-intel-mini-scan' : 'ka-intel-mini-idle'}>{discovery ? 'SCANNING' : unavailable}</span></div><p className="mt-4 text-[10px] font-black tracking-[.16em] ka-text2">GENESIS RADAR</p><div className="ka-radar mt-3" aria-label="Observed contract creation radar"><i className="r1"/><i className="r2"/><i className="r3"/><b />{recent.map((item,i)=><span key={item?.txHash||i} style={{transform:`rotate(${i*117+35}deg) translateX(${34+i*12}px)`}} />)}</div><p className="mt-3 text-[11px] ka-text2">{recent.length ? `${recent.length} recent contract creation observation${recent.length===1?'':'s'}` : 'No recent contract creation evidence in the scanned window'}</p></article>
            <article className="ka-intel-engine ka-intel-engine-graph"><div className="flex items-center justify-between"><GitBranch className="h-5 w-5 ka-gold" /><span className={nodes.length ? 'ka-intel-mini-live' : 'ka-intel-mini-idle'}>{nodes.length ? 'EVIDENCE' : unavailable}</span></div><p className="mt-4 text-[10px] font-black tracking-[.16em] ka-text2">INTELLIGENCE GRAPH</p><div className="ka-graph-map mt-3" aria-label="Evidence-bound graph preview"><svg viewBox="0 0 100 100" role="img" aria-label="Verified relationship map">{graphLines.map(line=><line key={line.key} x1={line.from.pos[0]} y1={line.from.pos[1]} x2={line.to.pos[0]} y2={line.to.pos[1]} role="button" tabIndex="0" aria-label={`Inspect ${line.edge?.type || 'verified relationship'} evidence`} onClick={()=>selectEdge(line)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectEdge(line)}}} />)}</svg>{graphDots.map(item=><button type="button" className="ka-graph-node" key={item.type} style={{left:item.pos[0]+'%',top:item.pos[1]+'%'}} title={item.type} aria-label={`Inspect ${item.type} evidence`} onClick={()=>selectNode(item)}><b>{item.type.slice(0,2)}</b><small>{item.type}</small></button>)}</div><p className="mt-3 text-[11px] ka-text2">{nodes.length || '—'} proven nodes · {edges.length || '—'} proven relationships</p></article>
          </div>
          <div className="relative z-[1] mt-3 ka-intel-proof p-4" aria-label="Live Intelligence Stream">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.16em] ka-cyan">LIVE INTELLIGENCE STREAM</p><p className="mt-1 text-[11px] ka-text2">Evidence-backed events derived from the first-party Intelligence Graph.</p></div><span className={liveEvents.length ? 'ka-intel-mini-live' : 'ka-intel-mini-idle'}>{liveEvents.length ? 'EVIDENCE' : unavailable}</span></div>
            {liveEvents.length ? <div className="mt-3 grid gap-2">{liveEvents.map(item => <button type="button" key={`${item.type}:${item.id}:${item.evidence.transactionHash}`} className="ka-evidence-chip text-left" onClick={()=>setSelectedEvidence({ kind: 'NODE', ...item })}><b>{item.type}</b><span>Block {item.blockNumber} · {short(item.evidence.transactionHash)}</span><small>{item.evidence.observedAt ? new Date(item.evidence.observedAt).toLocaleString('id-ID') : unavailable} · Observation {item.evidence.observationId ? short(item.evidence.observationId) : unavailable}</small></button>)}</div> : <p className="mt-3 text-[11px] ka-text2">No API-proven stream evidence is available. No synthetic activity is generated.</p>}
          </div>
          {selectedEvidence && <div className="ka-evidence-drawer relative z-[2] mt-3" role="dialog" aria-modal="false" aria-label="Evidence Drawer">
            <div className="ka-evidence-drawer-head"><div><p>INTELLIGENCE GRAPH 2.0</p><h3>Evidence Drawer · {selectedEvidence.kind}</h3></div><button type="button" onClick={()=>setSelectedEvidence(null)} aria-label="Close Evidence Drawer"><X className="h-4 w-4"/></button></div>
            <div className="ka-evidence-drawer-grid">
              <div><span>TYPE</span><b>{selectedEvidence.type || unavailable}</b></div>
              <div><span>IDENTITY</span><b>{selectedEvidence.label || selectedEvidence.from ? short(selectedEvidence.label || selectedEvidence.from) : unavailable}</b></div>
              <div><span>{selectedEvidence.kind === 'RELATIONSHIP' ? 'TO' : 'BLOCK'}</span><b>{selectedEvidence.kind === 'RELATIONSHIP' ? (selectedEvidence.to ? short(selectedEvidence.to) : unavailable) : (evidence.blockNumber ?? unavailable)}</b></div>
              <div><span>SOURCE</span><b>{evidence.source === 'first-party' || graph?.provenance?.ownership === 'first-party' ? 'FIRST-PARTY' : unavailable}</b></div>
              <div><span>BLOCK HASH</span><b>{evidence.blockHash ? short(evidence.blockHash) : unavailable}</b></div>
              <div><span>TX HASH</span><b>{evidence.transactionHash ? short(evidence.transactionHash) : unavailable}</b></div>
              <div><span>OBSERVED</span><b>{evidenceObservedAt ? new Date(evidenceObservedAt).toLocaleString('id-ID') : unavailable}</b></div>
              <div><span>OBSERVATION ID</span><b>{evidence.observationId ? short(evidence.observationId) : unavailable}</b></div>
            </div>
            <div className="ka-evidence-drawer-foot"><span>Only API-proven evidence is shown. Missing fields remain UNAVAILABLE.</span>{evidenceLink && <a href={evidenceLink}>Verify evidence <ExternalLink className="h-3.5 w-3.5"/></a>}</div>
          </div>}
          <div className="relative z-[1] mt-3 grid gap-3 lg:grid-cols-[1.4fr_.6fr]"><div className="ka-intel-proof p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 ka-green"/><b className="text-xs ka-text">PROOF ENGINE</b></div><div className="mt-3 grid gap-2 sm:grid-cols-4 text-[10px]"><div><span>BLOCK HASH</span><b>{short(blockHash)}</b></div><div><span>CONTEXT</span><b>ZEVARYQ · 22028</b></div><div><span>INTERPRETATION</span><b>EVIDENCE-GATED</b></div><div><span>SOURCE</span><b>{graph?.provenance?.ownership === 'first-party' || discovery?.provenance?.ownership === 'first-party' ? 'FIRST-PARTY' : unavailable}</b></div></div></div><div className="ka-intel-proof p-4"><div className="flex items-center gap-2"><Database className="h-4 w-4 ka-blue"/><b className="text-xs ka-text">TRUTH POLICY</b></div><p className="mt-3 text-[10px] leading-5 ka-text2">Unavailable is never converted to zero. Unproven relationships remain dark. Transaction submission is disabled.</p></div></div>
          {recent.length > 0 && <div className="relative z-[1] mt-3 ka-intel-proof p-4"><p className="text-xs font-black ka-text">Genesis Radar · latest observed evidence</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{recent.map((item,index)=><a key={item?.txHash||index} href={item?.txHash ? `https://explorer.kriptoaman.com/tx/${item.txHash}` : undefined} className="ka-evidence-chip"><b>CONTRACT CREATION</b><span>{short(item?.txHash)}</span><small>Block {item?.blockNumber ?? '—'}</small></a>)}</div></div>}
        </div>
      </div>
    </section>
  );
}
