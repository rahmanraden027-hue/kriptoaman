import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, LogIn, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const REFRESH_MS = 15000;
const EXPLORER_BLOCKS = 'https://explorer.kriptoaman.com/api/v2/blocks';
const EXPECTED_CHAIN_ID = 22028;
const EXPECTED_CHAIN_HEX = '0x560c';

function readBlock(item) {
  const height = Number(item?.height);
  const hash = String(item?.hash || '');
  if (!Number.isSafeInteger(height) || height < 0 || !/^0x[0-9a-fA-F]{64}$/.test(hash)) return null;
  return {
    height,
    hash,
    timestamp: item?.timestamp || null,
    txCount: Number.isFinite(Number(item?.tx_count ?? item?.transaction_count))
      ? Number(item.tx_count ?? item.transaction_count)
      : null,
  };
}

function shortHash(value) {
  return typeof value === 'string' && value.length > 14
    ? value.slice(0, 8) + '…' + value.slice(-6)
    : '—';
}

function StatusPill({ label, ok, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 backdrop-blur-md">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className={ok ? 'h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.9)]' : 'h-2 w-2 rounded-full bg-slate-600'} />
        <span className={ok ? 'text-[11px] font-black text-white' : 'text-[11px] font-black text-slate-400'}>{value}</span>
      </div>
    </div>
  );
}

export default function NetworkGatePreview() {
  const [network, setNetwork] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    const previousTitle = document.title;
    const existingRobots = document.querySelector('meta[name="robots"]');
    const previousRobots = existingRobots?.getAttribute('content') || null;
    const robots = existingRobots || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'robots' }));
    document.title = 'ZEVARYQ Live Network Gate Preview | KriptoAman';
    robots.setAttribute('content', 'noindex,nofollow,noarchive');

    return () => {
      document.title = previousTitle;
      if (previousRobots === null) robots.remove();
      else robots.setAttribute('content', previousRobots);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      const [networkResult, explorerResult] = await Promise.allSettled([
        fetch('/api/kam/network-status', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        }).then(async response => {
          if (!response.ok) throw new Error('network status unavailable');
          const payload = await response.json();
          const chainId = Number(payload?.chainId);
          const chainHex = String(payload?.chainIdHex || '').toLowerCase();
          if (payload?.live !== true || payload?.verified !== true || chainId !== EXPECTED_CHAIN_ID || chainHex !== EXPECTED_CHAIN_HEX) {
            throw new Error('network identity not verified');
          }
          if (!Number.isSafeInteger(Number(payload?.blockNumber)) || Number(payload.blockNumber) < 0) {
            throw new Error('invalid latest block');
          }
          return payload;
        }),
        fetch(EXPLORER_BLOCKS, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        }).then(async response => {
          if (!response.ok) throw new Error('explorer blocks unavailable');
          const payload = await response.json();
          if (!Array.isArray(payload?.items)) throw new Error('invalid explorer payload');
          return payload.items.map(readBlock).filter(Boolean).slice(0, 7);
        }),
      ]);

      if (!active) return;
      setNetwork(networkResult.status === 'fulfilled' ? networkResult.value : null);
      setBlocks(explorerResult.status === 'fulfilled' ? explorerResult.value : []);
      setCheckedAt(new Date());
      timer = window.setTimeout(load, REFRESH_MS);
    };

    load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const latest = blocks[0] || null;
  const displayBlocks = useMemo(() => blocks.slice(0, 6), [blocks]);
  const live = Boolean(network);
  const explorerLive = displayBlocks.length > 0;
  const chainIdHex = live ? String(network.chainIdHex).toLowerCase() : EXPECTED_CHAIN_HEX;
  const blockNumber = Number(network?.blockNumber);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#01050d] text-white">
      <style>{`
        @keyframes zvq-float {
          0%, 100% { transform: translate3d(var(--x), calc(var(--y) + 0px), var(--z)) rotateX(58deg) rotateZ(45deg); }
          50% { transform: translate3d(var(--x), calc(var(--y) - 16px), var(--z)) rotateX(58deg) rotateZ(45deg); }
        }
        @keyframes zvq-pulse {
          0%, 100% { opacity: .35; transform: scale(.96); }
          50% { opacity: .9; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .zvq-cube, .zvq-pulse { animation: none !important; }
        }
      `}</style>

      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(14,165,233,.18),transparent_30%),radial-gradient(circle_at_50%_55%,rgba(245,158,11,.09),transparent_42%),linear-gradient(180deg,#020713_0%,#01040a_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[.16] [background-image:linear-gradient(rgba(56,189,248,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.18)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]" />

      <header className="relative z-30 border-b border-white/[0.06] bg-[#01050d]/70 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            <img src="/brand/kriptoaman-mark-premium.webp" alt="" className="h-8 w-8 rounded-lg object-cover" width="32" height="32" />
            <span className="text-sm font-black tracking-[0.12em]">KRIPTOAMAN</span>
          </Link>
          <span className="hidden text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 sm:inline">Phase 11A · Preview · Read only</span>
          <div className="ml-auto flex items-center gap-2">
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/[0.08] px-4 text-[10px] font-black text-slate-300 hover:border-cyan-300/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:inline-flex">
              Explorer <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Link to="/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-400 px-4 text-[10px] font-black text-[#021018] shadow-[0_12px_34px_-16px_rgba(34,211,238,.9)] hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Masuk <LogIn className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1500px] items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[.78fr_1.22fr] lg:px-8 lg:py-10">
        <div className="relative z-20 max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">
            <Radio className="h-3.5 w-3.5" /> Live Network Gate
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            ZEVARYQ
            <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-300 bg-clip-text text-transparent">verified block flow.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
            Layar masuk berbasis data jaringan nyata. Blok hanya ditampilkan ketika Explorer mengembalikan record yang tervalidasi.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatusPill label="Chain ID" ok={live} value={live ? String(network.chainId) : '—'} />
            <StatusPill label="Latest block" ok={live} value={Number.isSafeInteger(blockNumber) ? '#' + blockNumber.toLocaleString('en-US') : '—'} />
            <StatusPill label="RPC" ok={live} value={live ? 'Verified' : 'Unavailable'} />
            <StatusPill label="Explorer" ok={explorerLive} value={explorerLive ? 'Indexed' : 'Unavailable'} />
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-[#021018] shadow-[0_18px_50px_-22px_rgba(34,211,238,.95)] hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Masuk <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.03] px-5 text-sm font-black text-white hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              Buka Explorer <ExternalLink className="h-4 w-4" />
            </a>
            <Link to="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-5 text-sm font-black text-amber-200 hover:border-amber-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              Masuk ke KriptoAman
            </Link>
          </div>

          <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
            {checkedAt ? 'Last read-only refresh ' + checkedAt.toLocaleTimeString('id-ID') : 'Connecting to verified read paths…'}
          </p>
        </div>

        <div className="relative min-h-[460px] sm:min-h-[560px] lg:min-h-[680px]">
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 bg-[radial-gradient(circle_at_35%_30%,rgba(56,189,248,.28),rgba(2,7,17,.96)_52%,rgba(245,158,11,.12)_72%,rgba(2,7,17,.98)_100%)] shadow-[0_0_100px_rgba(14,165,233,.18)] sm:h-[470px] sm:w-[470px] lg:h-[560px] lg:w-[560px]" />
          <div aria-hidden="true" className="zvq-pulse absolute left-1/2 top-1/2 h-[410px] w-[410px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 sm:h-[550px] sm:w-[550px] lg:h-[650px] lg:w-[650px]" style={{ animation: 'zvq-pulse 4.8s ease-in-out infinite' }} />
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[230px] w-[430px] -translate-x-1/2 -translate-y-1/2 rotate-[-17deg] rounded-[50%] border border-amber-300/20 sm:h-[300px] sm:w-[600px] lg:h-[340px] lg:w-[720px]" />

          <div className="absolute inset-0 [perspective:1200px]" aria-label="Verified recent ZEVARYQ blocks">
            {displayBlocks.map((block, index) => {
              const positions = [
                ['-210px', '-105px', '80px'],
                ['-80px', '-205px', '10px'],
                ['90px', '-145px', '120px'],
                ['180px', '-20px', '35px'],
                ['55px', '115px', '95px'],
                ['-145px', '85px', '30px'],
              ];
              const [x, y, z] = positions[index] || ['0px', '0px', '0px'];
              return (
                <article
                  key={block.hash}
                  className="zvq-cube absolute left-1/2 top-1/2 w-[118px] rounded-2xl border border-cyan-300/25 bg-[#041222]/90 p-3 shadow-[0_22px_70px_-24px_rgba(14,165,233,.95)] backdrop-blur-lg"
                  style={{
                    '--x': x,
                    '--y': y,
                    '--z': z,
                    animation: 'zvq-float 5.8s ease-in-out infinite',
                    animationDelay: (index * -0.62) + 's',
                    transform: `translate3d(${x}, ${y}, ${z}) rotateX(58deg) rotateZ(45deg)`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-emerald-300">verified</span>
                  </div>
                  <p className="mt-3 text-sm font-black text-white">#{block.height.toLocaleString('en-US')}</p>
                  <p className="mt-1 truncate text-[8px] font-bold text-slate-500">{shortHash(block.hash)}</p>
                  <p className="mt-2 text-[8px] font-black uppercase tracking-[0.1em] text-amber-300">
                    {block.txCount === null ? 'Indexed block' : block.txCount + ' tx'}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-1/2 w-[min(92%,620px)] -translate-x-1/2 rounded-[24px] border border-white/[0.08] bg-[#030914]/88 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">Network identity</p>
                <p className="mt-1 text-sm font-black text-white">ZEVARYQ Mainnet · ZVQ</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">Chain</p>
                <p className="mt-1 text-sm font-black text-cyan-300">{live ? chainIdHex : '—'}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="text-slate-500">Indexed tip</span>
                <b className="mt-1 block text-white">{latest ? '#' + latest.height.toLocaleString('en-US') : 'Unavailable'}</b>
              </div>
              <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="text-slate-500">Latest hash</span>
                <b className="mt-1 block text-white">{latest ? shortHash(latest.hash) : '—'}</b>
              </div>
              <div className="col-span-2 rounded-xl bg-white/[0.03] px-3 py-2 sm:col-span-1">
                <span className="text-slate-500">Presentation</span>
                <b className="mt-1 block text-emerald-300">{live && explorerLive ? 'Live evidence' : 'Fail-closed'}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        ZEVARYQ Network Gate status: {live ? 'network verified' : 'network unavailable'}; {explorerLive ? displayBlocks.length + ' verified Explorer blocks loaded' : 'Explorer blocks unavailable'}.
      </span>
    </main>
  );
}
