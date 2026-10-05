import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const GLandingHeroConsole = lazy(() => import('@/components/landing/GLandingHeroConsole'));

function HeroConsolePlaceholder() {
  return (
    <div
      className="ka-hero-console ka-hero-console-placeholder relative mx-auto flex min-h-[460px] w-full max-w-[560px] items-center justify-center sm:min-h-[520px] lg:min-h-[410px] lg:max-w-[500px]"
      aria-label="Memuat KriptoAman Intelligence Core"
    >
      <div className="px-6 text-center">
        <span className="ka-console-kicker">KRIPTOAMAN · PRODUCTION COMMAND CENTER</span>
        <p className="ka-text2 mt-3 text-xs font-semibold tracking-[0.08em]">Memuat data produksi terverifikasi…</p>
      </div>
    </div>
  );
}

export default function GLandingHero({ stats, visualReady = true }) {
  return (
    <section id="beranda" className="ka-command-hero relative overflow-hidden px-4 pb-7 pt-6 sm:px-6 sm:pt-8 lg:flex lg:min-h-[calc(100svh-116px)] lg:items-center lg:py-4">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14), transparent 62%)' }}
      />
      <div className="ka-hero-grid mx-auto grid w-full max-w-[1440px] items-center gap-5 sm:gap-6 lg:grid-cols-[.92fr_1.08fr] lg:gap-6">
        <div className="ka-hero-copy text-center lg:text-left">
          <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.55)]" />
            KRIPTOAMAN · VERIFIED CRYPTO INTELLIGENCE
          </span>

          <h1 className="ka-sec-title mt-4 text-[34px] sm:text-5xl lg:mt-4 lg:text-[46px] lg:leading-[.98]">
            Data produksi, langsung terlihat.<br />
            <span className="ka-blue">Market · On-chain · Network · Evidence</span>
          </h1>
          <p className="ka-text2 mx-auto mt-3 max-w-xl text-[13px] leading-6 sm:text-[15px] lg:mx-0 lg:mt-3 lg:max-w-[540px] lg:text-[14px]">
            Market intelligence dan evidence jaringan ZEVARYQ, ditampilkan hanya dari sumber produksi yang dapat diverifikasi.
          </p>

          <div className="ka-hero-actions mt-5 flex flex-col justify-center gap-2.5 sm:flex-row lg:mt-5 lg:justify-start">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              Open Workspace <span aria-hidden="true">→</span>
            </Link>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="ka-btn-outline ka-zvq-outline inline-flex items-center justify-center gap-2 px-6 text-sm sm:text-base">
              ZEVARYQ Explorer <span aria-hidden="true">↗</span>
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
    </section>
  );
}
