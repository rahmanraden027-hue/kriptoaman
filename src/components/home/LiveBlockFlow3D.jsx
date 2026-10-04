import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Box, Clock3, Database, ExternalLink, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import NodePropagation3D from './NodePropagation3D';
import NetworkOperationsPanel from './NetworkOperationsPanel';

const ENDPOINT = '/api/zvq-live-blocks';
const POLL_MS = 4_000;
const STALE_MS = 20_000;

const shortHash = (value) => typeof value === 'string' && value.length > 14
  ? `${value.slice(0, 8)}…${value.slice(-6)}`
  : '—';

const fmtNumber = (value) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US')
  : '—';

function Metric({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-sky-400/10 bg-[#07111f]/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</span>
        <Icon className="h-3.5 w-3.5 text-sky-300" />
      </div>
      <div className="mt-2 text-base font-black text-white">{value}</div>
      {note && <div className="mt-1 text-[8px] text-slate-500">{note}</div>}
    </div>
  );
}

function Cube({ block, index, latest, advanceKey }) {
  const label = block ? `#${fmtNumber(block.number)}` : 'NO DATA';
  return (
    <div
      key={block?.hash || `empty-${index}`}
      className={`zvq-flow-cube-wrap zvq-flow-slot-${index} ${latest ? 'is-latest' : ''} ${latest && advanceKey ? 'is-advance' : ''}`}
      aria-label={block ? `ZEVARYQ block ${block.number}` : 'No block data'}
    >
      <div className="zvq-flow-cube">
        <div className="zvq-flow-face front"><span>{label}</span></div>
        <div className="zvq-flow-face back" />
        <div className="zvq-flow-face right" />
        <div className="zvq-flow-face left" />
        <div className="zvq-flow-face top" />
        <div className="zvq-flow-face bottom" />
      </div>
    </div>
  );
}

export default function LiveBlockFlow3D() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [advanceKey, setAdvanceKey] = useState(0);
  const [lastAdvanceAt, setLastAdvanceAt] = useState(null);
  const [history,setHistory] = useState([]);
  const latestHeadRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let timer = null;
    let controller = null;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(ENDPOINT, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        const next = await response.json().catch(() => null);
        if (disposed) return;

        const valid = response.ok
          && next?.status === 'live'
          && Number(next?.chainId) === 22028
          && String(next?.chainIdHex).toLowerCase() === '0x560c'
          && Number.isSafeInteger(Number(next?.head?.number))
          && Array.isArray(next?.blocks)
          && next.blocks.length > 0;

        if (!valid) throw new Error(next?.code || 'LIVE_BLOCK_FEED_UNVERIFIED');

        const nextHead = Number(next.head.number);
        const previousHead = latestHeadRef.current;
        if (Number.isSafeInteger(previousHead) && nextHead > previousHead) {
          setAdvanceKey(nextHead);
          setLastAdvanceAt(Date.now());
        } else if (previousHead == null) {
          setLastAdvanceAt(Date.now());
        }
        latestHeadRef.current = nextHead;
        setPayload(next);
        setHistory((current) => {
          const sample = {
            head: nextHead,
            observedAt: next.checkedAt || new Date().toISOString(),
            rpcLatencyMs: Number(next?.metrics?.rpcIdentityLatencyMs),
            blockTimeSeconds: Number(next?.metrics?.averageBlockTimeSeconds),
            indexerLagBlocks: Number(next?.metrics?.indexerLagBlocks),
          };
          const sameHead = current[current.length - 1]?.head === sample.head;
          const nextHistory = sameHead ? [...current.slice(0, -1), sample] : [...current, sample];
          return nextHistory.slice(-24);
        });
        setError(null);
      } catch (err) {
        if (!disposed && err?.name !== 'AbortError') {
          setError(err?.message || 'LIVE_BLOCK_FEED_UNAVAILABLE');
        }
      } finally {
        if (!disposed) timer = setTimeout(load, POLL_MS);
      }
    };

    load();
    return () => {
      disposed = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const state = useMemo(() => {
    if (!payload) return error ? 'unavailable' : 'loading';
    const observedAt = Date.parse(payload.checkedAt || '');
    const stale = !Number.isFinite(observedAt) || Date.now() - observedAt > STALE_MS;
    if (stale || error) return 'delayed';
    return 'live';
  }, [payload, error]);

  const blocks = Array.isArray(payload?.blocks) ? payload.blocks.slice(0, 5) : [];
  const head = payload?.head?.number;
  const latestBlock = blocks[0] || null;
  const blockTime = Number(payload?.metrics?.averageBlockTimeSeconds);
  const rpcLatency = Number(payload?.metrics?.rpcIdentityLatencyMs);
  const indexerLag = payload?.metrics?.indexerLagBlocks;
  const indexedHead = payload?.metrics?.indexedHead;
  const live = state === 'live';

  return (
    <section className="zvq-live-flow mt-5 overflow-hidden rounded-[30px] border border-cyan-400/15 bg-[#030914] p-4 sm:p-5">
      <style>{`
        .zvq-flow-stage{position:relative;min-height:280px;overflow:hidden;border-radius:24px;border:1px solid rgba(56,189,248,.12);background:radial-gradient(circle at 50% 48%,rgba(34,211,238,.12),transparent 28%),linear-gradient(180deg,rgba(2,6,23,.2),rgba(2,8,18,.96));perspective:900px}
        .zvq-flow-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(56,189,248,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.05) 1px,transparent 1px);background-size:28px 28px;transform:rotateX(62deg) translateY(45%);transform-origin:center bottom;opacity:.65}
        .zvq-flow-orbit{position:absolute;left:50%;top:50%;width:68%;height:38%;transform:translate(-50%,-50%) rotateX(66deg);border:1px solid rgba(56,189,248,.2);border-radius:50%;box-shadow:0 0 28px rgba(34,211,238,.12),inset 0 0 28px rgba(34,211,238,.08)}
        .zvq-flow-orbit::after{content:'';position:absolute;inset:18%;border:1px solid rgba(245,158,11,.18);border-radius:50%}
        .zvq-flow-line{position:absolute;left:9%;right:9%;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(56,189,248,.4),rgba(34,211,238,.9),rgba(56,189,248,.4),transparent);box-shadow:0 0 18px rgba(34,211,238,.35)}
        .zvq-flow-cube-wrap{position:absolute;top:50%;left:50%;width:74px;height:74px;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s ease}
        .zvq-flow-cube{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:zvqCubeIdle 12s linear infinite}
        .zvq-flow-face{position:absolute;inset:0;display:grid;place-items:center;border:1px solid rgba(103,232,249,.58);background:linear-gradient(135deg,rgba(14,165,233,.11),rgba(2,6,23,.5));box-shadow:inset 0 0 26px rgba(34,211,238,.1),0 0 16px rgba(34,211,238,.1);backface-visibility:hidden}
        .zvq-flow-face span{font-size:8px;font-weight:900;letter-spacing:.08em;color:rgb(186 230 253);text-shadow:0 0 12px rgba(56,189,248,.8)}
        .zvq-flow-face.front{transform:translateZ(37px)}.zvq-flow-face.back{transform:rotateY(180deg) translateZ(37px)}.zvq-flow-face.right{transform:rotateY(90deg) translateZ(37px)}.zvq-flow-face.left{transform:rotateY(-90deg) translateZ(37px)}.zvq-flow-face.top{transform:rotateX(90deg) translateZ(37px)}.zvq-flow-face.bottom{transform:rotateX(-90deg) translateZ(37px)}
        .zvq-flow-slot-0{transform:translate3d(145px,-52px,0) scale(1.32);z-index:6}.zvq-flow-slot-1{transform:translate3d(36px,-40px,-40px) scale(.92);opacity:.86;z-index:5}.zvq-flow-slot-2{transform:translate3d(-65px,-38px,-90px) scale(.72);opacity:.7;z-index:4}.zvq-flow-slot-3{transform:translate3d(-145px,-36px,-140px) scale(.58);opacity:.5;z-index:3}.zvq-flow-slot-4{transform:translate3d(-205px,-34px,-180px) scale(.46);opacity:.35;z-index:2}
        .zvq-flow-slot-0 .zvq-flow-face{border-color:rgba(250,204,21,.58);box-shadow:inset 0 0 28px rgba(34,211,238,.14),0 0 26px rgba(34,211,238,.25),0 0 42px rgba(245,158,11,.12)}
        .zvq-flow-cube-wrap.is-advance{animation:zvqBlockEnter .82s cubic-bezier(.18,.84,.26,1)}
        .zvq-flow-scan{position:absolute;left:7%;right:7%;top:50%;height:80px;transform:translateY(-50%);background:linear-gradient(90deg,transparent,rgba(14,165,233,.025),rgba(34,211,238,.08),rgba(14,165,233,.025),transparent);filter:blur(10px);pointer-events:none}
        @keyframes zvqCubeIdle{from{transform:rotateX(-16deg) rotateY(0deg)}to{transform:rotateX(-16deg) rotateY(360deg)}}
        @keyframes zvqBlockEnter{0%{opacity:0;filter:blur(8px);transform:translate3d(260px,-52px,80px) scale(1.65)}55%{opacity:1;filter:blur(0)}100%{transform:translate3d(145px,-52px,0) scale(1.32)}}
        @media(max-width:639px){.zvq-flow-stage{min-height:230px}.zvq-flow-cube-wrap{width:58px;height:58px}.zvq-flow-face.front{transform:translateZ(29px)}.zvq-flow-face.back{transform:rotateY(180deg) translateZ(29px)}.zvq-flow-face.right{transform:rotateY(90deg) translateZ(29px)}.zvq-flow-face.left{transform:rotateY(-90deg) translateZ(29px)}.zvq-flow-face.top{transform:rotateX(90deg) translateZ(29px)}.zvq-flow-face.bottom{transform:rotateX(-90deg) translateZ(29px)}.zvq-flow-slot-0{transform:translate3d(76px,-40px,0) scale(1.18)}.zvq-flow-slot-1{transform:translate3d(-8px,-34px,-45px) scale(.82)}.zvq-flow-slot-2{transform:translate3d(-78px,-32px,-90px) scale(.62)}.zvq-flow-slot-3{transform:translate3d(-135px,-30px,-130px) scale(.48)}.zvq-flow-slot-4{display:none}@keyframes zvqBlockEnter{0%{opacity:0;filter:blur(8px);transform:translate3d(150px,-40px,70px) scale(1.5)}100%{opacity:1;filter:blur(0);transform:translate3d(76px,-40px,0) scale(1.18)}}}
        @media(prefers-reduced-motion:reduce){.zvq-flow-cube,.zvq-flow-cube-wrap.is-advance{animation:none!important}.zvq-flow-cube-wrap{transition:none}}
      `}</style>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300">ZEVARYQ · FIRST-PARTY BLOCKCHAIN EVIDENCE</p>
            <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] ${live ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}`}>
              {state === 'live' ? 'LIVE' : state === 'loading' ? 'CONNECTING' : state === 'delayed' ? 'DATA DELAYED' : 'UNAVAILABLE'}
            </span>
          </div>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">Live Block Flow 3D</h2>
          <p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-500">
            The flow advances only when ZEVARYQ chain head increases. No synthetic blocks or invented propagation metrics are shown.
          </p>
        </div>
        {Number.isFinite(Number(head)) && (
          <a
            href={`https://explorer.kriptoaman.com/block/${Number(head)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 text-[10px] font-black text-cyan-200"
          >
            VERIFY BLOCK <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_.55fr]">
        <div className="zvq-flow-stage">
          <div className="zvq-flow-grid" />
          <div className="zvq-flow-orbit" />
          <div className="zvq-flow-line" />
          <div className="zvq-flow-scan" />
          {blocks.map((block, index) => (
            <Cube
              key={block.hash}
              block={block}
              index={index}
              latest={index === 0}
              advanceKey={index === 0 ? advanceKey : 0}
            />
          ))}
          {!blocks.length && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" /> Waiting for verified ZEVARYQ blocks
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[.06] bg-slate-950/55 px-3 py-2 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[9px] text-slate-400">
              <Activity className={`h-3.5 w-3.5 ${live ? 'text-emerald-300' : 'text-amber-300'}`} />
              {live ? 'Verified head polling active' : 'Animation frozen until verified data returns'}
            </div>
            <div className="text-[9px] font-black text-sky-300">CHAIN ID 22028 · 0x560c</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          <Metric icon={Box} label="Current Block" value={Number.isFinite(Number(head)) ? `#${fmtNumber(head)}` : '—'} note={shortHash(payload?.head?.hash)} />
          <Metric icon={Clock3} label="Block Interval" value={Number.isFinite(blockTime) ? `${blockTime.toFixed(2)} s` : '—'} note="Observed recent block timestamps" />
          <Metric icon={Zap} label="RPC Latency" value={Number.isFinite(rpcLatency) ? `${fmtNumber(rpcLatency)} ms` : '—'} note="Chain identity + head probe" />
          <Metric icon={Database} label="Indexer Lag" value={Number.isFinite(Number(indexerLag)) ? `${fmtNumber(indexerLag)} blocks` : '—'} note={Number.isFinite(Number(indexedHead)) ? `Explorer #${fmtNumber(indexedHead)}` : 'Explorer evidence unavailable'} />
          <Metric icon={Activity} label="Latest Transactions" value={latestBlock ? fmtNumber(latestBlock.txCount) : '—'} note="Transaction count in current block" />
          <Metric icon={ShieldCheck} label="Last Advance" value={lastAdvanceAt ? new Date(lastAdvanceAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'} note="Changes only on verified head increase" />
        </div>
      </div>

      <NodePropagation3D
        head={head}
        blockHash={payload?.head?.hash}
        advanceKey={advanceKey}
        live={live}
        indexerLag={indexerLag}
        indexedHead={indexedHead}
        checkedAt={payload?.checkedAt}
      />

      <NetworkOperationsPanel
        samples={history}
        evidence={payload?.networkEvidence}
        live={live}
      />

      {error && (
        <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[.04] px-3 py-2 text-[9px] text-amber-200">
          Feed warning: {error}. The existing block scene remains visible, but flow does not advance until verified data resumes.
        </div>
      )}
    </section>
  );
}
