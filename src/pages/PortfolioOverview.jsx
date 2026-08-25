import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, BarChart3, Layers3, Radar, Sparkles, Zap, RefreshCw } from 'lucide-react';
import PortfolioStats from '../components/portfolio/PortfolioStats';
import AssetAllocationChart from '../components/portfolio/AssetAllocationChart';
import StrategyOverviewCard from '../components/portfolio/StrategyOverviewCard';
import { useLanguage } from '../lib/LanguageContext';

const QUERY_TIMEOUT_MS = 12000;

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = window.setTimeout(() => {
        window.clearTimeout(timer);
        reject(new Error(`${label} request timed out`));
      }, QUERY_TIMEOUT_MS);
    }),
  ]);
}

const COPY = {
  id: {
    kicker: 'KRIPTOAMAN PORTFOLIO INTELLIGENCE',
    title: 'Intelijen Portofolio',
    subtitle: 'Ringkasan strategi, simulasi, eksposur aset, dan performa berdasarkan data yang tersedia di workspace.',
    dataWorkspace: 'DATA WORKSPACE',
    strategies: 'STRATEGI',
    loadingTitle: 'Memuat data portofolio',
    loadingBody: 'KriptoAman sedang membaca strategi dan simulasi yang tersedia. Proses ini dibatasi waktu agar layar tidak berhenti pada status memuat.',
    errorTitle: 'Data portofolio belum dapat dimuat',
    errorBody: 'Koneksi data strategi atau simulasi sedang tidak tersedia. Anda dapat mencoba lagi tanpa kehilangan data yang sudah tersimpan.',
    retry: 'Coba lagi',
    emptyTitle: 'Belum ada portofolio yang tersedia',
    emptyBody: 'Workspace berfungsi normal. Metrik, alokasi aset, dan performa akan tampil ketika strategi atau simulasi tersedia.',
    readyTitle: 'Siap menerima strategi',
    readyBody: 'Strategi yang tersimpan akan masuk ke ringkasan performa dan eksposur sesuai data yang tersedia.',
    syncTitle: 'Pembaruan berkala',
    syncBody: 'Transaksi simulasi diperiksa berkala tanpa menampilkan angka placeholder.',
    signals: 'SINYAL PORTOFOLIO',
    metrics: 'Metrik Portofolio',
    matrix: 'MATRIKS STRATEGI',
    activeStrategies: 'Strategi Aktif',
    active: 'AKTIF',
    noActive: 'Belum ada strategi aktif',
  },
  en: {
    kicker: 'KRIPTOAMAN PORTFOLIO INTELLIGENCE',
    title: 'Portfolio Intelligence',
    subtitle: 'A strategy, simulation, asset-exposure, and performance summary based on data available in the workspace.',
    dataWorkspace: 'DATA WORKSPACE',
    strategies: 'STRATEGIES',
    loadingTitle: 'Loading portfolio data',
    loadingBody: 'KriptoAman is reading available strategy and simulation data. The request is time-limited so the screen cannot remain stuck loading.',
    errorTitle: 'Portfolio data could not be loaded',
    errorBody: 'Strategy or simulation data is temporarily unavailable. You can retry without losing stored data.',
    retry: 'Try again',
    emptyTitle: 'No portfolio data available yet',
    emptyBody: 'The workspace is operating normally. Metrics, allocation, and performance appear when strategy or simulation data becomes available.',
    readyTitle: 'Ready for strategy data',
    readyBody: 'Stored strategies flow into performance and exposure summaries according to the data available.',
    syncTitle: 'Periodic updates',
    syncBody: 'Simulation trades are checked periodically without filling the interface with placeholder values.',
    signals: 'PORTFOLIO SIGNALS',
    metrics: 'Portfolio Metrics',
    matrix: 'STRATEGY MATRIX',
    activeStrategies: 'Active Strategies',
    active: 'ACTIVE',
    noActive: 'No active strategies yet',
  },
};

export default function PortfolioOverview() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;

  const {
    data: strategies = [],
    isLoading: strategiesLoading,
    isError: strategiesError,
    refetch: refetchStrategies,
  } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => withTimeout(base44.entities.AutoTradingStrategy.list(), 'strategies'),
    retry: 1,
  });

  const {
    data: liveTrades = [],
    isLoading: liveTradesLoading,
    isError: liveTradesError,
    refetch: refetchLiveTrades,
  } = useQuery({
    queryKey: ['liveTrades'],
    queryFn: () => withTimeout(base44.entities.LivePaperTrade.list(), 'liveTrades'),
    retry: 1,
    refetchInterval: 15000,
  });

  const {
    data: paperTrades = [],
    isLoading: paperTradesLoading,
    isError: paperTradesError,
    refetch: refetchPaperTrades,
  } = useQuery({
    queryKey: ['paperTrades'],
    queryFn: () => withTimeout(base44.entities.PaperTrade.list(), 'paperTrades'),
    retry: 1,
  });

  const portfolioMetrics = useMemo(() => {
    let totalPortfolioValue = 0;
    let totalRealizedPL = 0;
    let totalUnrealizedPL = 0;
    const assetBreakdown = {};
    let activeCount = 0;
    let inactiveCount = 0;

    liveTrades.forEach(trade => {
      if (trade.status === 'open') {
        totalUnrealizedPL += Number(trade.unrealizedPL) || 0;
        totalPortfolioValue += (Number(trade.entryPrice) * Number(trade.quantity)) || 0;
      } else if (trade.status === 'closed') {
        totalRealizedPL += Number(trade.realizedPL) || 0;
      }
      const key = trade.assetClass || 'unknown';
      assetBreakdown[key] = (assetBreakdown[key] || 0) + Math.abs((Number(trade.quantity) * Number(trade.currentPrice)) || 0);
    });

    paperTrades.forEach(trade => {
      if (trade.status === 'completed' && trade.statistics) totalRealizedPL += Number(trade.statistics.totalPL) || 0;
    });

    strategies.forEach(strategy => {
      if (strategy.isActive === true) activeCount += 1;
      else inactiveCount += 1;
    });

    totalPortfolioValue += totalUnrealizedPL;

    return {
      totalPortfolioValue: Math.max(0, totalPortfolioValue),
      totalRealizedPL,
      totalUnrealizedPL,
      assetBreakdown,
      activeStrategies: activeCount,
      inactiveStrategies: inactiveCount,
      totalStrategies: strategies.length,
    };
  }, [liveTrades, paperTrades, strategies]);

  const activeStrategies = strategies.filter(strategy => strategy.isActive === true);
  const loading = strategiesLoading || liveTradesLoading || paperTradesLoading;
  const dataError = strategiesError || liveTradesError || paperTradesError;
  const empty = !loading && !dataError && !strategies.length && !liveTrades.length && !paperTrades.length;
  const retryAll = () => Promise.all([refetchStrategies(), refetchLiveTrades(), refetchPaperTrades()]);

  return (
    <div className="ka-bg ka-workspace-page min-h-screen pb-24 text-white sm:pb-28">
      <div className="mx-auto max-w-7xl space-y-4 px-4 pt-4 sm:space-y-5 sm:px-6 sm:pt-5 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7" aria-labelledby="portfolio-intelligence-title">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="ka-command-kicker"><Radar className="h-3.5 w-3.5" aria-hidden="true" /> {text.kicker}</p>
              <h1 id="portfolio-intelligence-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{text.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{text.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label={language === 'en' ? 'Portfolio data summary' : 'Ringkasan data portofolio'}>
              <span className="rounded-full border border-slate-700/60 bg-slate-900/55 px-3 py-2 text-[10px] font-bold text-slate-300">{text.dataWorkspace}</span>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-2 text-[10px] font-bold text-sky-300">{loading || dataError ? '—' : portfolioMetrics.totalStrategies} {text.strategies}</span>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="ka-command-panel overflow-hidden p-5 sm:p-7" role="status" aria-live="polite">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                <RefreshCw className="h-7 w-7 animate-spin text-sky-300" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-black">{text.loadingTitle}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{text.loadingBody}</p>
            </div>
          </section>
        ) : dataError ? (
          <section className="ka-command-panel overflow-hidden p-5 sm:p-7" role="alert">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
                <Activity className="h-7 w-7 text-amber-300" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-black">{text.errorTitle}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{text.errorBody}</p>
              <button type="button" onClick={retryAll} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 text-sm font-bold text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> {text.retry}
              </button>
            </div>
          </section>
        ) : empty ? (
          <section className="ka-command-panel overflow-hidden p-5 sm:p-7">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 sm:h-20 sm:w-20 sm:rounded-3xl">
                <BarChart3 className="h-8 w-8 text-sky-400 sm:h-9 sm:w-9" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-black sm:mt-5">{text.emptyTitle}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{text.emptyBody}</p>

              <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
                <div className="ka-command-tile p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10"><Zap className="h-5 w-5 text-sky-300" aria-hidden="true" /></span>
                    <div><p className="text-sm font-black text-white">{text.readyTitle}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{text.readyBody}</p></div>
                  </div>
                </div>
                <div className="ka-command-tile p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10"><RefreshCw className="h-5 w-5 text-emerald-300" aria-hidden="true" /></span>
                    <div><p className="text-sm font-black text-white">{text.syncTitle}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{text.syncBody}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="ka-command-panel p-4 sm:p-5" aria-labelledby="portfolio-metrics-title">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="ka-command-kicker"><Activity className="h-3.5 w-3.5" aria-hidden="true" /> {text.signals}</p><h2 id="portfolio-metrics-title" className="mt-2 text-lg font-black">{text.metrics}</h2></div>
              </div>
              <PortfolioStats metrics={portfolioMetrics} />
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="ka-command-panel overflow-hidden p-4 sm:p-5"><AssetAllocationChart breakdown={portfolioMetrics.assetBreakdown} /></section>
              <section className="ka-command-panel overflow-hidden p-4 sm:p-5"><StrategyOverviewCard active={portfolioMetrics.activeStrategies} inactive={portfolioMetrics.inactiveStrategies} total={portfolioMetrics.totalStrategies} /></section>
            </div>

            <section className="ka-command-panel p-4 sm:p-5" aria-labelledby="active-strategies-title">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="ka-command-kicker"><Layers3 className="h-3.5 w-3.5" aria-hidden="true" /> {text.matrix}</p><h2 id="active-strategies-title" className="mt-2 text-lg font-black">{text.activeStrategies}</h2></div>
                <Sparkles className="h-5 w-5 text-sky-400" aria-hidden="true" />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeStrategies.length > 0 ? activeStrategies.map(strategy => (
                  <div key={strategy.id} className="ka-command-tile p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-black text-white">{strategy.name}</p><p className="mt-1 text-xs text-slate-500">{strategy.pair} • {strategy.assetClass}</p></div><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300">{text.active}</span></div>
                    <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-slate-700/50 bg-slate-950/35 p-3"><p className="text-[9px] text-slate-500">P/L</p><p className="mt-1 text-sm font-black text-white">{Number(strategy.stats?.totalPL || 0).toLocaleString()}</p></div><div className="rounded-xl border border-slate-700/50 bg-slate-950/35 p-3"><p className="text-[9px] text-slate-500">WIN RATE</p><p className="mt-1 text-sm font-black">{Number(strategy.stats?.winRate || 0).toLocaleString()}%</p></div></div>
                  </div>
                )) : <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">{text.noActive}</div>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
