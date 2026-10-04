import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Radar, Search, AlertTriangle, ArrowRight, Cpu, Network,
  BarChart3, ChevronDown, Database, WalletCards, Activity, ExternalLink,
} from 'lucide-react';

const INTELLIGENCE_PILLARS = [
  {
    icon: BarChart3,
    eyebrow: 'MARKET INTELLIGENCE',
    title: 'Baca pasar dengan konteks',
    desc: 'Pantau aset kripto, momentum pasar, likuiditas, dominasi dan discovery dari sumber yang terhubung, dengan status serta waktu pembaruan yang jelas.',
    points: ['Crypto market data', 'Watchlist & market pulse', 'Data freshness & provenance'],
  },
  {
    icon: Search,
    eyebrow: 'ON-CHAIN INTELLIGENCE',
    title: 'Verifikasi aktivitas blockchain',
    desc: 'Periksa transaksi, alamat, token dan status jaringan melalui data on-chain serta explorer yang dapat ditelusuri.',
    points: ['Transaction verification', 'Address & token intelligence', 'Multi-chain monitoring'],
  },
  {
    icon: ShieldCheck,
    eyebrow: 'SECURITY INTELLIGENCE',
    title: 'Kenali risiko sebelum bertindak',
    desc: 'Gunakan sinyal risiko indikatif, pemeriksaan sumber dan konteks aktivitas untuk membantu proses verifikasi mandiri.',
    points: ['Risk indicators', 'Source verification', 'Security monitoring'],
  },
];

const FAQS = [
  { q: 'Apakah data yang tampil dibuat atau diestimasi?', a: 'Tidak untuk metrik yang dinyatakan live. KriptoAman menampilkan data yang berhasil diverifikasi dari sumber terhubung. Jika sumber belum dapat dikonfirmasi, status ditampilkan sebagai belum terverifikasi, terbatas, atau tidak tersedia.' },
  { q: 'Apakah KriptoAman menyimpan aset pengguna?', a: 'Tidak. KriptoAman berfokus pada informasi, pemantauan, intelligence dan verifikasi. ZEVARYQ Wallet menggunakan koneksi wallet untuk akses on-chain sesuai mekanisme yang tersedia.' },
  { q: 'Apakah hasil pemeriksaan merupakan rekomendasi investasi?', a: 'Tidak. Informasi pasar dan analisis risiko disediakan untuk pemantauan, riset dan edukasi. Keputusan akhir tetap memerlukan verifikasi mandiri.' },
];

function SectionHead({ eyebrow, title, body, center = false }) {
  return (
    <div className={center ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl'}>
      <span className="text-[11px] font-bold tracking-[0.18em] uppercase ka-cyan">{eyebrow}</span>
      <h2 className="ka-sec-title text-2xl sm:text-3xl mt-2">{title}</h2>
      {body ? <p className="ka-text2 mt-3 text-sm leading-6">{body}</p> : null}
    </div>
  );
}

export default function GLandingBody({ stats }) {
  const lastUpdated = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : null;
  const networkChecked = stats?.networkCheckedAt
    ? new Date(stats.networkCheckedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : null;
  const zvqChecked = stats?.zvqCheckedAt
    ? new Date(stats.zvqCheckedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const systemOk = Boolean(stats?.marketAvailable && stats.lastUpdated) &&
    (Date.now() - new Date(stats.lastUpdated).getTime()) < 60 * 60 * 1000;
  const verifiedNetworks = Array.isArray(stats?.networks)
    ? stats.networks.filter((network) => network?.status === 'online')
    : [];
  const featuredNetworks = [...verifiedNetworks]
    .sort((a, b) => Number(b?.name === 'ZEVARYQ Network') - Number(a?.name === 'ZEVARYQ Network'))
    .slice(0, 8);
  const assetCountValue = stats?.loading
    ? '…'
    : Number(stats?.assetCount) > 0
      ? Number(stats.assetCount).toLocaleString('id-ID')
      : '—';
  const networkCountValue = stats?.loading
    ? '…'
    : Number.isFinite(Number(stats?.networkActiveCount))
      ? String(Number(stats.networkActiveCount))
      : '—';
  const blockValue = stats?.loading
    ? '…'
    : stats?.zvqBlockNumber != null && Number.isFinite(Number(stats.zvqBlockNumber))
      ? Number(stats.zvqBlockNumber).toLocaleString('id-ID')
      : '—';
  const liveStateLabel = stats.loading ? 'Memeriksa' : systemOk ? 'Operasional' : 'Terbatas';
  const statusTimestampLabel = stats?.loading
    ? 'Memeriksa data live'
    : (lastUpdated || 'Belum terverifikasi');

  return (
    <>
      <section id="fitur" className="px-4 sm:px-6 py-10">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead
            eyebrow="KriptoAman Intelligence OS"
            title="SEE → UNDERSTAND → VERIFY."
            body="Satu bahasa intelligence KriptoAman: lihat perubahan, pahami sinyalnya, lalu telusuri bukti ke sumber."
          />

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {INTELLIGENCE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="ka-card2 flex min-w-[210px] flex-1 items-center gap-3 px-4 py-3 lg:min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl ka-card">
                    <Icon className="h-4 w-4 ka-blue" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black tracking-[0.12em] ka-cyan">{pillar.eyebrow}</p>
                    <p className="mt-1 truncate text-xs font-bold ka-text">{pillar.title}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ka-card mt-6 overflow-hidden">
            <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--ka-border)' }}>
              <div>
                <p className="text-[10px] font-black tracking-[0.16em] ka-cyan">LIVE PUBLIC PREVIEW</p>
                <h3 className="mt-1 text-xl font-black ka-text">Intelligence Workspace</h3>
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold ka-blue">Open full workspace <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid lg:grid-cols-3">
              <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--ka-border)' }}>
                <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 ka-blue" /><span className="text-xs font-black ka-text">Market Pulse</span></div>
                <p className="mt-4 text-2xl font-black ka-text">{assetCountValue} <span className="text-sm font-semibold ka-text2">assets monitored</span></p>
                <p className="mt-2 text-xs leading-5 ka-text2">Market database, asset discovery, watchlist dan status sumber data.</p>
              </div>
              <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--ka-border)' }}>
                <div className="flex items-center gap-2"><Network className="h-4 w-4 ka-blue" /><span className="text-xs font-black ka-text">Network Intelligence</span></div>
                <p className="mt-4 text-2xl font-black ka-text">{networkCountValue} <span className="text-sm font-semibold ka-text2">online</span></p>
                <p className="mt-2 text-xs leading-5 ka-text2">{networkChecked ? `Last verified ${networkChecked}.` : 'Memeriksa jaringan live…'}</p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 ka-gold" /><span className="text-xs font-black ka-text">Proof of Intelligence</span></div>
                <p className="mt-4 text-sm font-black ka-text">Source · Verified At · Status</p>
                <div className="mt-3 space-y-2 text-[11px] ka-text2">
                  <div className="flex items-center justify-between gap-3"><span>Market · {stats?.marketSource || 'unverified'}</span><b className={stats?.marketAvailable ? 'ka-green' : 'ka-gold'}>{stats?.marketAvailable ? 'VERIFIED' : 'UNVERIFIED'}</b></div>
                  <div className="flex items-center justify-between gap-3"><span>Network probes</span><b className={networkChecked ? 'ka-green' : 'ka-gold'}>{networkChecked ? 'VERIFIED' : 'UNVERIFIED'}</b></div>
                  <div className="flex items-center justify-between gap-3"><span>ZEVARYQ RPC · Chain 22028</span><b className={zvqChecked && blockValue !== '—' ? 'ka-green' : 'ka-gold'}>{zvqChecked && blockValue !== '—' ? 'VERIFIED' : 'UNVERIFIED'}</b></div>
                </div>
                <p className="mt-3 text-[10px] leading-5 ka-text2 opacity-75">{zvqChecked ? `ZEVARYQ verified ${zvqChecked}.` : statusTimestampLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="evidence-health" className="px-4 sm:px-6 py-8">
        <div className="max-w-[1440px] mx-auto grid gap-3 lg:grid-cols-3">
          <Link to="/SystemStatus" className="ka-card2 p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 ka-green shrink-0" />
            <div className="min-w-0"><p className="text-[10px] font-black tracking-[0.12em] ka-cyan">EVIDENCE HEALTH</p><p className="mt-1 text-sm font-black ka-text">{stats.loading ? 'Memeriksa data live' : systemOk ? 'Operational · verified sources' : 'Data services limited'}</p><p className="mt-1 text-[10px] ka-text2 truncate">{statusTimestampLabel}</p></div>
          </Link>
          <a href="https://explorer.kriptoaman.com/developer" target="_blank" rel="noreferrer" className="ka-card2 p-4 flex items-center gap-3">
            <Network className="h-5 w-5 ka-blue shrink-0" />
            <div><p className="text-[10px] font-black tracking-[0.12em] ka-cyan">NETWORK EVIDENCE</p><p className="mt-1 text-sm font-black ka-text">{networkCountValue} networks responding</p><p className="mt-1 text-[10px] ka-text2">Open verifiable network sources →</p></div>
          </a>
          <Link to="/wallet-app" className="ka-card2 p-4 flex items-center gap-3">
            <WalletCards className="h-5 w-5 ka-gold shrink-0" />
            <div><p className="text-[10px] font-black tracking-[0.12em] ka-cyan">ZEVARYQ GATEWAY</p><p className="mt-1 text-sm font-black ka-text">Wallet · Mainnet 22028</p><p className="mt-1 text-[10px] ka-text2">Separate execution gateway →</p></div>
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-[1100px] mx-auto ka-card ka-glow-cyan p-8 sm:p-12 text-center relative overflow-hidden">
          <ShieldCheck className="w-8 h-8 ka-blue mx-auto" />
          <p className="mt-4 text-[10px] font-black tracking-[0.18em] ka-cyan">KRIPTOAMAN INTELLIGENCE OS</p>
          <h2 className="ka-sec-title text-2xl sm:text-3xl mt-2">SEE → UNDERSTAND → VERIFY.</h2>
          <p className="ka-text2 text-sm mt-3 max-w-2xl mx-auto">Data, signal, risk dan evidence dalam satu command center. Eksekusi wallet tetap dipisahkan melalui ZEVARYQ.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm">Open Intelligence Hub <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/wallet-app" className="ka-btn-outline ka-zvq-outline inline-flex items-center justify-center gap-2 px-6 text-sm">ZEVARYQ Wallet <WalletCards className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
