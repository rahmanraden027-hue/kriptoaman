import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Radar, ShieldCheck, Wallet, Eye, Search, AlertTriangle,
  ArrowRight, Cpu, Network, Lock, BarChart3, ChevronDown,
} from 'lucide-react';

const FEATURES = [
  { icon: Shield, title: 'Lindungi Aset Anda', desc: 'Identifikasi risiko dan peringatan keamanan pada aset kripto.' },
  { icon: Radar, title: 'Pantau Real-time', desc: 'Pantau harga dan aktivitas aset dari sumber data yang terhubung, 24/7.' },
  { icon: ShieldCheck, title: 'Verifikasi Transaksi', desc: 'Periksa status transaksi dan keamanan smart contract melalui explorer.' },
  { icon: Wallet, title: 'Kelola Wallet Anda', desc: 'Kelola aset dan notifikasi dalam satu dashboard terpadu.' },
];

const RISK_FEATURES = [
  { icon: Search, title: 'Pemeriksaan Token', desc: 'Tinjau metadata dan sumber data token sebelum berinteraksi.' },
  { icon: AlertTriangle, title: 'Peringatan Risiko', desc: 'Notifikasi pada pola transaksi yang tidak biasa (analisis indikatif).' },
  { icon: Eye, title: 'Screening Alamat', desc: 'Cek alamat dompet melalui sumber data publik yang terhubung.' },
  { icon: BarChart3, title: 'Skor Risiko Indikatif', desc: 'Skor berdasarkan indikator aktivitas (bukan jaminan keamanan).' },
];

const STEPS = [
  { no: '01', title: 'Buat Akun', desc: 'Daftar dan amankan akun dengan PIN serta autentikasi.' },
  { no: '02', title: 'Hubungkan Sumber Data', desc: 'Tambahkan aset atau koneksi bursa untuk dipantau.' },
  { no: '03', title: 'Pantau & Verifikasi', desc: 'Lihat ringkasan risiko, harga, dan verifikasi transaksi.' },
  { no: '04', title: 'Kelola Notifikasi', desc: 'Atur peringatan dan aset favorit sesuai kebutuhan Anda.' },
];

const FAQS = [
  { q: 'Apakah KriptoAman menjamin keamanan aset saya?', a: 'Tidak. KriptoAman adalah platform informasi, pemantauan, dan analisis risiko. Kami tidak menyimpan atau menjamin dana Anda. Selalu lakukan verifikasi mandiri.' },
  { q: 'Apakah data statistik di halaman ini real-time?', a: 'Angka cakupan aset dan jaringan diambil dari health endpoint KriptoAman. Selama pemeriksaan live masih berlangsung, halaman menampilkan status pemeriksaan. Status terbatas hanya ditampilkan setelah verifikasi selesai dan data memang belum dapat dikonfirmasi.' },
  { q: 'Apakah verifikasi transaksi menyatakan transaksi aman?', a: 'Tidak. Verifikasi hanya memeriksa status transaksi dan alamat melalui blockchain explorer. Status keamanan akhir tetap penilaian Anda sendiri.' },
  { q: 'Apakah saya perlu KYC untuk mulai?', a: 'Anda dapat menjelajah informasi publik tanpa akun. Fitur pribadi seperti dashboard memerlukan login.' },
];

export default function GLandingBody({ stats }) {
  const lastUpdated = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : null;
  const networkChecked = stats?.networkCheckedAt
    ? new Date(stats.networkCheckedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const systemOk = Boolean(stats?.marketAvailable && stats.lastUpdated) &&
    (Date.now() - new Date(stats.lastUpdated).getTime()) < 60 * 60 * 1000;
  const verifiedNetworks = Array.isArray(stats?.networks)
    ? stats.networks.filter((network) => network?.status === 'online')
    : [];
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
  const statusTimestampLabel = stats?.loading
    ? 'Memeriksa data live'
    : (lastUpdated || 'Belum terverifikasi');

  return (
    <>
      <section id="fitur" className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <div className="ka-card ka-glow p-5 sm:p-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex flex-col items-start">
                  <div className="w-11 h-11 rounded-xl ka-card2 flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 ka-blue" />
                  </div>
                  <h3 className="font-bold text-sm ka-text mb-1.5">{f.title}</h3>
                  <p className="text-xs ka-text2 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-nosnippet="" className="ka-stats-section px-4 sm:px-6 py-6">
        <div className="ka-stats-card max-w-[1440px] mx-auto ka-card p-5 sm:p-7">
          <div className="ka-stats-head flex items-center justify-between mb-5">
            <h2 className="font-bold text-sm ka-text">Statistik Platform</h2>
            <span className="text-[11px] ka-text2">Terakhir diperbarui: {statusTimestampLabel}</span>
          </div>
          <div className="ka-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Cakupan Aset Pasar', value: assetCountValue },
              { label: 'Jaringan Aktif', value: networkCountValue },
              { label: 'Mata Uang Tampilan', value: 'IDR / USD' },
              { label: 'Status Data Pasar', value: stats.loading ? 'Memeriksa' : (systemOk ? 'Operasional' : 'Terbatas') },
            ].map((s) => (
              <div key={s.label} className="ka-stat-tile ka-card2 p-4">
                <p className="ka-stat-value text-2xl font-extrabold">
                  {s.value === 'Operasional' ? <span className="ka-green">{s.value}</span> :
                   s.value === 'Terbatas' ? <span className="ka-gold">{s.value}</span> :
                   s.value === 'Memeriksa' ? <span className="ka-blue">{s.value}</span> :
                   <span className="ka-text2">{s.value}</span>}
                </p>
                <p className="text-[11px] ka-text2 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] ka-text2 mt-3 opacity-70">
            Angka cakupan aset berasal dari snapshot Database Pasar KriptoAman. Jaringan Aktif hanya menghitung jaringan yang merespons pemeriksaan live terakhir.
          </p>
        </div>
      </section>

      <section id="keamanan" className="ka-security-preview px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-5">
          <div className="ka-card ka-glow p-6 sm:p-8 flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg ka-text">Dashboard Keamanan</h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] ka-blue ka-card2 px-2 py-1 rounded-full">Demo Interface</span>
            </div>
            <p className="text-sm ka-text2 mt-2">
              Gambaran antarmuka untuk pemantauan aset, watchlist, dan status verifikasi dalam satu dashboard yang mudah dipahami.
            </p>
            <div className="ka-card2 p-3 mt-4" aria-label="Contoh tampilan dashboard tanpa data finansial nyata">
              <div className="flex items-center justify-between text-[10px] ka-text2 mb-2">
                <span>Watchlist contoh</span>
                <span className="ka-blue">Mode demo</span>
              </div>
              <div className="space-y-1.5">
                {['BTC','ETH','SOL'].map((asset)=>(
                  <div key={asset} className="flex items-center justify-between text-[11px]">
                    <span className="ka-text font-semibold">{asset}</span>
                    <span className="ka-text2">Aset contoh</span>
                    <span className="ka-blue">Dipantau</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {['Pasar','Risiko','Aktivitas'].map((label)=>(
                  <div key={label} className="rounded-lg border px-2 py-3 text-center" style={{ borderColor: 'var(--ka-border)' }}>
                    <span className="text-[10px] ka-text2">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] ka-text2 mt-3 opacity-70">
              Preview ini hanya contoh antarmuka. Tidak menampilkan saldo, profit, performa investasi, atau data pengguna nyata.
            </p>
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-5 mt-5 text-sm w-max">
              Buka Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="ka-card ka-glow p-6 sm:p-8 flex flex-col">
            <h3 className="font-bold text-lg ka-text">Verifikasi Transaksi</h3>
            <p className="text-sm ka-text2 mt-2">
              Verifikasi status setiap transaksi melalui sistem pemeriksaan yang tersedia.
            </p>
            <div className="flex justify-center my-5">
              <div className="relative w-28 h-52 rounded-[18px] ka-card2 flex flex-col items-center justify-center gap-2 px-3">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full" style={{background:'var(--ka-border)'}} />
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background:'rgba(34,197,94,0.15)'}}>
                  <ShieldCheck className="w-6 h-6 ka-green" />
                </div>
                <span className="text-[11px] font-bold ka-green">Transaction Verified</span>
                <span className="text-[8px] ka-text2 text-center leading-tight">0x4a...e9f2 • Confirmed</span>
              </div>
            </div>
            <p className="text-[11px] ka-text2 opacity-70">
              KriptoAman tidak menyatakan transaksi “aman” sebelum pemeriksaan selesai.
            </p>
            <Link to="/TxHistory" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-5 mt-5 text-sm w-max">
              Cek Transaksi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead eyebrow="Cara Kerja" title="Cara Kerja KriptoAman" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {STEPS.map((s) => (
              <div key={s.no} className="ka-card p-5">
                <span className="text-xs font-bold ka-cyan">{s.no}</span>
                <h3 className="font-bold text-sm ka-text mt-2">{s.title}</h3>
                <p className="text-xs ka-text2 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead eyebrow="Jaringan" title="Jaringan Terverifikasi Live" />
          <div className="flex flex-wrap gap-2.5 mt-8 justify-center">
            {verifiedNetworks.length > 0 ? verifiedNetworks.map((network) => (
              <span key={network.name} className="ka-card2 px-4 py-2 text-xs font-semibold ka-text2 inline-flex items-center gap-2">
                <Network className="w-3.5 h-3.5 ka-blue" />
                {network.name}
                <span className="text-[9px] rounded-full px-1.5 py-0.5 ka-green">Aktif · Live</span>
              </span>
            )) : (
              <span className="ka-card2 px-4 py-2 text-xs ka-text2">{stats.loading ? 'Memeriksa jaringan live…' : 'Verifikasi jaringan sedang diperbarui.'}</span>
            )}
          </div>
          <p className="text-[11px] ka-text2 mt-4 text-center opacity-70 max-w-3xl mx-auto">
            Hanya jaringan yang berhasil merespons RPC, explorer, atau endpoint publik pada pemeriksaan terakhir yang ditampilkan sebagai Aktif · Live.
            {networkChecked ? ` Pemeriksaan terakhir: ${networkChecked}.` : ''}
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead eyebrow="Risiko" title="Fitur Pemeriksaan Risiko" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {RISK_FEATURES.map((f) => (
              <div key={f.title} className="ka-card p-5">
                <div className="w-10 h-10 rounded-lg ka-card2 flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 ka-blue" />
                </div>
                <h3 className="font-bold text-sm ka-text">{f.title}</h3>
                <p className="text-xs ka-text2 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="ka-card2 p-4 mt-6 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 ka-gold shrink-0 mt-0.5" />
            <p className="text-[11px] ka-text2 leading-relaxed">
              KriptoAman adalah platform informasi dan analisis risiko, bukan jaminan keamanan aset.
              Hasil pemeriksaan bersifat indikatif dan harus diverifikasi secara mandiri.
            </p>
          </div>
        </div>
      </section>

      <section data-nosnippet="" className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto ka-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 ka-blue" />
              <h3 className="font-bold text-sm ka-text">Status Sistem</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${stats.loading ? 'bg-[var(--ka-blue)]' : systemOk ? 'bg-[var(--ka-green)]' : 'bg-[var(--ka-gold)]'} animate-pulse`} />
              <span className="text-sm font-semibold">
                {stats.loading ? <span className="ka-blue">Memeriksa data live</span> : systemOk ? <span className="ka-green">Operasional</span> : <span className="ka-gold">Layanan data terbatas</span>}
              </span>
              <span className="text-[11px] ka-text2">• {statusTimestampLabel}</span>
            </div>
          </div>
          <p className="text-[11px] ka-text2 mt-3 opacity-70">
            Status memeriksa snapshot pasar internal dan health jaringan publik. Gangguan provider tidak mengubah data tersimpan terakhir yang masih tersedia.
          </p>
        </div>
      </section>

      <section id="faq" className="px-4 sm:px-6 py-14">
        <div className="max-w-[860px] mx-auto">
          <SectionHead eyebrow="FAQ" title="Pertanyaan Umum" center />
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

      <section id="tentang" className="px-4 sm:px-6 py-16">
        <div className="max-w-[1440px] mx-auto ka-card ka-glow-cyan p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(8,124,240,0.18), transparent 60%)' }} />
          <Lock className="w-8 h-8 ka-blue mx-auto" />
          <h2 className="ka-sec-title text-2xl sm:text-3xl mt-4">Mulai pantau aset kripto Anda</h2>
          <p className="ka-text2 text-sm mt-3 max-w-lg mx-auto">
            Buat akun untuk mengelola aset favorit, peringatan, dan verifikasi transaksi dalam satu dashboard.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm">
              Buat Akun <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="ka-btn-outline inline-flex items-center justify-center px-6 text-sm">
              Masuk
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({ eyebrow, title, center }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <span className="text-[11px] font-bold tracking-widest uppercase ka-cyan">{eyebrow}</span>
      <h2 className="ka-sec-title text-xl sm:text-2xl mt-1.5">{title}</h2>
    </div>
  );
}
