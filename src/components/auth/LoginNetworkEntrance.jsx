import React, { useEffect, useMemo, useState } from 'react';
import { Radio, ShieldCheck } from 'lucide-react';

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

function Metric({ label, value, live }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 backdrop-blur-md">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className={live ? 'h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.85)]' : 'h-2 w-2 rounded-full bg-slate-600'} />
        <span className={live ? 'text-[11px] font-black text-white' : 'text-[11px] font-black text-slate-400'}>{value}</span>
      </div>
    </div>
  );
}

export default function LoginNetworkEntrance({ language = 'id' }) {
  const [network, setNetwork] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    let active = true;
    let timer;

    const load = async () => {
      const [networkResult, explorerResult] = await Promise.allSettled([
        fetch('/api/kam/network-status', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        }).then(async response => {
          if (!response.ok) throw new Error('network status unavailable');
          const payload = await response.json();
          const chainId = Number(payload?.chainId);
          const chainHex = String(payload?.chainIdHex || '').toLowerCase();
          const blockNumber = Number(payload?.blockNumber);
          if (payload?.live !== true || payload?.verified !== true || chainId !== EXPECTED_CHAIN_ID || chainHex !== EXPECTED_CHAIN_HEX) {
            throw new Error('network identity not verified');
          }
          if (!Number.isSafeInteger(blockNumber) || blockNumber < 0) throw new Error('invalid block height');
          return payload;
        }),
        fetch(EXPLORER_BLOCKS, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        }).then(async response => {
          if (!response.ok) throw new Error('explorer unavailable');
          const payload = await response.json();
          if (!Array.isArray(payload?.items)) throw new Error('invalid explorer payload');
          return payload.items.map(readBlock).filter(Boolean).slice(0, 6);
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

  const copy = language === 'en'
    ? {
        kicker: 'LIVE NETWORK EVIDENCE',
        title: 'See the network before you sign in.',
        body: 'Read-only ZEVARYQ evidence is shown when verified sources respond. Account access remains available if network evidence is unavailable.',
        unavailable: 'UNAVAILABLE',
        verified: 'VERIFIED',
        indexed: 'INDEXED',
        readOnly: 'Read-only evidence · authentication is independent from blockchain telemetry',
      }
    : {
        kicker: 'BUKTI JARINGAN LIVE',
        title: 'Lihat jaringan sebelum masuk.',
        body: 'Bukti ZEVARYQ read-only ditampilkan hanya ketika sumber terverifikasi merespons. Akses akun tetap tersedia bila bukti jaringan tidak tersedia.',
        unavailable: 'UNAVAILABLE',
        verified: 'VERIFIED',
        indexed: 'INDEXED',
        readOnly: 'Bukti read-only · autentikasi tidak bergantung pada telemetri blockchain',
      };

  const displayBlocks = useMemo(() => blocks.slice(0, 5), [blocks]);
  const live = Boolean(network);
  const explorerLive = displayBlocks.length > 0;
  const blockNumber = Number(network?.blockNumber);
  const positions = [
    { left: '18%', top: '28%', rotate: '-8deg' },
    { left: '55%', top: '18%', rotate: '9deg' },
    { left: '67%', top: '48%', rotate: '-6deg' },
    { left: '46%', top: '68%', rotate: '7deg' },
    { left: '15%', top: '61%', rotate: '-10deg' },
  ];

  return (
    <section className="relative min-h-[300px] overflow-hidden rounded-[30px] border border-cyan-300/15 bg-[#020914] p-5 text-white shadow-[0_30px_100px_-42px_rgba(14,165,233,.75)] sm:min-h-[360px] sm:p-6 lg:min-h-[650px] lg:p-8">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_52%_45%,rgba(14,165,233,.24),transparent_28%),radial-gradient(circle_at_50%_60%,rgba(245,158,11,.10),transparent_42%),linear-gradient(180deg,#030b18_0%,#01050c_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[.13] [background-image:linear-gradient(rgba(56,189,248,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.16)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

      <div className="relative z-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">
          <Radio className="h-3.5 w-3.5" aria-hidden="true" /> {copy.kicker}
        </p>
        <h2 className="mt-4 max-w-lg text-2xl font-black tracking-[-0.035em] sm:text-3xl lg:text-4xl">{copy.title}</h2>
        <p className="mt-3 max-w-xl text-xs leading-6 text-slate-400 sm:text-sm">{copy.body}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Metric label="Chain ID" live={live} value={live ? String(network.chainId) : '—'} />
          <Metric label="RPC" live={live} value={live ? copy.verified : copy.unavailable} />
          <Metric label="Latest block" live={live} value={Number.isSafeInteger(blockNumber) ? '#' + blockNumber.toLocaleString('en-US') : '—'} />
          <Metric label="Explorer" live={explorerLive} value={explorerLive ? copy.indexed : copy.unavailable} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-5 h-[150px] max-w-[500px] sm:h-[190px] lg:mt-8 lg:h-[290px]">
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-[radial-gradient(circle_at_35%_28%,rgba(103,232,249,.36),rgba(3,15,29,.94)_50%,rgba(245,158,11,.16)_75%,rgba(2,7,17,.98)_100%)] shadow-[0_0_70px_rgba(14,165,233,.24)] sm:h-[168px] sm:w-[168px] lg:h-[220px] lg:w-[220px]" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[90px] w-[250px] -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] rounded-[50%] border border-amber-300/25 sm:h-[118px] sm:w-[330px] lg:h-[150px] lg:w-[430px]" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[124px] w-[280px] -translate-x-1/2 -translate-y-1/2 rotate-[24deg] rounded-[50%] border border-cyan-300/15 sm:h-[150px] sm:w-[360px] lg:h-[190px] lg:w-[470px]" />

        {displayBlocks.map((block, index) => {
          const pos = positions[index];
          return (
            <article
              key={block.hash}
              className="absolute w-[92px] rounded-xl border border-cyan-300/20 bg-[#041221]/92 p-2.5 shadow-[0_18px_50px_-24px_rgba(14,165,233,.9)] backdrop-blur-md sm:w-[108px]"
              style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -50%) rotate(' + pos.rotate + ')' }}
              aria-label={'Verified block ' + block.height}
            >
              <div className="flex items-center justify-between gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                <span className="text-[7px] font-black uppercase tracking-[0.12em] text-emerald-300">verified</span>
              </div>
              <p className="mt-2 text-[11px] font-black text-white">#{block.height.toLocaleString('en-US')}</p>
              <p className="mt-1 truncate text-[7px] font-bold text-slate-500">{shortHash(block.hash)}</p>
              <p className="mt-1.5 text-[7px] font-black uppercase tracking-[0.08em] text-amber-300">
                {block.txCount === null ? 'indexed block' : block.txCount + ' tx'}
              </p>
            </article>
          );
        })}

        {!explorerLive && (
          <div className="absolute left-1/2 top-1/2 w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.07] bg-[#020914]/86 px-4 py-3 text-center backdrop-blur-xl">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">Explorer evidence</p>
            <p className="mt-1 text-xs font-black text-slate-300">{copy.unavailable}</p>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <p className="max-w-md text-[9px] font-bold leading-4 text-slate-500">{copy.readOnly}</p>
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-600">
          {checkedAt ? checkedAt.toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID') : 'CHECKING'}
        </p>
      </div>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        ZEVARYQ network evidence: {live ? 'verified' : 'unavailable'}; Explorer blocks: {explorerLive ? 'indexed' : 'unavailable'}.
      </span>
    </section>
  );
}
