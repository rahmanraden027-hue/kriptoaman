import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ExternalLink, Globe2, ShieldCheck, WalletCards } from 'lucide-react';
import ZevaryqMark from '@/components/zevaryq-wallet/ZevaryqMark';
import { useLanguage } from '@/lib/LanguageContext';

const IDENTITY = Object.freeze({
  network: 'ZEVARYQ Mainnet', symbol: 'ZVQ', chainId: 22028,
  rpc: 'https://rpc.kriptoaman.com', explorer: 'https://explorer.kriptoaman.com',
});

export default function ZEVARYQ() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [probe, setProbe] = useState({ phase: 'checking', height: null, checkedAt: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/kam/network-status', { cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => { if (!response.ok) throw new Error('Network status unavailable'); return response.json(); })
      .then((data) => {
        const valid = data?.verified === true &&
          Number(data?.chainId) === IDENTITY.chainId &&
          String(data?.chainIdHex).toLowerCase() === '0x560c';
        const height = Number(data?.blockNumber);
        setProbe({
          phase: valid ? 'verified-rpc' : 'pending',
          height: valid && Number.isSafeInteger(height) && height >= 0 ? height : null,
          checkedAt: valid ? new Date().toLocaleString() : null,
        });
      })
      .catch((error) => { if (error?.name !== 'AbortError') setProbe({ phase: 'unavailable', height: null, checkedAt: null }); });
    return () => controller.abort();
  }, []);

  const copy = en ? {
    eyebrow: 'VERIFIABLE NETWORK IDENTITY', title: 'ZEVARYQ Network',
    intro: 'The native ZVQ network of the KriptoAman ecosystem. Technical data is shown only when the official RPC confirms Chain ID 22028.',
    verified: 'RPC identity verified · public-mainnet promotion is a separate gate',
    pending: 'Public verification pending', unavailable: 'Public status unavailable',
    candidate: 'Mainnet candidate — promotion subject to independent operational evidence',
    migration: 'Legacy KAM was renamed in place. Chain ID, genesis, wallet addresses, balances, and historical blocks are preserved by design.',
    exploration: 'Open ZEVARYQ Explorer', wallet: 'Open KriptoAman Wallet',
    docs: 'Network documentation', roadmap: '12 support systems and 25-country expansion are roadmap targets. Live operational claims require independently verifiable evidence.',
  } : {
    eyebrow: 'IDENTITAS JARINGAN TERVERIFIKASI', title: 'ZEVARYQ Network',
    intro: 'Jaringan native ZVQ dalam ekosistem KriptoAman. Data teknis hanya ditampilkan ketika RPC resmi mengonfirmasi Chain ID 22028.',
    verified: 'Identitas RPC terverifikasi · promosi mainnet publik memerlukan gerbang terpisah',
    pending: 'Verifikasi publik masih menunggu', unavailable: 'Status publik belum tersedia',
    candidate: 'Kandidat mainnet — promosi menunggu bukti operasional independen',
    migration: 'KAM lama mengalami rebranding pada jaringan yang sama. Chain ID, genesis, alamat dompet, saldo, dan riwayat blok dipertahankan.',
    exploration: 'Buka ZEVARYQ Explorer', wallet: 'Buka KriptoAman Wallet',
    docs: 'Dokumentasi jaringan', roadmap: 'Dua belas sistem pendukung dan ekspansi 25 negara merupakan target roadmap. Status operasional memerlukan bukti independen.',
  };
  const stateLabel = probe.phase === 'verified-rpc' ? copy.verified : probe.phase === 'unavailable' ? copy.unavailable : copy.pending;

  return <main className="min-h-screen bg-[#061426] px-4 pb-24 pt-8 text-white">
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="rounded-[28px] border border-[#168BFA]/30 bg-gradient-to-br from-[#10345B] via-[#061426] to-[#061426] p-6 sm:p-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <ZevaryqMark className="h-24 w-24 shrink-0" />
          <div><p className="text-xs font-black tracking-[.18em] text-[#E7B95F]">{copy.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{copy.intro}</p>
          </div>
        </div>
        <div role="status" className="mt-6 rounded-2xl border border-[#18D7B2]/25 bg-[#18D7B2]/5 p-4 text-sm text-slate-200">
          <span className={probe.phase === 'verified-rpc' ? 'text-[#18D7B2]' : 'text-[#E7B95F]'}>{stateLabel}</span>
          <p className="mt-1 text-xs text-slate-400">{copy.candidate}</p>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-3" aria-label="Network metadata">
        {[['Network', IDENTITY.network], ['Chain ID', '22028 · 0x560c'], ['Native asset', 'ZEVARYQ (ZVQ)']].map(([label, value]) =>
          <div key={label} className="rounded-2xl border border-[#168BFA]/20 bg-[#10345B]/35 p-5"><p className="text-xs uppercase tracking-widest text-slate-400">{label}</p><p className="mt-3 text-xl font-bold">{value}</p></div>
        )}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#168BFA]/20 bg-[#10345B]/25 p-6">
          <div className="flex items-center gap-2 text-[#18D7B2]"><Activity size={19}/><h2 className="font-bold">RPC</h2></div>
          <p className="mt-3 break-all text-sm text-slate-200">{IDENTITY.rpc}</p>
          <p className="mt-2 text-xs text-slate-400">{probe.phase === 'verified-rpc' && probe.height != null ? `Block ${probe.height.toLocaleString()} · ${probe.checkedAt}` : stateLabel}</p>
        </div>
        <div className="rounded-2xl border border-[#168BFA]/20 bg-[#10345B]/25 p-6">
          <div className="flex items-center gap-2 text-[#E7B95F]"><ShieldCheck size={19}/><h2 className="font-bold">{en ? 'Migration integrity' : 'Integritas migrasi'}</h2></div>
          <p className="mt-3 text-sm leading-7 text-slate-300">{copy.migration}</p>
        </div>
      </section>
      <nav className="grid gap-3 sm:grid-cols-3" aria-label="ZEVARYQ navigation">
        <a href={IDENTITY.explorer} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between rounded-xl border border-[#E7B95F]/30 bg-[#E7B95F]/10 px-5 py-4 text-sm font-bold text-[#E7B95F]">{copy.exploration}<ExternalLink size={18}/></a>
        <Link to="/Wallet" className="flex min-h-12 items-center justify-between rounded-xl border border-[#168BFA]/30 bg-[#168BFA]/10 px-5 py-4 text-sm font-bold text-sky-200"><span className="flex items-center gap-2"><WalletCards size={18}/>{copy.wallet}</span><ArrowRight size={18}/></Link>
        <Link to="/KAMNetworkDocs" className="flex min-h-12 items-center justify-between rounded-xl border border-[#168BFA]/30 bg-[#168BFA]/10 px-5 py-4 text-sm font-bold text-sky-200"><span className="flex items-center gap-2"><Globe2 size={18}/>{copy.docs}</span><ArrowRight size={18}/></Link>
      </nav>
      <p className="rounded-2xl border border-[#E7B95F]/20 p-5 text-xs leading-6 text-slate-400">{copy.roadmap}</p>
    </div>
  </main>;
}
