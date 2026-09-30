import { ExternalLink, RotateCw } from 'lucide-react';
import { ZEVARYQ } from '@/theme/zevaryqWallet';
import { StatePanel, StatusBadge } from './WalletUI';

const valueTone = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (['connected', 'synced', 'operational', 'live'].includes(normalized)) return 'text-emerald-300';
  if (['error', 'offline', 'unavailable'].includes(normalized)) return 'text-red-300';
  return 'text-amber-300';
};

const humanMode = (mode) => {
  const value = String(mode || '');
  if (!value) return 'Unavailable';
  if (value.includes('websocket')) return 'WebSocket indexer';
  if (value.includes('json-rpc')) return 'JSON-RPC polling';
  return value.replaceAll('-', ' ');
};

export default function NetworkInfrastructureCard({ network, compact = false }) {
  const { phase, data, error, refresh } = network;
  const live = phase === 'success' && data?.rpc === 'connected';
  const discovery = data?.sources?.discovery;
  const token = data?.sources?.tokenIntelligence;
  const platform = data?.sources?.platform;

  const tiles = data ? [
    ['Chain ID', ZEVARYQ.chainId, 'text-white'],
    ['RPC Status', data.rpc, valueTone(data.rpc)],
    ['Latest Block', data.blockNumber?.toLocaleString() ?? 'Unavailable', 'text-white'],
    ['Explorer API', data.explorer, valueTone(data.explorer)],
    ['Sync Status', data.sync, valueTone(data.sync)],
    ['Network Latency', data.latency != null ? `${data.latency} ms` : 'Unavailable', 'text-white'],
    ['First-party Discovery', discovery?.state || 'error', valueTone(discovery?.state)],
    ['Discovery Head', discovery?.head?.toLocaleString?.() ?? 'Unavailable', 'text-white'],
    ['Token Intelligence', token?.state || 'error', valueTone(token?.state)],
    ['Data Stream', token?.streamState || 'error', valueTone(token?.streamState)],
    ['Data Mode', humanMode(token?.sourceMode), valueTone(token?.streamState)],
    ['Platform Core', platform?.state || 'error', valueTone(platform?.state)],
  ] : [];

  return <section className="zv-card zv-network-card p-5" data-network-live={live ? 'true' : 'false'} aria-labelledby="network-infrastructure-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="zv-label">Network Infrastructure</p>
        <h2 id="network-infrastructure-title" className="mt-1 text-xl font-black text-white">{ZEVARYQ.network}</h2>
      </div>
      <StatusBadge state={phase === 'success' ? 'success' : phase}>{phase}</StatusBadge>
    </div>

    {phase === 'loading' && !data ? <div className="mt-5"><StatePanel phase="loading" /></div> : !data ? <div className="mt-5"><StatePanel phase={phase} message={error} onRetry={refresh} /></div> : <>
      <dl className={`zv-network-grid mt-5 grid ${compact ? '' : 'sm:grid-cols-3'} gap-2`}>
        {tiles.map(([label, value, tone]) => <div key={label} className="zv-telemetry-tile min-w-0 rounded-2xl border border-[#1A3A59]/80 bg-[#071522]/60 p-3">
          <dt className="text-[10px] uppercase tracking-wider text-[#6F859B]">{label}</dt>
          <dd className={`mt-1 break-words text-sm font-extrabold capitalize ${tone}`}>{value}</dd>
        </div>)}
      </dl>

      <div className="mt-3 grid gap-1 text-[11px] text-[#6F859B]">
        <p>Last refresh: {data.checkedAt?.toLocaleTimeString?.() || 'Unavailable'}</p>
        <p>Discovery transport: {discovery?.transport || 'Unavailable'}{discovery?.latencyMs != null ? ` · ${discovery.latencyMs} ms` : ''}</p>
        <p>Radar scan: {token?.scannedBlocks != null ? `${token.scannedBlocks} blocks` : 'Unavailable'} · metadata proven: {token?.tokenMetadataProven ?? 'Unavailable'}</p>
        {platform?.networksOnline != null && platform?.networksTotal != null ? <p>KriptoAman network feeds: {platform.networksOnline}/{platform.networksTotal} online</p> : null}
      </div>

      <p className="mt-3 rounded-xl border border-sky-400/10 bg-sky-400/[0.04] px-3 py-2 text-[10px] leading-5 text-[#7890A6]">
        Wallet reads public, read-only production data only. Validator admin, signer, private-key and write-RPC interfaces are intentionally not connected to the wallet.
      </p>
    </>}

    <div className="zv-network-actions mt-4 grid gap-2">
      <button type="button" onClick={refresh} className="zv-button-secondary"><RotateCw className="h-4 w-4" />Refresh Network</button>
      <a href={ZEVARYQ.explorer} target="_blank" rel="noreferrer" className="zv-button-secondary"><ExternalLink className="h-4 w-4" />Open Explorer</a>
    </div>
  </section>;
}
