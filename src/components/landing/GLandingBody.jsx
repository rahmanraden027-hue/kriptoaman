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
      <section id="fitur" className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead
            eyebrow="KriptoAman Intelligence"
            title="Tiga lapisan intelligence. Satu pengalaman."
            body="Production V2 memusatkan data pasar, verifikasi on-chain, dan keamanan dalam hierarki yang lebih sederhana sehingga informasi penting dapat ditemukan tanpa memenuhi layar."
          />

          <div className="grid lg:grid-cols-3 gap-4 mt-8">
            {INTELLIGENCE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className="ka-card ka-v2-intelligence-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl ka-card2">
                      <Icon className="h-5 w-5 ka-blue" />
                    </span>
                    <span className="text-[9px] font-black tracking-[0.16em] ka-text2">{pillar.eyebrow}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-black ka-text">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-6 ka-text2">{pillar.desc}</p>
                  <div className="mt-5 space-y-2">
                    {pillar.points.map((point) => (
                      <div key={point} className="flex items-center gap-2 text-xs ka-text2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ka-green)]" />{point}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="ka-card ka-v2-livebar mt-6 p-4 sm:p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="ka-card2 p-4"><Database className="h-4 w-4 ka-blue" /><p className="mt-3 text-2xl font-black ka-text">{assetCountValue}</p><p className="mt-1 text-[11px] ka-text2">Cakupan Aset Pasar</p></div>
              <div className="ka-card2 p-4"><Network className="h-4 w-4 ka-blue" /><p className="mt-3 text-2xl font-black ka-text">{networkCountValue}</p><p className="mt-1 text-[11px] ka-text2">Jaringan Terverifikasi</p></div>
              <div className="ka-card2 p-4"><Activity className="h-4 w-4 ka-gold" /><p className="mt-3 text-2xl font-black ka-text">{blockValue}</p><p className="mt-1 text-[11px] ka-text2">ZEVARYQ Block</p></div>
              <div className="ka-card2 p-4"><ShieldCheck className="h-4 w-4 ka-green" /><p className="mt-3 text-lg font-black ka-text">{liveStateLabel}</p><p className="mt-1 text-[11px] ka-text2">Platform Data Status</p></div>
            </div>
            <p className="mt-3 text-[10px] leading-5 ka-text2 opacity-75">
              Live metrics berasal dari health contract dan sumber publik yang terhubung. Tidak ada angka sintetis ketika sumber tidak tersedia.
            </p>
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

      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead
              eyebrow="Network Intelligence"
              title="Jaringan Terverifikasi Live"
              body="Hanya jaringan yang berhasil merespons pemeriksaan publik terakhir yang diberi status live."
            />
            <a href="https://explorer.kriptoaman.com/developer" target="_blank" rel="noreferrer" className="text-sm font-bold ka-blue inline-flex items-center gap-2">Developer Center <ExternalLink className="h-4 w-4" /></a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-8">
            {featuredNetworks.length > 0 ? featuredNetworks.map((network) => (
              <div key={network.name} className="ka-card2 px-4 py-3 text-xs font-semibold ka-text2 flex items-center gap-2">
                <Network className="w-3.5 h-3.5 ka-blue" />
                <span className="min-w-0 flex-1 truncate">{network.name}</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] ka-green"><i className="w-1.5 h-1.5 rounded-full bg-[var(--ka-green)]" />Aktif · Live</span>
              </div>
            )) : (
              <div className="ka-card2 px-4 py-3 text-xs ka-text2">{stats.loading ? 'Memeriksa jaringan live…' : 'Verifikasi jaringan sedang diperbarui.'}</div>
            )}
          </div>
          <p className="text-[11px] ka-text2 mt-4 opacity-70">
            {networkChecked ? `Pemeriksaan terakhir: ${networkChecked}.` : 'Belum terverifikasi.'} Status provider dapat berubah dan tidak mengubah data tersimpan terakhir.
          </p>
        </div>
      </section>

      <section id="keamanan" className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead
            eyebrow="Security & Verification"
            title="Verifikasi lebih dulu. Klaim setelah ada bukti."
            body="Production V2 memisahkan data live, data terakhir yang pernah diverifikasi, kondisi terbatas, dan kondisi tidak tersedia."
          />
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="ka-card p-5"><Radar className="h-5 w-5 ka-blue" /><h3 className="mt-4 font-black ka-text">Source-aware</h3><p className="mt-2 text-xs leading-5 ka-text2">Data penting menyertakan sumber atau jalur verifikasi sehingga konteksnya dapat diperiksa.</p></div>
            <div className="ka-card p-5"><ShieldCheck className="h-5 w-5 ka-green" /><h3 className="mt-4 font-black ka-text">Last verified state</h3><p className="mt-2 text-xs leading-5 ka-text2">Ketika data live terputus, antarmuka tidak menggantinya dengan estimasi tanpa label.</p></div>
            <div className="ka-card p-5"><AlertTriangle className="h-5 w-5 ka-gold" /><h3 className="mt-4 font-black ka-text">Risk-aware</h3><p className="mt-2 text-xs leading-5 ka-text2">Sinyal risiko bersifat indikatif dan tidak ditampilkan sebagai jaminan keamanan atau hasil investasi.</p></div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead
            eyebrow="One Ecosystem · Two Products"
            title="KriptoAman Platform + ZEVARYQ Wallet"
            body="Platform intelligence dan wallet dipisahkan agar masing-masing memiliki fokus yang jelas tanpa kehilangan koneksi ke ZEVARYQ Mainnet."
          />
          <div className="grid lg:grid-cols-2 gap-4 mt-8">
            <Link to="/login" className="ka-card ka-product-card p-6 sm:p-8 block">
              <div className="flex items-center justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl ka-card2"><Database className="h-6 w-6 ka-blue" /></span><span className="text-[10px] font-black tracking-[0.16em] ka-blue">KRIPTOAMAN PLATFORM</span></div>
              <h3 className="mt-6 text-2xl font-black ka-text">Digital Asset Intelligence</h3>
              <p className="mt-3 text-sm leading-6 ka-text2">Market intelligence, on-chain verification, security intelligence, research dan multi-chain monitoring dalam satu workspace.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black ka-blue">Open Platform <ArrowRight className="h-4 w-4" /></span>
            </Link>
            <Link to="/wallet-app" className="ka-card ka-product-card ka-product-card-gold p-6 sm:p-8 block">
              <div className="flex items-center justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl ka-card2"><WalletCards className="h-6 w-6 ka-gold" /></span><span className="text-[10px] font-black tracking-[0.16em] ka-gold">ZEVARYQ WALLET</span></div>
              <h3 className="mt-6 text-2xl font-black ka-text">Native Gateway to ZEVARYQ</h3>
              <p className="mt-3 text-sm leading-6 ka-text2">ZVQ Mainnet access, verified balances, assets, send/receive flows dan Explorer integration dalam aplikasi wallet terpisah.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black ka-gold">Open ZEVARYQ Wallet <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </div>
          <div className="mt-4 ka-card2 p-4 flex flex-wrap items-center justify-between gap-3 text-xs ka-text2">
            <span>Powered by ZEVARYQ Network Infrastructure</span>
            <span className="font-black ka-gold">ZEVARYQ Mainnet · Chain ID 22028</span>
          </div>
        </div>
      </section>

      <section data-nosnippet="" className="px-4 sm:px-6 py-10">
        <div className="max-w-[1440px] mx-auto ka-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 ka-blue" />
              <div><h3 className="font-bold text-sm ka-text">Status Sistem</h3><p className="text-[10px] ka-text2">Production V2 verified data contract</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${stats.loading ? 'bg-[var(--ka-blue)]' : systemOk ? 'bg-[var(--ka-green)]' : 'bg-[var(--ka-gold)]'}`} />
              <span className="text-sm font-semibold">
                {stats.loading ? <span className="ka-blue">Memeriksa data live</span> : systemOk ? <span className="ka-green">Operasional</span> : <span className="ka-gold">Layanan data terbatas</span>}
              </span>
              <span className="text-[11px] ka-text2">• {statusTimestampLabel}</span>
            </div>
          </div>
          <p className="text-[11px] ka-text2 mt-3 opacity-75">
            Market source: {stats?.marketSource || 'Belum terverifikasi'} · ZEVARYQ: {zvqChecked || 'Belum terverifikasi'}.
          </p>
        </div>
      </section>

      <section id="faq" className="px-4 sm:px-6 py-14">
        <div className="max-w-[860px] mx-auto">
          <SectionHead eyebrow="FAQ" title="Pertanyaan penting" center />
          <div className="mt-8 flex flex-col gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="ka-card ka-faq p-4 group">
                <summary className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm ka-text">{f.q}</span>
                  <ChevronDown className="w-4 h-4 ka-text2 ka-faq-icon transition-transform" />
                </summary>
                <p className="text-xs ka-text2 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-[1100px] mx-auto ka-card ka-glow-cyan p-8 sm:p-12 text-center relative overflow-hidden">
          <ShieldCheck className="w-8 h-8 ka-blue mx-auto" />
          <p className="mt-4 text-[10px] font-black tracking-[0.18em] ka-cyan">KRIPTOAMAN PRODUCTION V2</p>
          <h2 className="ka-sec-title text-2xl sm:text-3xl mt-2">Intelligence yang lebih fokus. Data yang tetap dapat diverifikasi.</h2>
          <p className="ka-text2 text-sm mt-3 max-w-2xl mx-auto">Masuk ke workspace KriptoAman atau gunakan ZEVARYQ Wallet sebagai gateway terpisah ke ZEVARYQ Mainnet.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm">Open Intelligence Hub <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/wallet-app" className="ka-btn-outline ka-zvq-outline inline-flex items-center justify-center gap-2 px-6 text-sm">ZEVARYQ Wallet <WalletCards className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
