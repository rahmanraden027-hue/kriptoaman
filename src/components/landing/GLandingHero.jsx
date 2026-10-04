import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Shield } from 'lucide-react';

const GLandingHeroConsole = lazy(() => import('@/components/landing/GLandingHeroConsole'));

function HeroConsolePlaceholder() {
  return (
    <div
      className="ka-hero-console ka-hero-console-placeholder relative mx-auto flex min-h-[610px] w-full max-w-[560px] items-center justify-center"
      style={{ minHeight: 610 }}
      aria-label="Memuat KriptoAman Intelligence Core"
    >
      <div className="px-6 text-center">
        <span className="ka-console-kicker">KRIPTOAMAN · PRODUCTION COMMAND CENTER</span>
        <p className="ka-text2 mt-3 text-xs font-semibold tracking-[0.08em]">Memuat visual intelligence terverifikasi…</p>
      </div>
    </div>
  );
}

export default function GLandingHero({ stats, visualReady = true }) {
  return (
    <section id="beranda" className="ka-command-hero relative overflow-hidden px-4 pb-8 pt-8 sm:px-6 sm:pt-10">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14), transparent 62%)' }}
      />
      <div className="ka-hero-grid mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-8">
        <div className="ka-hero-copy text-center lg:text-left">
          <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
            <Shield className="h-3.5 w-3.5" /> KRIPTOAMAN · CRYPTO COMMAND CENTER
          </span>
          <p className="ka-hero-role mt-4 text-[11px] font-black uppercase tracking-[0.18em] ka-gold">LIVE PRODUCTION INTELLIGENCE</p>
          <h1 className="ka-sec-title mt-3 text-[34px] sm:text-5xl lg:text-[54px]">
            Market bergerak. Blockchain bergerak.<br />
            <span className="ka-blue">KriptoAman membuktikannya.</span>
          </h1>
          <p className="ka-text2 mx-auto mt-5 max-w-xl text-sm leading-relaxed sm:text-base lg:mx-0">
            Satu pusat kendali untuk market intelligence, ZEVARYQ live blocks, network operations, asset discovery, dan evidence verification. Data yang belum terverifikasi tetap gelap—bukan diisi angka buatan.
          </p>

          <div className="ka-text2 mt-5 flex flex-wrap items-center justify-center gap-2 text-[9px] font-black tracking-[.12em] lg:justify-start" aria-label="KriptoAman intelligence flow">
            <span className="rounded-full border border-blue-400/15 bg-blue-500/[.05] px-3 py-1.5">MARKET</span>
            <span className="ka-blue">→</span>
            <span className="rounded-full border border-blue-400/15 bg-blue-500/[.05] px-3 py-1.5">ON-CHAIN</span>
            <span className="ka-blue">→</span>
            <span className="rounded-full border border-blue-400/15 bg-blue-500/[.05] px-3 py-1.5">RISK</span>
            <span className="ka-gold">→</span>
            <span className="rounded-full border border-amber-400/15 bg-amber-400/[.05] px-3 py-1.5 ka-gold">EVIDENCE</span>
          </div>

          <div className="ka-hero-actions mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Open Command Center <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="ka-btn-outline ka-zvq-outline inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Open ZEVARYQ Explorer <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {visualReady ? (
          <Suspense fallback={<HeroConsolePlaceholder />}>
            <GLandingHeroConsole stats={stats} />
          </Suspense>
        ) : (
          <HeroConsolePlaceholder />
        )}
      </div>
      <p className="ka-text2 mt-5 text-center text-[10px] opacity-70">
        Data live ditampilkan hanya ketika sumber berhasil diverifikasi. Informasi ini untuk pemantauan, riset, dan edukasi; bukan rekomendasi investasi.
      </p>
    </section>
  );
}
