import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, Activity, Database, ExternalLink, Blocks, Sparkles } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const INDICATORS = [
  { label: 'Market Intelligence' },
  { label: 'On-chain Verification' },
  { label: 'Risk Intelligence' },
];

const COINS = [
  { sym: 'BTC', sub: 'Bitcoin', color: '#F7931A', className: 'ka-coin-btc' },
  { sym: 'ETH', sub: 'Ethereum', color: '#627EEA', className: 'ka-coin-eth' },
  { sym: 'SOL', sub: 'Solana', color: '#14F195', className: 'ka-coin-sol' },
  { sym: 'ZVQ', sub: 'ZEVARYQ', color: '#F5B72E', className: 'ka-coin-trx' },
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
      <g>
        <circle cx="80" cy="90" r="5" className="ka-net-dot" />
        <circle cx="320" cy="90" r="5" className="ka-net-dot" />
        <circle cx="70" cy="300" r="5" className="ka-net-dot" />
        <circle cx="330" cy="300" r="5" className="ka-net-dot" />
        <circle cx="200" cy="200" r="6" fill="var(--ka-gold)" opacity="0.95" />
      </g>
    </svg>
  );
}

export default function GLandingHero({ stats }) {
  const assetCount = stats?.loading || !(Number(stats?.assetCount) > 0) ? '—' : Number(stats.assetCount).toLocaleString('id-ID');
  const networkCount = stats?.loading || !(Number(stats?.networkActiveCount) > 0) ? '—' : String(Number(stats.networkActiveCount));
  const blockNumber = Number(stats?.zvqBlockNumber) > 0 ? Number(stats.zvqBlockNumber).toLocaleString('id-ID') : '—';
  const isOperational = Boolean(stats?.marketAvailable);

  return (
    <section id="beranda" className="relative pt-28 pb-10 px-4 sm:px-6 overflow-hidden">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[760px] h-[760px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14), transparent 62%)' }} />
      <div className="ka-hero-grid max-w-[1440px] mx-auto grid lg:grid-cols-[1.08fr_.92fr] gap-10 lg:gap-8 items-center">
        <div className="ka-hero-copy text-center lg:text-left">
          <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
            <Shield className="w-3.5 h-3.5" /> KRIPTOAMAN DIGITAL ASSET INTELLIGENCE
          </span>
          <h1 className="ka-sec-title mt-5 text-[34px] sm:text-5xl lg:text-[54px]">
            Pasar kripto bergerak cepat.<br />
            Anda tetap <span className="ka-blue">terkendali.</span>
          </h1>
          <p className="ka-text2 mt-5 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed">
            Market intelligence, on-chain verification, multi-chain monitoring, dan risk intelligence dalam satu platform terpadu dengan sumber data yang dapat ditelusuri.
          </p>
          <div className="ka-hero-actions mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Open Intelligence Hub <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="ka-btn-outline ka-zvq-outline inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Explore ZEVARYQ <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="ka-hero-indicators mt-8 flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start">
            {INDICATORS.map(({ label }) => (
              <div key={label} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 ka-green" />
                <span className="text-xs sm:text-sm font-semibold ka-text2">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ka-hero-console relative mx-auto w-full max-w-[560px]" aria-label="KriptoAman Intelligence Core live status">
          <div className="ka-console-head">
            <div>
              <span className="ka-console-kicker">KRIPTOAMAN PRODUCTION V2</span>
              <strong>Intelligence Core</strong>
            </div>
            <span className={`ka-live-state ${isOperational ? 'is-online' : ''}`}><i />{stats?.loading ? 'Memeriksa' : isOperational ? 'Operasional' : 'Terbatas'}</span>
          </div>
          <div className="ka-console-stage">
            <div className="ka-hero-visual relative mx-auto w-full max-w-[360px] aspect-square">
              <NetworkVisual />
              <div className="ka-hero-center absolute inset-0 flex items-center justify-center ka-glow-cyan rounded-full">
                <div className="ka-hero-logo ka-glow-gold rounded-full">
                  <KriptoAmanLogo size={150} showText={false} animate={false} />
                </div>
              </div>
              {COINS.map((c) => (
                <div key={c.sym} className={`ka-coin-badge ka-glow ${c.className}`}>
                  <span className="ka-coin-symbol" style={{ color: c.color }}>{c.sym}</span>
                  <span className="ka-coin-name ka-text2">{c.sub}</span>
                </div>
              ))}
              <div className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 translate-y-[86px] text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[9px] font-black tracking-[0.14em] text-blue-200">
                  <Sparkles className="h-3 w-3" /> NEXUS INTELLIGENCE CORE
                </span>
              </div>
            </div>
          </div>
          <div className="ka-console-metrics">
            <div><Database /><span><b>{assetCount}</b>Cakupan aset</span></div>
            <div><Activity /><span><b>{networkCount}</b>Jaringan aktif</span></div>
            <div><Blocks /><span><b>{blockNumber}</b>ZEVARYQ block</span></div>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer"><Shield /><span><b>22028</b>ZEVARYQ Mainnet</span></a>
          </div>
        </div>
      </div>
      <p className="ka-text2 text-xs text-center mt-8 opacity-70">
        Data live ditampilkan hanya ketika sumber berhasil diverifikasi. Informasi ini untuk pemantauan, riset, dan edukasi; bukan rekomendasi investasi.
      </p>
    </section>
  );
}
