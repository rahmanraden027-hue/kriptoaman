import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ExternalLink, Globe2, ShieldCheck, WalletCards } from 'lucide-react';
import ZevaryqMark from '@/components/zevaryq-wallet/ZevaryqMark';
import { useLanguage } from '@/lib/LanguageContext';
import { DATA_STATE, isPositiveDataState, normalizeDataState } from '@/lib/dataState';
import CrossSurfaceRail from '@/components/command/CrossSurfaceRail';

const IDENTITY = Object.freeze({
  network: 'ZEVARYQ Mainnet',
  symbol: 'ZVQ',
  chainId: 22028,
  chainIdHex: '0x560c',
  rpc: 'https://rpc.kriptoaman.com',
  explorer: 'https://explorer.kriptoaman.com',
});

export default function ZEVARYQ() {
  const { language } = useLanguage();
  const en = language === 'en';
  const locale = en ? 'en-US' : 'id-ID';
  const [probe, setProbe] = useState({
    phase: 'checking',
    height: null,
    checkedAt: null,
    syncStatus: null,
    latencyMs: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const run = () => {
      fetch('/api/kam/network-status', {
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
        .then((response) => {
          if (!response.ok) throw new Error('Network status unavailable');
          return response.json();
        })
        .then((data) => {
          const valid = data?.verified === true
            && Number(data?.chainId) === IDENTITY.chainId
            && String(data?.chainIdHex).toLowerCase() === IDENTITY.chainIdHex;
          const height = Number(data?.blockNumber);
          const latency = Number(data?.probeDurationMs);
          setProbe({
            phase: valid ? 'verified' : 'pending',
            height: valid && Number.isSafeInteger(height) && height >= 0 ? height : null,
            checkedAt: valid ? (data.checkedAt || new Date().toISOString()) : null,
            syncStatus: valid && data?.syncStatus ? String(data.syncStatus).toUpperCase() : null,
            latencyMs: valid && Number.isFinite(latency) ? latency : null,
          });
        })
        .catch((error) => {
          if (error?.name !== 'AbortError') {
            setProbe({ phase: 'unavailable', height: null, checkedAt: null, syncStatus: null, latencyMs: null });
          }
        });
    };
    run();
    const timer = window.setInterval(run, 12000);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, []);

  const copy = en ? {
    eyebrow: 'ZEVARYQ · PRODUCTION NETWORK',
    title: 'ZEVARYQ Mainnet',
    intro: 'Live technical identity for the native ZVQ network. No unverified network value is promoted as production data.',
    verified: 'VERIFIED',
    checking: 'CHECKING',
    unavailable: 'UNAVAILABLE',
    latestBlock: 'Latest verified block',
    sync: 'Sync state',
    latency: 'Probe latency',
    endpoint: 'Public read-only endpoint',
    explorerSurface: 'Indexed explorer surface',
    exploration: 'Open Explorer',
    wallet: 'Open ZEVARYQ Wallet',
    docs: 'Network docs',
    provenanceTitle: 'Network provenance',
    publicGate: 'RPC identity verified; public-mainnet promotion remains a separate operational gate.',
    provenance: 'Legacy KAM naming was migrated to ZEVARYQ on the same network identity. Genesis, addresses, balances and historical blocks remain continuity data and are not presented as promotional content.',
  } : {
    eyebrow: 'ZEVARYQ · PRODUCTION NETWORK',
    title: 'ZEVARYQ Mainnet',
    intro: 'Identitas teknis live untuk jaringan native ZVQ. Nilai jaringan yang belum terverifikasi tidak dipromosikan sebagai data produksi.',
    verified: 'VERIFIED',
    checking: 'CHECKING',
    unavailable: 'UNAVAILABLE',
    latestBlock: 'Block terverifikasi terbaru',
    sync: 'Status sinkronisasi',
    latency: 'Latensi probe',
    endpoint: 'Endpoint publik read-only',
    explorerSurface: 'Surface explorer terindeks',
    exploration: 'Buka Explorer',
    wallet: 'Buka ZEVARYQ Wallet',
    docs: 'Dokumentasi jaringan',
    provenanceTitle: 'Provenance jaringan',
    publicGate: 'Identitas RPC terverifikasi; promosi mainnet publik tetap merupakan gerbang operasional terpisah.',
    provenance: 'Penamaan KAM lama dimigrasikan ke ZEVARYQ pada identitas jaringan yang sama. Genesis, alamat, saldo dan riwayat blok tetap menjadi data kontinuitas, bukan materi promosi.',
  };

  const stateText = probe.phase === 'verified' ? DATA_STATE.VERIFIED : probe.phase === 'checking' ? DATA_STATE.CHECKING : DATA_STATE.UNAVAILABLE;
  const live = probe.phase === 'verified';
  const syncState = live ? normalizeDataState(probe.syncStatus, DATA_STATE.VERIFIED) : stateText;
  const metrics = [
    ['CHAIN ID', IDENTITY.chainId + ' · ' + IDENTITY.chainIdHex, DATA_STATE.VERIFIED],
    ['NATIVE ASSET', 'ZEVARYQ (ZVQ)', DATA_STATE.VERIFIED],
    [copy.latestBlock.toUpperCase(), probe.height != null ? '#' + probe.height.toLocaleString(locale) : '—', stateText],
    [copy.sync.toUpperCase(), probe.syncStatus || '—', syncState],
  ];

  return (
    <main className="ka-bg min-h-screen px-4 pb-28 pt-5 text-white" data-product-surface="network" data-product-release="phase15f">
      <div className="mx-auto max-w-6xl space-y-4">
        <CrossSurfaceRail current="network" />
        <section className="ka-command-hero p-5 sm:p-7">
          <div className="relative z-10 grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <ZevaryqMark className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
            <div>
              <Link to="/" className="inline-flex min-h-8 items-center rounded-lg border border-sky-400/15 bg-sky-400/[.05] px-2.5 text-[9px] font-black tracking-[.14em] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/[.08]">
                KRIPTOAMAN · ON-CHAIN
              </Link>
              <p className="ka-command-kicker mt-2">{copy.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{copy.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{copy.intro}</p>
            </div>
            <div className="lg:text-right">
              <span className={'inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black tracking-[.12em] ' + (live ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300')}>
                {stateText}
              </span>
              {probe.checkedAt && <p className="mt-2 text-[9px] text-slate-500">{new Date(probe.checkedAt).toLocaleString(locale)}</p>}
              <p className="mt-2 max-w-[260px] text-[9px] leading-4 text-slate-500 lg:ml-auto">{copy.publicGate}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="ZEVARYQ production metrics">
          {metrics.map(([label, value, state]) => (
            <div key={label} className="ka-command-panel p-4">
              <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-500">{label}</p>
              <p className="mt-2 break-words text-base font-black text-white">{value}</p>
              <p className={'mt-1 text-[8px] font-black uppercase ' + (isPositiveDataState(state) ? 'text-emerald-300' : state === DATA_STATE.UNAVAILABLE ? 'text-amber-300' : 'text-cyan-300')}>{state}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <article className="ka-command-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sky-300"><Activity className="h-4 w-4" /><h2 className="text-sm font-black">RPC</h2></div>
              <span className={'text-[8px] font-black uppercase ' + (live ? 'text-emerald-300' : 'text-amber-300')}>{stateText}</span>
            </div>
            <p className="mt-3 break-all font-mono text-xs text-slate-300">{IDENTITY.rpc}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl border border-white/[.06] bg-black/20 p-3"><span className="text-slate-500">{copy.endpoint}</span><b className="mt-1 block text-slate-200">JSON-RPC</b></div>
              <div className="rounded-xl border border-white/[.06] bg-black/20 p-3"><span className="text-slate-500">{copy.latency}</span><b className="mt-1 block text-slate-200">{probe.latencyMs != null ? probe.latencyMs + ' ms' : '—'}</b></div>
            </div>
          </article>

          <article className="ka-command-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-300"><ShieldCheck className="h-4 w-4" /><h2 className="text-sm font-black">Explorer</h2></div>
              <span className="text-[8px] font-black uppercase text-sky-300">READ-ONLY</span>
            </div>
            <p className="mt-3 break-all font-mono text-xs text-slate-300">{IDENTITY.explorer}</p>
            <p className="mt-4 text-[10px] leading-5 text-slate-500">{copy.explorerSurface} · blocks · transactions · addresses · indexed evidence.</p>
          </article>
        </section>

        <nav className="grid gap-2 sm:grid-cols-3" aria-label="ZEVARYQ navigation">
          <a href={IDENTITY.explorer} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/[.06] px-4 text-xs font-black text-amber-200">{copy.exploration}<ExternalLink className="h-4 w-4" /></a>
          <Link to="/wallet-app" className="flex min-h-12 items-center justify-between rounded-xl border border-sky-400/20 bg-sky-400/[.06] px-4 text-xs font-black text-sky-200"><span className="flex items-center gap-2"><WalletCards className="h-4 w-4" />{copy.wallet}</span><ArrowRight className="h-4 w-4" /></Link>
          <Link to="/KAMNetworkDocs" className="flex min-h-12 items-center justify-between rounded-xl border border-sky-400/20 bg-sky-400/[.06] px-4 text-xs font-black text-sky-200"><span className="flex items-center gap-2"><Globe2 className="h-4 w-4" />{copy.docs}</span><ArrowRight className="h-4 w-4" /></Link>
        </nav>

        <details className="ka-command-panel p-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-black text-slate-300">{copy.provenanceTitle}</summary>
          <p className="mt-3 leading-6">{copy.provenance}</p>
        </details>
      </div>
    </main>
  );
}
