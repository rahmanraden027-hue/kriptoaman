import { ExternalLink, RotateCw } from 'lucide-react';
import { ZEVARYQ } from '@/theme/zevaryqWallet';
import { StatePanel, StatusBadge } from './WalletUI';

const valueTone = (value) => value === 'connected' || value === 'synced' ? 'text-emerald-300' : value === 'error' ? 'text-red-300' : 'text-amber-300';

export default function NetworkInfrastructureCard({ network, compact = false }) {
  const { phase, data, error, refresh } = network;
  return <section className="zv-card p-5" aria-labelledby="network-infrastructure-title">
    <div className="flex items-start justify-between gap-3"><div><p className="zv-label">Network Infrastructure</p><h2 id="network-infrastructure-title" className="mt-1 text-xl font-black text-white">{ZEVARYQ.network}</h2></div><StatusBadge state={phase === 'success' ? 'success' : phase}>{phase}</StatusBadge></div>
    {phase === 'loading' && !data ? <div className="mt-5"><StatePanel phase="loading" /></div> : !data ? <div className="mt-5"><StatePanel phase={phase} message={error} onRetry={refresh} /></div> : <>
      <dl className={`mt-5 grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
        {[
          ['Chain ID', ZEVARYQ.chainId, 'text-white'], ['RPC Status', data.rpc, valueTone(data.rpc)],
          ['Latest Block', data.blockNumber?.toLocaleString() ?? 'Unavailable', 'text-white'],
          ['Explorer API', data.explorer, valueTone(data.explorer)], ['Sync Status', data.sync, valueTone(data.sync)],
          ['Network Latency', data.latency != null ? `${data.latency} ms` : 'Unavailable', 'text-white'],
        ].map(([label, value, tone]) => <div key={label} className="rounded-2xl border border-[#1A3A59]/80 bg-[#071522]/60 p-3"><dt className="text-[10px] uppercase tracking-wider text-[#6F859B]">{label}</dt><dd className={`mt-1 truncate text-sm font-extrabold capitalize ${tone}`}>{value}</dd></div>)}
      </dl>
      <p className="mt-3 text-[11px] text-[#6F859B]">Last refresh: {data.checkedAt?.toLocaleTimeString?.() || 'Unavailable'}</p>
    </>}
    <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={refresh} className="zv-button-secondary"><RotateCw className="h-4 w-4" />Refresh Network</button><a href={ZEVARYQ.explorer} target="_blank" rel="noreferrer" className="zv-button-secondary"><ExternalLink className="h-4 w-4" />Open Explorer</a></div>
  </section>;
}
