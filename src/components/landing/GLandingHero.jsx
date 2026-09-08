import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, Activity, Database, ExternalLink } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const INDICATORS = [
  { label: 'Intelijen Pasar' },
  { label: 'Verifikasi On-chain' },
  { label: 'Analisis Risiko Indikatif' },
];

const COINS = [
  { sym: 'BTC', sub: 'Bitcoin', color: '#F7931A', className: 'ka-coin-btc' },
  { sym: 'ETH', sub: 'Ethereum', color: '#627EEA', className: 'ka-coin-eth' },
  { sym: 'SOL', sub: 'Solana', color: '#14F195', className: 'ka-coin-sol' },
  { sym: 'TRX', sub: 'TRON', color: '#FF060A', className: 'ka-coin-trx' },
];

function NetworkVisual() {
  return (
    <svg viewBox="0 0 400 400" className="ka-hero-network absolute inset-0 w-full h-full" aria-hidden="true">
      <g className="ka-net-line" strokeWidth="1" fill="none">
        <line x1="200" y1="200" x2="80" y2="90" />
        <line x1="200" y1="200" x2="320" y2="90" />
        <line x1="200" y1="200" x2="70" y2="300" />
        <line x1="200" y1="200" x2="330" y2="300" />
        <line x1="80" y1="90" x2="320" y2="90" />
        <line x1="70" y1="300" x2="330" y2="300" />
        <line x1="80" y1="90" x2="70" y2="300" />
        <line x1="320" y1="90" x2="330" y2="300" />
      </g>
      <g>
        <circle cx="80" cy="90" r="5" className="ka-net-dot" />
        <circle cx="320" cy="90" r="5" className="ka-net-dot" />
        <circle cx="70" cy="300" r="5" className="ka-net-dot" />
        <circle cx="330" cy="300" r="5" className="ka-net-dot" />
        <circle cx="200" cy="200" r="6" fill="var(--ka-gold)" opacity="0.9" />
      </g>
    </svg>
  );
}

export default function GLandingHero({ stats }) {
  const assetCount = stats?.loading ? '—' : Number(stats?.assetCount || 0).toLocaleString('id-ID');
  const networkCount = stats?.loading ? '—' : String(stats?.networkActiveCount ?? '—');
  const isOperational = Boolean(stats?.marketAvailable);

  return (
    <section id="beranda" className="relative pt-28 pb-10 px-4 sm:px-6 overflow-hidden">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.10), transparent 60%)' }} />
      <div className="ka-hero-grid max-w-[1440px] mx-auto grid lg:grid-cols-[1.08fr_.92fr] gap-10 lg:gap-8 items-center">
        <div className="ka-hero-copy text-center lg:text-left">
          <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
            <Shield className="w-3.5 h-3.5" /> KRIPTOAMAN INTELLIGENCE NETWORK
          </span>
          <h1 className="ka-sec-title mt-5 text-[34px] sm:text-5xl lg:text-[54px]">
            Pasar kripto bergerak cepat.<br />
            Anda tetap <span className="ka-blue">terkendali.</span>
          </h1>
          <p className="ka-text2 mt-5 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed">
            Satu ruang untuk membaca pasar, memantau aset, dan memverifikasi aktivitas on-chain—dengan sumber publik yang dapat ditelusuri.
          </p>
          <div className="ka-hero-actions mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Buka Intelligence Hub <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="ka-btn-outline inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              KAM Explorer <ExternalLink className="w-4 h-4" />
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

        <div className="ka-hero-console relative mx-auto w-full max-w-[520px]" aria-label="Status langsung ekosistem KriptoAman">
          <div className="ka-console-head">
            <div>
              <span className="ka-console-kicker">LIVE INTELLIGENCE</span>
              <strong>Network command surface</strong>
            </div>
            <span className={`ka-live-state ${isOperational ? 'is-online' : ''}`}><i />{stats?.loading ? 'Memeriksa' : isOperational ? 'Operasional' : 'Terbatas'}</span>
          </div>
          <div className="ka-console-stage">
            <div className="ka-hero-visual relative mx-auto w-full max-w-[360px] aspect-square">
          <NetworkVisual />
          <div className="ka-hero-center absolute inset-0 flex items-center justify-center ka-glow-cyan rounded-full">
            <div className="ka-hero-logo ka-glow-gold rounded-full">
              <KriptoAmanLogo size={150} showText={false} animate={true} />
            </div>
          </div>
          {COINS.map((c) => (
            <div key={c.sym} className={`ka-coin-badge ka-glow ${c.className}`}>
              <span className="ka-coin-symbol" style={{ color: c.color }}>{c.sym}</span>
              <span className="ka-coin-name ka-text2">{c.sub}</span>
            </div>
          ))}
            </div>
          </div>
          <div className="ka-console-metrics">
            <div><Database /><span><b>{assetCount}</b>Cakupan aset</span></div>
            <div><Activity /><span><b>{networkCount}</b>Jaringan aktif</span></div>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer"><Shield /><span><b>22028</b>KAM Mainnet</span></a>
          </div>
        </div>
      </div>
      <p className="ka-text2 text-xs text-center mt-8 opacity-70">
        Informasi dan analisis ditampilkan untuk tujuan pemantauan, riset, dan edukasi; bukan rekomendasi investasi.
      </p>
    </section>
  );
}
