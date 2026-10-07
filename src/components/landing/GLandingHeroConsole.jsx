import React from 'react';
import { Activity, Blocks, Database, Shield } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { COIN_META } from '@/components/home/coinMeta';
import { getProductionFreshness } from './productionFreshness';

const COINS = [
  { sym: 'BTC', sub: 'Bitcoin', logo: COIN_META.BTC?.logo, color: '#F7931A', className: 'ka-coin-btc' },
  { sym: 'ETH', sub: 'Ethereum', logo: COIN_META.ETH?.logo, color: '#627EEA', className: 'ka-coin-eth' },
  { sym: 'SOL', sub: 'Solana', logo: COIN_META.SOL?.logo, color: '#14F195', className: 'ka-coin-sol' },
  { sym: 'ZVQ', sub: 'ZEVARYQ', logo: '/brand/zevaryq-master-v2.svg', color: '#F5B72E', className: 'ka-coin-trx' },
];

function NetworkVisual() {
  return (
    <svg viewBox="0 0 400 400" className="ka-hero-network absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="ka-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ka-blue)" stopOpacity=".26" />
          <stop offset="70%" stopColor="var(--ka-blue)" stopOpacity=".04" />
          <stop offset="100%" stopColor="var(--ka-blue)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="168" fill="url(#ka-core)" />
      <g className="ka-net-line" strokeWidth="1" fill="none">
        <ellipse cx="200" cy="200" rx="168" ry="64" />
        <ellipse cx="200" cy="200" rx="168" ry="64" transform="rotate(58 200 200)" />
        <ellipse cx="200" cy="200" rx="168" ry="64" transform="rotate(118 200 200)" />
        <circle cx="200" cy="200" r="128" opacity=".35" />
      </g>
      <g className="ka-network-points">
        <circle cx="80" cy="90" r="5" className="ka-net-dot" />
        <circle cx="320" cy="90" r="5" className="ka-net-dot" />
        <circle cx="70" cy="300" r="5" className="ka-net-dot" />
        <circle cx="330" cy="300" r="5" className="ka-net-dot" />
        <circle cx="200" cy="200" r="6" fill="var(--ka-gold)" opacity="0.95" />
      </g>
    </svg>
  );
}

export default function GLandingHeroConsole({ stats }) {
  const assetCount = stats?.loading || !(Number(stats?.assetCount) > 0) ? '—' : Number(stats.assetCount).toLocaleString('id-ID');
  const networkCount = stats?.loading ? '—' : Number.isFinite(Number(stats?.networkActiveCount)) ? String(Number(stats.networkActiveCount)) : '—';
  const blockNumber = stats?.zvqBlockNumber != null && Number.isFinite(Number(stats.zvqBlockNumber)) ? Number(stats.zvqBlockNumber).toLocaleString('id-ID') : '—';
  const snapshot = getProductionFreshness(stats);
  const isOperational = Boolean(
    stats?.overall === 'operational'
      && stats?.marketAvailable
      && snapshot.verified
      && snapshot.freshness !== 'STALE'
      && blockNumber !== '—'
      && networkCount !== '—',
  );
  const zvqTelemetry = blockNumber !== '—'
    ? [
        stats?.zvqSyncStatus ? `CHAIN ${String(stats.zvqSyncStatus).toUpperCase()}` : null,
        Number.isFinite(Number(stats?.zvqProbeDurationMs)) ? `RPC ${Number(stats.zvqProbeDurationMs).toLocaleString('id-ID')} ms` : null,
      ].filter(Boolean).join(' · ')
    : '';
  return (
    <div className="ka-hero-console relative mx-auto w-full max-w-[560px] lg:max-w-[500px]" aria-label="KriptoAman production core live status">
      <div className="ka-console-head">
        <div>
          <span className="ka-console-kicker">KRIPTOAMAN · PRODUCTION COMMAND CENTER</span>
          <strong>Market · ZEVARYQ · Network · Evidence</strong>
        </div>
        <span className={`ka-live-state ${isOperational ? 'is-online' : ''}`}><i />{stats?.loading ? 'Memeriksa' : isOperational ? 'Operasional' : 'Terbatas'}</span>
      </div>

      <div className="ka-console-stage ka-core-stage">
        <div className="ka-hero-visual relative mx-auto aspect-square w-full max-w-[320px] sm:max-w-[350px] lg:max-w-[280px]">
          <NetworkVisual />
          <div className="ka-core-horizon" aria-hidden="true" />
          <div className="ka-core-ring ring-a" aria-hidden="true" />
          <div className="ka-core-ring ring-b" aria-hidden="true" />
          <div className="ka-core-ring ring-c" aria-hidden="true" />
          <div className="ka-hero-center absolute inset-0 flex items-center justify-center rounded-full ka-glow-cyan">
            <div className="ka-hero-logo rounded-full ka-glow-gold">
              <KriptoAmanLogo size={104} showText={false} animate={false} src="/icons/kriptoaman-192.png" loading="lazy" fetchPriority="low" decoding="async" />
            </div>
          </div>
          {COINS.map((coin) => (
            <div key={coin.sym} className={`ka-coin-badge ka-glow ${coin.className}`}>
              {coin.logo ? <img src={coin.logo} alt="" aria-hidden="true" className="h-7 w-7 rounded-full object-contain" loading="lazy" decoding="async" /> : null}
              <span className="ka-coin-symbol mt-0.5" style={{ color: coin.color }}>{coin.sym}</span>
              <span className="ka-coin-name ka-text2 sr-only">{coin.sub}</span>
            </div>
          ))}
          <div className="ka-core-purpose">
            <span>OBSERVATION</span><i>→</i><span>SIGNAL</span><i>→</i><span>EVIDENCE</span>
          </div>
          <div className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 translate-y-[72px] text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-blue-100">
              KRIPTOAMAN LIVE SYSTEM
            </span>
          </div>
        </div>
      </div>
      <div className="ka-console-metrics lg:hidden">
        <div><Database /><span><b>{assetCount}</b>Cakupan aset</span></div>
        <div><Activity /><span><b>{networkCount}</b>Jaringan aktif</span></div>
        <div><Blocks /><span><b>{blockNumber}</b>ZEVARYQ block{zvqTelemetry ? <small className="block text-[10px] font-medium opacity-75">{zvqTelemetry}</small> : null}</span></div>
        <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer"><Shield /><span><b>22028</b>ZEVARYQ Mainnet</span></a>
      </div>
      <div className="border-t border-blue-400/10 px-4 py-3 text-center text-[10px] font-semibold tracking-[0.07em] ka-text2 lg:hidden">
        PRODUCTION DATA PATH · {isOperational ? 'VERIFIED' : 'LIMITED'} · PROOF OF FRESHNESS {snapshot.freshness} · {snapshot.modeLabel} · AGE {snapshot.ageLabel}{snapshot.generatedLabel ? ` · GENERATED ${snapshot.generatedLabel}` : ''}
      </div>
    </div>
  );
}
