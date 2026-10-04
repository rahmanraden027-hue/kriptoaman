import React, { useMemo } from 'react';
import { Activity, Database, Radio, ShieldCheck } from 'lucide-react';

const NODES = [
  { id: 'N01', x: 50, y: 13, r: 3.2 },
  { id: 'N02', x: 72, y: 20, r: 2.6 },
  { id: 'N03', x: 86, y: 36, r: 3.1 },
  { id: 'N04', x: 84, y: 62, r: 2.7 },
  { id: 'N05', x: 68, y: 78, r: 3.2 },
  { id: 'N06', x: 50, y: 84, r: 2.8 },
  { id: 'N07', x: 30, y: 78, r: 3.1 },
  { id: 'N08', x: 15, y: 62, r: 2.7 },
  { id: 'N09', x: 13, y: 38, r: 3.2 },
  { id: 'N10', x: 27, y: 21, r: 2.8 },
  { id: 'N11', x: 38, y: 34, r: 2.5 },
  { id: 'N12', x: 63, y: 53, r: 2.5 },
];

const LINKS = [
  ['N01', 'N03'], ['N01', 'N10'], ['N02', 'N04'], ['N03', 'N05'],
  ['N04', 'N06'], ['N05', 'N07'], ['N06', 'N08'], ['N07', 'N09'],
  ['N08', 'N10'], ['N09', 'N11'], ['N10', 'N12'], ['N11', 'N02'],
  ['N11', 'N12'], ['N12', 'N05'], ['N12', 'N01'], ['N11', 'N07'],
];

const lookup = Object.fromEntries(NODES.map((node) => [node.id, node]));

const fmtNumber = (value) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US')
  : '—';

const shortHash = (value) => typeof value === 'string' && value.length > 18
  ? `${value.slice(0, 10)}…${value.slice(-8)}`
  : '—';

export default function NodePropagation3D({
  head,
  blockHash,
  advanceKey,
  live,
  indexerLag,
  indexedHead,
  checkedAt,
}) {
  const indexed = Number.isFinite(Number(indexerLag)) && Number(indexerLag) === 0;
  const hasHead = Number.isSafeInteger(Number(head));
  const pulseKey = hasHead ? `${Number(head)}-${advanceKey || 'idle'}` : 'idle';

  const state = useMemo(() => {
    if (!live || !hasHead) return { label: 'PAUSED', tone: 'amber' };
    if (indexed) return { label: 'INDEXED', tone: 'emerald' };
    return { label: 'CHAIN LIVE · INDEXER CATCHING UP', tone: 'cyan' };
  }, [live, hasHead, indexed]);

  const statusClass = state.tone === 'emerald'
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    : state.tone === 'cyan'
      ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
      : 'border-amber-400/20 bg-amber-400/10 text-amber-300';

  return (
    <section className="zvq-node-propagation mt-4 overflow-hidden rounded-[26px] border border-sky-400/12 bg-[#04101b]/86 p-4 sm:p-5">
      <style>{`
        .zvq-node-stage{position:relative;min-height:330px;overflow:hidden;border-radius:24px;border:1px solid rgba(56,189,248,.1);background:
          radial-gradient(circle at 50% 46%,rgba(14,165,233,.18),transparent 26%),
          radial-gradient(circle at 50% 48%,rgba(245,158,11,.07),transparent 42%),
          linear-gradient(180deg,rgba(2,8,23,.72),rgba(2,6,18,.98));}
        .zvq-node-stage::before{content:'';position:absolute;inset:0;background-image:
          radial-gradient(circle at 15% 20%,rgba(255,255,255,.5) 0 1px,transparent 1.4px),
          radial-gradient(circle at 70% 18%,rgba(125,211,252,.4) 0 1px,transparent 1.4px),
          radial-gradient(circle at 80% 72%,rgba(250,204,21,.38) 0 1px,transparent 1.4px),
          radial-gradient(circle at 24% 78%,rgba(255,255,255,.36) 0 1px,transparent 1.4px);
          background-size:120px 120px,160px 160px,190px 190px,140px 140px;opacity:.55;pointer-events:none}
        .zvq-globe-shell{position:absolute;left:50%;top:50%;width:min(60vw,300px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(56,189,248,.3);background:
          radial-gradient(circle at 38% 32%,rgba(125,211,252,.34),rgba(14,116,144,.15) 26%,rgba(2,6,23,.88) 68%),
          linear-gradient(135deg,rgba(56,189,248,.1),rgba(245,158,11,.07));box-shadow:
          inset 0 0 54px rgba(34,211,238,.14),0 0 48px rgba(14,165,233,.16);transform-style:preserve-3d}
        .zvq-globe-shell::before,.zvq-globe-shell::after{content:'';position:absolute;inset:9%;border-radius:50%;border:1px solid rgba(56,189,248,.15)}
        .zvq-globe-shell::before{transform:rotateX(67deg)}
        .zvq-globe-shell::after{transform:rotateY(67deg)}
        .zvq-node-orbit{position:absolute;left:50%;top:50%;width:min(78vw,430px);height:min(34vw,160px);transform:translate(-50%,-50%) rotate(-12deg);border:1px solid rgba(245,158,11,.18);border-radius:50%;box-shadow:0 0 24px rgba(245,158,11,.06)}
        .zvq-node-orbit.second{transform:translate(-50%,-50%) rotate(28deg);border-color:rgba(56,189,248,.17)}
        .zvq-node-svg{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 0 7px rgba(56,189,248,.18))}
        .zvq-link{stroke:rgba(56,189,248,.2);stroke-width:.42;vector-effect:non-scaling-stroke}
        .zvq-link.pulse{stroke:rgba(103,232,249,.72);stroke-width:.62;stroke-dasharray:2.4 4.8;animation:zvqLinkPulse 1.75s linear 1}
        .zvq-node-dot{fill:#071827;stroke:rgba(125,211,252,.7);stroke-width:.55}
        .zvq-node-dot.pulse{fill:rgba(34,211,238,.9);stroke:#d9f9ff;animation:zvqNodePulse 1.7s ease-out 1}
        .zvq-node-core{position:absolute;left:50%;top:50%;width:82px;height:82px;transform:translate(-50%,-50%);border-radius:24px;border:1px solid rgba(250,204,21,.35);background:linear-gradient(145deg,rgba(245,158,11,.16),rgba(14,165,233,.14));box-shadow:0 0 36px rgba(34,211,238,.16),inset 0 0 24px rgba(245,158,11,.08);display:grid;place-items:center}
        .zvq-node-core::before{content:'';position:absolute;inset:12px;border:1px solid rgba(103,232,249,.25);transform:rotate(45deg)}
        .zvq-node-wave{position:absolute;left:50%;top:50%;width:110px;height:110px;border-radius:50%;border:1px solid rgba(103,232,249,.32);transform:translate(-50%,-50%);opacity:0}
        .zvq-node-wave.is-pulse{animation:zvqWave 1.8s ease-out 1}
        .zvq-node-index{position:absolute;right:4%;top:8%;max-width:180px;border:1px solid rgba(16,185,129,.16);background:rgba(2,12,20,.78);border-radius:16px;padding:10px 12px;backdrop-filter:blur(12px)}
        .zvq-node-rpc{position:absolute;left:4%;bottom:8%;max-width:180px;border:1px solid rgba(56,189,248,.16);background:rgba(2,12,20,.78);border-radius:16px;padding:10px 12px;backdrop-filter:blur(12px)}
        @keyframes zvqLinkPulse{0%{stroke-dashoffset:18;opacity:.1}35%{opacity:1}100%{stroke-dashoffset:0;opacity:.22}}
        @keyframes zvqNodePulse{0%{r:2;opacity:.25}35%{opacity:1}70%{r:4.4}100%{opacity:.7}}
        @keyframes zvqWave{0%{transform:translate(-50%,-50%) scale(.5);opacity:.9}100%{transform:translate(-50%,-50%) scale(2.9);opacity:0}}
        @media(max-width:639px){.zvq-node-stage{min-height:290px}.zvq-node-index{right:3%;top:4%;max-width:138px;padding:8px 9px}.zvq-node-rpc{left:3%;bottom:4%;max-width:145px;padding:8px 9px}.zvq-node-core{width:66px;height:66px}.zvq-node-wave{width:86px;height:86px}}
        @media(prefers-reduced-motion:reduce){.zvq-link.pulse,.zvq-node-dot.pulse,.zvq-node-wave.is-pulse{animation:none!important}}
      `}</style>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-300">NODE MASTER 3D · EVIDENCE-LINKED VISUALIZATION</p>
            <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] ${statusClass}`}>{state.label}</span>
          </div>
          <h3 className="mt-1 text-lg font-black sm:text-xl">Block Event → Node Pulse → Explorer Index</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-slate-500">
            Node positions and propagation paths are illustrative. The pulse begins only when a verified ZEVARYQ block head advances; peer-to-peer hop timing and physical node location are not claimed or measured.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
        <div className="zvq-node-stage">
          <div className="zvq-node-orbit" />
          <div className="zvq-node-orbit second" />
          <div className="zvq-globe-shell" />

          <svg className="zvq-node-svg" viewBox="0 0 100 100" aria-label="Illustrative ZEVARYQ node propagation visualization">
            {LINKS.map(([fromId, toId], index) => {
              const from = lookup[fromId];
              const to = lookup[toId];
              return (
                <line
                  key={`${fromId}-${toId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={`zvq-link ${live && advanceKey ? 'pulse' : ''}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                />
              );
            })}
            {NODES.map((node, index) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  className={`zvq-node-dot ${live && advanceKey ? 'pulse' : ''}`}
                  style={{ animationDelay: `${110 + index * 65}ms` }}
                />
                <text x={node.x + 2.3} y={node.y - 2.1} fill="rgba(148,163,184,.72)" fontSize="2.4" fontWeight="700">{node.id}</text>
              </g>
            ))}
          </svg>

          <div key={pulseKey} className={`zvq-node-wave ${live && advanceKey ? 'is-pulse' : ''}`} />
          <div className="zvq-node-core">
            <div className="relative z-10 text-center">
              <div className="text-[8px] font-black tracking-[.14em] text-amber-200">ZVQ</div>
              <div className="mt-1 text-[10px] font-black text-white">{hasHead ? `#${fmtNumber(head)}` : 'WAIT'}</div>
            </div>
          </div>

          <div className="zvq-node-index">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.12em] text-emerald-300">
              <Database className="h-3.5 w-3.5" /> Explorer Evidence
            </div>
            <div className="mt-2 text-sm font-black text-white">{indexed ? 'INDEXED' : live ? 'CATCHING UP' : 'UNAVAILABLE'}</div>
            <div className="mt-1 text-[8px] leading-4 text-slate-500">
              {Number.isFinite(Number(indexedHead)) ? `Explorer #${fmtNumber(indexedHead)}` : 'No indexed height evidence'}
            </div>
          </div>

          <div className="zvq-node-rpc">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.12em] text-cyan-300">
              <Radio className="h-3.5 w-3.5" /> RPC Event
            </div>
            <div className="mt-2 text-sm font-black text-white">{hasHead ? `#${fmtNumber(head)}` : '—'}</div>
            <div className="mt-1 text-[8px] leading-4 text-slate-500">{shortHash(blockHash)}</div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[.035] p-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.12em] text-cyan-300"><Activity className="h-4 w-4" /> Event Trigger</div>
            <div className="mt-3 text-lg font-black">{live && hasHead ? 'VERIFIED HEAD' : 'PAUSED'}</div>
            <p className="mt-1 text-[9px] leading-4 text-slate-500">Visual pulse is gated by a real increase in ZEVARYQ chain head.</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[.035] p-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.12em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Evidence State</div>
            <div className="mt-3 text-lg font-black">{indexed ? 'RPC + EXPLORER' : live ? 'RPC VERIFIED' : 'UNAVAILABLE'}</div>
            <p className="mt-1 text-[9px] leading-4 text-slate-500">
              {indexed ? 'Explorer height has caught up to the observed head.' : live ? `Indexer lag: ${fmtNumber(indexerLag)} block(s).` : 'No live evidence is being promoted.'}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[.035] p-4 sm:col-span-2 lg:col-span-1">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-violet-300">Truth Boundary</div>
            <p className="mt-2 text-[9px] leading-5 text-slate-500">No claim of measured peer propagation, physical node geography, validator receipt order, or satellite telemetry. This layer visualizes a verified block event and its indexing state.</p>
            {checkedAt && <div className="mt-2 text-[8px] text-slate-600">Evidence checked: {checkedAt}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
