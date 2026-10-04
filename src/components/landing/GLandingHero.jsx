import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Activity, Database, ExternalLink, Blocks } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';
import { COIN_META } from '@/components/home/coinMeta';

const PURPOSE = [
  { key: 'APA', title: 'Crypto Intelligence OS', text: 'Mengubah data pasar dan blockchain menjadi intelligence yang dapat ditelusuri.' },
  { key: 'UNTUK', title: 'Market · On-Chain · Risk', text: 'Memantau perubahan, memeriksa aktivitas, dan membaca risiko sebelum bertindak.' },
  { key: 'MENGAPA', title: 'Evidence before action', text: 'Sinyal penting harus kembali ke sumber, waktu verifikasi, dan bukti.' },
];

const COINS = [
  { sym: 'BTC', sub: 'Bitcoin', logo: COIN_META.BTC?.logo, color: '#F7931A', className: 'ka-coin-btc' },
  { sym: 'ETH', sub: 'Ethereum', logo: COIN_META.ETH?.logo, color: '#627EEA', className: 'ka-coin-eth' },
  { sym: 'SOL', sub: 'Solana', logo: COIN_META.SOL?.logo, color: '#14F195', className: 'ka-coin-sol' },
  { sym: 'ZVQ', sub: 'ZEVARYQ', logo: '/brand/zevaryq-wallet-premium-icon.webp', color: '#F5B72E', className: 'ka-coin-trx' },
];

function NetworkVisual() {
  return (
    <svg viewBox="0 0 400 400" className="ka-hero-network absolute inset-0 w-full h-full" aria-hidden="true">
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

function StreamItems({ items, hidden = false }) {
  return (
    <div className="ka-live-stream-set" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <div key={item.label} className="ka-live-stream-item">
          <span>{item.label}</span>
          <b>{item.value}</b>
          <small>{item.meta}</small>
        </div>
      ))}
    </div>
  );
}

export default function GLandingHero({ stats }) {
  const assetCount = stats?.loading || !(Number(stats?.assetCount) > 0) ? '—' : Number(stats.assetCount).toLocaleString('id-ID');
  const networkCount = stats?.loading ? '—' : Number.isFinite(Number(stats?.networkActiveCount)) ? String(Number(stats.networkActiveCount)) : '—';
  const blockNumber = stats?.zvqBlockNumber != null && Number.isFinite(Number(stats.zvqBlockNumber)) ? Number(stats.zvqBlockNumber).toLocaleString('id-ID') : '—';
  const isOperational = Boolean(stats?.marketAvailable && blockNumber !== '—');
  const zvqTelemetry = blockNumber !== '—' ? [stats?.zvqSyncStatus ? String(stats.zvqSyncStatus).toUpperCase() : null, Number.isFinite(Number(stats?.zvqProbeDurationMs)) ? `RPC ${Number(stats.zvqProbeDurationMs).toLocaleString('id-ID')} ms` : null].filter(Boolean).join(' · ') : '';
  const verifiedAtRaw = stats?.zvqCheckedAt || stats?.networkCheckedAt || stats?.lastUpdated || null;
  const verifiedAtMs = verifiedAtRaw ? Date.parse(verifiedAtRaw) : NaN;
  const verifiedAgeMs = Number.isFinite(verifiedAtMs) ? Math.max(0, Date.now() - verifiedAtMs) : NaN;
  const freshness = Number.isFinite(verifiedAgeMs) ? (verifiedAgeMs <= 5 * 60 * 1000 ? 'LIVE' : verifiedAgeMs <= 30 * 60 * 1000 ? 'RECENT' : 'STALE') : 'UNVERIFIED';
  const verifiedAtLabel = Number.isFinite(verifiedAtMs) ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(verifiedAtMs)) : null;
  const streamItems = [
    { label: 'ASSETS', value: assetCount, meta: assetCount === '—' ? 'UNAVAILABLE' : 'MONITORED' },
    { label: 'NETWORKS', value: networkCount, meta: networkCount === '—' ? 'UNAVAILABLE' : 'RESPONDING' },
    { label: 'ZVQ HEAD', value: blockNumber, meta: blockNumber === '—' ? 'UNVERIFIED' : 'CHAIN 22028' },
    { label: 'EVIDENCE', value: freshness, meta: verifiedAtLabel ? `VERIFIED ${verifiedAtLabel}` : 'WAITING FOR SOURCE' },
  ];

  return (
    <section id="beranda" className="ka-command-hero relative pt-28 pb-10 px-4 sm:px-6 overflow-hidden">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[760px] h-[760px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14), transparent 62%)' }} />
      <div className="ka-hero-grid max-w-[1440px] mx-auto grid lg:grid-cols-[1.08fr_.92fr] gap-10 lg:gap-8 items-center">
        <div className="ka-hero-copy text-center lg:text-left">
          <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
            <Shield className="w-3.5 h-3.5" /> KRIPTOAMAN · GLOBAL CHAIN INTELLIGENCE
          </span>
          <p className="ka-hero-role mt-4 text-[11px] font-black tracking-[0.18em] uppercase ka-gold">CRYPTO INTELLIGENCE OS</p>
          <h1 className="ka-sec-title mt-3 text-[34px] sm:text-5xl lg:text-[54px]">
            Blockchain bergerak setiap detik.<br />
            <span className="ka-blue">Lihat. Pahami. Verifikasi.</span>
          </h1>
          <p className="ka-text2 mt-5 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed">
            KriptoAman membantu pengguna memahami <b className="ka-text">apa yang sedang terjadi</b> di pasar kripto, <b className="ka-text">mengapa sinyal muncul</b>, dan <b className="ka-text">bukti apa yang mendukungnya</b> melalui market intelligence, on-chain verification, dan risk intelligence.
          </p>

          <div className="ka-purpose-grid mt-6">
            {PURPOSE.map((item) => (
              <div key={item.key} className="ka-purpose-card">
                <span>{item.key}</span>
                <b>{item.title}</b>
                <small>{item.text}</small>
              </div>
            ))}
          </div>

          <div className="ka-hero-actions mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Open Intelligence Core <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="ka-btn-outline ka-zvq-outline inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Verify on ZEVARYQ <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="ka-hero-console relative mx-auto w-full max-w-[560px]" aria-label="KriptoAman Intelligence Core live status">
          <div className="ka-console-head">
            <div>
              <span className="ka-console-kicker">KRIPTOAMAN · LIVE INTELLIGENCE GLOBE</span>
              <strong>Market · On-Chain · Risk · Evidence</strong>
            </div>
            <span className={`ka-live-state ${isOperational ? 'is-online' : ''}`}><i />{stats?.loading ? 'Memeriksa' : isOperational ? 'Operasional' : 'Terbatas'}</span>
          </div>

          <div className="ka-live-stream" aria-label="Live verified telemetry">
            <div className="ka-live-stream-track">
              <StreamItems items={streamItems} />
              <StreamItems items={streamItems} hidden />
            </div>
          </div>

          <div className="ka-console-stage ka-core-stage">
            <div className="ka-hero-visual relative mx-auto w-full max-w-[360px] aspect-square">
              <NetworkVisual />
              <div className="ka-core-horizon" aria-hidden="true" />
              <div className="ka-core-ring ring-a" aria-hidden="true" />
              <div className="ka-core-ring ring-b" aria-hidden="true" />
              <div className="ka-core-ring ring-c" aria-hidden="true" />
              <div className="ka-hero-center absolute inset-0 flex items-center justify-center ka-glow-cyan rounded-full">
                <div className="ka-hero-logo ka-glow-gold rounded-full">
                  <KriptoAmanLogo size={116} showText={false} animate={false} />
                </div>
              </div>
              {COINS.map((coin) => (
                <div key={coin.sym} className={`ka-coin-badge ka-glow ${coin.className}`}>
                  {coin.logo ? <img src={coin.logo} alt="" aria-hidden="true" className="h-6 w-6 rounded-full object-contain" loading="lazy" /> : null}
                  <span className="ka-coin-symbol mt-0.5" style={{ color: coin.color }}>{coin.sym}</span>
                  <span className="ka-coin-name ka-text2 sr-only">{coin.sub}</span>
                </div>
              ))}
              <div className="ka-core-purpose">
                <span>OBSERVATION</span><i>→</i><span>SIGNAL</span><i>→</i><span>EVIDENCE</span>
              </div>
              <div className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 translate-y-[72px] text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[9px] font-black tracking-[0.14em] text-blue-200">
                  KRIPTOAMAN INTELLIGENCE CORE
                </span>
              </div>
            </div>
          </div>
          <div className="ka-console-metrics">
            <div><Database /><span><b>{assetCount}</b>Cakupan aset</span></div>
            <div><Activity /><span><b>{networkCount}</b>Jaringan aktif</span></div>
            <div><Blocks /><span><b>{blockNumber}</b>ZEVARYQ block{zvqTelemetry ? <small className="block text-[9px] font-medium opacity-70">{zvqTelemetry}</small> : null}</span></div>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer"><Shield /><span><b>22028</b>ZEVARYQ Mainnet</span></a>
          </div>
          <div className="border-t border-blue-400/10 px-4 py-2.5 text-center text-[9px] font-semibold tracking-[0.08em] ka-text2">
            PRODUCTION DATA PATH · {isOperational ? 'VERIFIED' : 'LIMITED'} · PROOF OF FRESHNESS {freshness}{verifiedAtLabel ? ` · LAST VERIFIED ${verifiedAtLabel}` : ''}
          </div>
        </div>
      </div>
      <p className="ka-text2 text-xs text-center mt-8 opacity-70">
        Data live ditampilkan hanya ketika sumber berhasil diverifikasi. Informasi ini untuk pemantauan, riset, dan edukasi; bukan rekomendasi investasi.
      </p>
    </section>
  );
}
