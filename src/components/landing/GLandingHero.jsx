import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const GLandingHeroConsole = lazy(() => import('@/components/landing/GLandingHeroConsole'));

function HeroConsolePlaceholder() {
  return (
    <div
      className="ka-hero-console ka-hero-console-placeholder relative mx-auto flex min-h-[560px] w-full max-w-[560px] items-center justify-center"
      style={{ minHeight: 560 }}
      aria-label="Memuat KriptoAman Intelligence Core"
    >
      <div className="px-6 text-center">
        <span className="ka-console-kicker">KRIPTOAMAN · PRODUCTION COMMAND CENTER</span>
        <p className="ka-text2 mt-3 text-xs font-semibold tracking-[0.08em]">Memuat data produksi terverifikasi…</p>
      </div>
    </div>
  );
}

function metric(value, formatter = (item) => item) {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return formatter(numeric);
  return String(value).toUpperCase();
}

export default function GLandingHero({ stats, visualReady = true }) {
  const productionMetrics = [
    {
      label: 'MARKET ASSETS',
      value: metric(stats?.assetCount, (value) => value.toLocaleString('id-ID')),
      state: stats?.marketAvailable ? 'LIVE' : 'VERIFYING',
    },
    {
      label: 'ZVQ BLOCK',
      value: metric(stats?.zvqBlockNumber, (value) => '#' + value.toLocaleString('id-ID')),
      state: stats?.zvqBlockNumber != null ? 'LIVE' : 'VERIFYING',
    },
    {
      label: 'VERIFIED NETWORKS',
      value: metric(stats?.networkActiveCount),
      state: Number.isFinite(Number(stats?.networkActiveCount)) ? 'LIVE' : 'VERIFYING',
    },
    {
      label: 'ZVQ STATE',
      value: stats?.zvqSyncStatus ? String(stats.zvqSyncStatus).toUpperCase() : '—',
      state: stats?.zvqSyncStatus ? 'VERIFIED' : 'VERIFYING',
    },
  ];

  return (
    <section id="beranda" className="ka-command-hero relative overflow-hidden px-4 pb-8 pt-8 sm:px-6 sm:pt-10">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14), transparent 62%)' }}
      />
      <div className="ka-hero-grid mx-auto grid max-w-[1440px] items-center gap-7 lg:grid-cols-[1.08fr_.92fr] lg:gap-8">
        <div className="ka-hero-copy text-center lg:text-left">
          <span className="ka-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wide">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.55)]" />
            KRIPTOAMAN · VERIFIED CRYPTO INTELLIGENCE
          </span>

          <h1 className="ka-sec-title mt-5 text-[36px] sm:text-5xl lg:text-[54px]">
            Data produksi, langsung terlihat.<br />
            <span className="ka-blue">Market · On-chain · Network · Evidence</span>
          </h1>
          <p className="ka-text2 mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base lg:mx-0">
            KriptoAman menyatukan market intelligence dan bukti jaringan ZEVARYQ dalam satu command center. Nilai hanya ditampilkan ketika sumber produksi dapat diverifikasi.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="KriptoAman production snapshot">
            {productionMetrics.map((item) => (
              <div key={item.label} className="rounded-2xl border border-sky-400/12 bg-[#06111e]/78 px-3 py-3 text-left">
                <p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">{item.label}</p>
                <p className="mt-1.5 truncate text-lg font-black tabular-nums ka-text">{item.value}</p>
                <p className={"mt-1 text-[9px] font-black uppercase tracking-[.11em] " + (item.state === 'LIVE' || item.state === 'VERIFIED' ? 'text-emerald-300' : 'text-amber-300')}>
                  {item.state}
                </p>
              </div>
            ))}
          </div>

          <div className="ka-hero-actions mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
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
      <p className="ka-text2 mt-5 text-center text-[10px] opacity-70">
        Verified data only · unavailable values remain unavailable · no synthetic production metrics.
      </p>
    </section>
  );
}
