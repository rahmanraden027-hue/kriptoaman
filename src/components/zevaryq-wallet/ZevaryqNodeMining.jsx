import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Clock3, Database, ExternalLink, RadioTower, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { ZEVARYQ } from '@/theme/zevaryqWallet';

const POLL_MS = 30_000;
const STALE_MS = 90_000;
const MAX_LAG = 12;
const UNKNOWN = 'Unavailable';
const explorerUrl = ZEVARYQ.explorer.replace(/\/$/, '');

function parseHeight(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

export default function ZevaryqNodeMining({ network }) {
  const [indexer, setIndexer] = useState({ phase: 'loading', height: null, checkedAt: null, error: '', rpcBefore: null, rpcAfter: null, hashVerified: false, hashStatus: 'unavailable' });
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    let active = true;
    let controller = null;
    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      try {
        const readHead = async () => {
          const response = await fetch(STATUS_PATH, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
          if (!response.ok) throw new Error('RPC status HTTP ' + response.status);
          const status = await response.json();
          const height = parseHeight(status?.blockNumber);
          if (status?.verified !== true || status?.live !== true || String(status?.chainIdHex).toLowerCase() !== CHAIN_ID_HEX || height === null) throw new Error('RPC status not verified');
          return height;
        };
        const rpcBefore = await readHead();
        const response = await fetch(`${explorerUrl}/api/v2/blocks?type=block&items_count=1`, {
          signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Indexer HTTP ${response.status}`);
        const body = await response.json();
        const height = parseHeight(body?.items?.[0]?.height);
        if (height === null) throw new Error('No valid indexed block');
        const rpcAfter = await readHead();
        let hashStatus = 'unavailable';
        let hashVerified = false;
        const commonHeight = Math.min(rpcBefore, rpcAfter, height);
        try {
          const [indexedBlockResponse, rpcResponse] = await Promise.all([
            fetch(`${explorerUrl}/api/v2/blocks/${commonHeight}`, { signal: controller.signal, cache: 'no-store' }),
            fetch(ZEVARYQ.rpc, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: [`0x${commonHeight.toString(16)}`, false] }) }),
          ]);
          if (indexedBlockResponse.ok && rpcResponse.ok) {
            const [indexedBlock, rpcBlock] = await Promise.all([indexedBlockResponse.json(), rpcResponse.json()]);
            const indexedHash = indexedBlock?.hash;
            const rpcHash = rpcBlock?.result?.hash;
            if (HASH_RE.test(indexedHash) && HASH_RE.test(rpcHash)) {
              hashVerified = indexedHash.toLowerCase() === rpcHash.toLowerCase();
              hashStatus = hashVerified ? 'match' : 'mismatch';
            }
          }
        } catch (error) { if (controller.signal.aborted) return; }
        if (active) setIndexer({ phase: 'success', height, checkedAt: Date.now(), error: '', rpcBefore, rpcAfter, hashVerified, hashStatus });
      } catch (error) {
        if (active && !controller.signal.aborted) setIndexer({ phase: 'error', height: null, checkedAt: null, error: error?.message || 'Indexer unavailable', rpcBefore: null, rpcAfter: null, hashVerified: false, hashStatus: 'unavailable' });
      }
    }
    refresh();
    const timer = window.setInterval(() => { setClock(Date.now()); refresh(); }, POLL_MS);
    return () => { active = false; window.clearInterval(timer); controller?.abort(); };
  }, []);

  const rpcHead = network?.data?.rpc === 'connected' ? parseHeight(network?.data?.blockNumber) : null;
  const rpcCheckedAt = new Date(network?.data?.checkedAt || 0).getTime();
  const rpcFresh = rpcHead !== null && Number.isFinite(rpcCheckedAt) && rpcCheckedAt > 0 && clock - rpcCheckedAt <= STALE_MS;
  const indexedFresh = indexer.phase === 'success' && indexer.checkedAt && clock - indexer.checkedAt <= STALE_MS;
  const delta = rpcFresh && indexedFresh ? rpcHead - indexer.height : null;
  const paired = indexedFresh && indexer.rpcBefore !== null && indexer.rpcAfter !== null;
  const sampledWithinRange = paired && indexer.height >= indexer.rpcBefore - MAX_LAG && indexer.height <= indexer.rpcAfter;
  const headsAligned = paired && indexer.rpcAfter >= indexer.rpcBefore && sampledWithinRange && indexer.hashVerified;
  const health = !rpcFresh || !indexedFresh ? 'UNKNOWN' : indexer.hashStatus === 'mismatch' ? 'HASH MISMATCH' : headsAligned ? 'DATA VERIFIED' : !indexer.hashVerified ? 'HASH UNVERIFIED' : 'CHECK SOURCES';
  const healthClass = headsAligned ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' : 'text-amber-200 border-amber-400/30 bg-amber-400/10';
  const metrics = [
    { name: 'RPC head', value: rpcFresh ? rpcHead.toLocaleString('en-US') : UNKNOWN, Icon: Activity },
    { name: 'Indexed block', value: indexedFresh ? indexer.height.toLocaleString('en-US') : UNKNOWN, Icon: Database },
    { name: 'Indexer lag', value: paired && indexer.rpcAfter >= indexer.height ? `${indexer.rpcAfter - indexer.height} blocks` : 'Sampling mismatch', Icon: RefreshCw },
    { name: 'My validator', value: 'Not registered', Icon: Server },
  ];
  return <section className="zv-card overflow-hidden p-4 sm:p-5" data-feature="zvq-node-mining" data-mode="read-only">
    <div className="rounded-2xl border border-[#2D8CFF]/30 bg-gradient-to-br from-[#133C65] via-[#0B253F] to-[#071522] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#F2C86B]/50 bg-[#10253C]"><RadioTower className="h-7 w-7 text-[#F2C86B]"/></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#F2C86B]">ZEVARYQ MAINNET · CHAIN 22028</p><h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl">Hybrid Node Mining</h2></div>
      </div>
      <div className={`mt-4 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${healthClass}`}><span className="h-2 w-2 rounded-full bg-current"/>{health}</div>
      <p className="mt-3 text-xs leading-5 text-[#B8C9DB]">Live blockchain observability · read-only. The wallet does not mine blocks or run a validator.</p>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
      {metrics.map(({ name, value, Icon }) => <div key={name} className="min-w-0 rounded-2xl border border-[#1A3A59] bg-[#071522] p-3.5 sm:p-4"><Icon className="h-5 w-5 text-[#F2C86B]"/><p className="mt-3 text-xs text-[#9FB3C8]">{name}</p><p className="mt-1 break-words text-lg font-black leading-snug sm:text-xl">{value}</p></div>)}
    </div>
    <div className="mt-4 rounded-2xl border border-[#1A3A59] bg-[#071522]/75 p-4">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#F2C86B]"/><h3 className="text-sm font-bold">Verification evidence</h3></div>
      <p className="mt-2 text-xs leading-5 text-[#9FB3C8]">RPC: {rpcFresh ? 'verified network response' : 'unavailable or stale'} · Indexer: {indexedFresh ? 'valid block response' : 'unavailable or stale'}.</p>
      <p className="mt-1 flex items-start gap-1 text-xs leading-5 text-[#9FB3C8]"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0"/>Last RPC check: {rpcFresh ? new Date(rpcCheckedAt).toLocaleString() : UNKNOWN} · Indexer: {indexedFresh ? new Date(indexer.checkedAt).toLocaleString() : UNKNOWN}</p>
      <p className="mt-2 text-xs text-[#9FB3C8]">Paired RPC sample: {paired ? `${indexer.rpcBefore.toLocaleString('en-US')} → ${indexer.rpcAfter.toLocaleString('en-US')}` : UNKNOWN} · Common block hash: {indexedFresh ? indexer.hashStatus : UNKNOWN}.</p>
      {paired && !sampledWithinRange && <p className="mt-2 text-xs text-amber-200">Block heights do not align within the paired sampling window; verification is withheld.</p>}
      {indexer.hashStatus === 'mismatch' && <p className="mt-2 text-xs text-red-300">Critical: RPC and indexer block hashes differ. Do not trust chain data until investigated.</p>}
      {indexer.error && <p className="mt-2 break-words text-xs text-amber-200">{indexer.error}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
        <a href={explorerUrl + '/blocks'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#53D8FB]">Inspect blocks <ExternalLink className="h-3 w-3"/></a>
        {indexedFresh && <a href={explorerUrl + '/block/' + indexer.height} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#53D8FB]">Indexed block evidence <ArrowUpRight className="h-3 w-3"/></a>}
      </div>
    </div>
    <div className="mt-4 rounded-2xl border border-[#F2C86B]/25 bg-[#F2C86B]/5 p-4 text-xs leading-5 text-[#E6D5AD]">
      <p className="font-bold">Validator enrollment, staking and rewards: disabled</p>
      <p className="mt-1">No validator ownership or uptime is claimed without signed server telemetry. No private keys are stored in this dashboard. Liquidity remains locked pending separate manual authorization.</p>
    </div>
  </section>;
}
