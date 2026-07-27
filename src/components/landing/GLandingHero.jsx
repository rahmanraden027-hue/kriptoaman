import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const INDICATORS = [
  { label: 'Pemantauan Real-time' },
  { label: 'Verifikasi Transaksi' },
  { label: 'Analisis Risiko' },
];

const COINS = [
  { sym: 'BTC', sub: 'Bitcoin', color: '#F7931A', pos: 'top-2 left-0' },
  { sym: 'ETH', sub: 'Ethereum', color: '#627EEA', pos: 'top-2 right-0' },
  { sym: 'SOL', sub: 'Solana', color: '#14F195', pos: 'bottom-6 left-2' },
  { sym: 'TRX', sub: 'TRON', color: '#FF060A', pos: 'bottom-6 right-2' },
];

function NetworkVisual() {
  // Decorative blockchain network: nodes + connecting lines with blue glow.
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" aria-hidden="true">
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

export default function GLandingHero() {
  return (
    <section id="beranda" className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.10), transparent 60%)' }} />
      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
        {/* Left column */}
        <div className="text-center lg:text-left">
          <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
            <Shield className="w-3.5 h-3.5" /> KEAMANAN ASET DIGITAL ANDA, PRIORITAS KAMI
          </span>
          <h1 className="ka-sec-title mt-5 text-[34px] sm:text-5xl lg:text-[54px]">
            Lindungi, Pantau,<br />
            Verifikasi <span className="ka-blue">Aset Kripto</span> Anda
          </h1>
          <p className="ka-text2 mt-5 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed">
            KriptoAman adalah platform keamanan aset digital yang membantu Anda melindungi,
            memantau, dan memverifikasi transaksi kripto secara real-time.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Mulai Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#fitur" className="ka-btn-outline inline-flex items-center justify-center px-6 text-sm sm:text-base">
              Pelajari Lebih Lanjut
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start">
            {INDICATORS.map(({ label }) => (
              <div key={label} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 ka-green" />
                <span className="text-xs sm:text-sm font-semibold ka-text2">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — illustration */}
        <div className="relative mx-auto w-full max-w-[420px] aspect-square">
          <NetworkVisual />
          <div className="absolute inset-0 flex items-center justify-center ka-glow-cyan rounded-full">
            <div className="ka-glow-gold rounded-full">
              <KriptoAmanLogo size={170} showText={false} animate={true} />
            </div>
          </div>
          {COINS.map((c) => (
            <div key={c.sym} className={`absolute ${c.pos} ka-coin-badge ka-glow w-14 h-14 flex-col`}>
              <span className="text-[13px] font-extrabold" style={{ color: c.color }}>{c.sym}</span>
              <span className="text-[8px] ka-text2 -mt-0.5">{c.sub}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="ka-text2 text-[11px] text-center mt-10 opacity-70">
        Ilustrasi coin logo menggunakan placeholder simbol. Untuk tampilan resmi, unggah SVG logo
        Bitcoin, Ethereum, Solana, dan TRON bereputasi.
      </p>
    </section>
  );
}