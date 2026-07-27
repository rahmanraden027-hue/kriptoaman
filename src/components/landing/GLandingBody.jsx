import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Activity, RefreshCw, LayoutGrid, Eye, Search, Bell, AlertTriangle,
  ArrowRight, Cpu, Network, Lock, BarChart3, ChevronDown, Smartphone,
} from 'lucide-react';

const FEATURES = [
  { icon: Shield, title: 'Lindungi Aset Anda', desc: 'Identifikasi risiko dan peringatan keamanan pada aset kripto.' },
  { icon: Activity, title: 'Pantau Secara Real-Time', desc: 'Pantau harga, perubahan pasar, dan aktivitas aset dari sumber data yang terhubung.' },
  { icon: RefreshCw, title: 'Verifikasi Transaksi', desc: 'Periksa status transaksi dan alamat melalui blockchain explorer yang tersedia.' },
  { icon: LayoutGrid, title: 'Kelola Pantauan Anda', desc: 'Kelola aset favorit dan notifikasi dalam satu dashboard.' },
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

const NETWORKS = ['Bitcoin', 'Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum', 'Base', 'Solana', 'TRON'];

const FAQS = [
  { q: 'Apakah KriptoAman menjamin keamanan aset saya?', a: 'Tidak. KriptoAman adalah platform informasi, pemantauan, dan analisis risiko. Kami tidak menyimpan atau menjamin dana Anda. Selalu lakukan verifikasi mandiri.' },
  { q: 'Apakah data statistik di halaman ini real-time?', a: 'Angka diambil dari database KriptoAman. Jika sumber belum tersedia atau gagal, kami menampilkan “—” atau “Data belum tersedia”.' },
  { q: 'Apakah verifikasi transaksi menyatakan transaksi aman?', a: 'Tidak. Verifikasi hanya memeriksa status transaksi dan alamat melalui blockchain explorer. Status keamanan akhir tetap penilaian Anda sendiri.' },
  { q: 'Apakah saya perlu KYC untuk mulai?', a: 'Anda dapat menjelajah informasi publik tanpa akun. Fitur pribadi seperti dashboard memerlukan login.' },
];

function StatValue({ value, loading }) {
  if (loading) return <span className="ka-text2">…</span>;
  return <span className="ka-blue">{value}</span>;
}

export default function GLandingBody({ stats }) {
  const lastUpdated = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const systemOk = stats?.assets > 0 && stats.lastUpdated &&
    (Date.now() - new Date(stats.lastUpdated).getTime()) < 15 * 60 * 1000;

  return (
    <>
      {/* FITUR RINGKAS */}
      <section id="fitur" className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <div className="ka-card ka-glow p-5 sm:p-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f, i) => (
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

      {/* STATISTIK PLATFORM */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-[1440px] mx-auto ka-card p-5 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sm ka-text">Statistik Platform</h2>
            <span className="text-[11px] ka-text2">Terakhir diperbarui: {lastUpdated || 'Data belum tersedia'}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Pengguna Terdaftar', value: stats?.users ?? '—' },
              { label: 'Pemeriksaan Dilakukan', value: stats?.screenings ?? '—' },
              { label: 'Aset yang Dipantau', value: stats?.assets ?? '—' },
              { label: 'Status Sistem', value: stats.loading ? '…' : (systemOk ? 'Operasional' : stats.assets > 0 ? 'Pemeliharaan' : '—') },
            ].map((s) => (
              <div key={s.label} className="ka-card2 p-4">
                <p className="text-2xl font-extrabold">
                  {typeof s.value === 'number' ? <StatValue value={s.value.toLocaleString('id-ID')} /> :
                   s.value === 'Operasional' ? <span className="ka-green">{s.value}</span> :
                   s.value === 'Pemeliharaan' ? <span className="ka-gold">{s.value}</span> :
                   <span className="ka-text2">{s.value}</span>}
                </p>
                <p className="text-[11px] ka-text2 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] ka-text2 mt-3 opacity-70">
            Angka bersumber dari database KriptoAman. Nilai yang tidak dapat diverifikasi ditampilkan “—”.
          </p>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section id="keamanan" className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-5">
          {/* Card 1 — Dashboard Keamanan */}
          <div className="ka-card ka-glow p-6 sm:p-8 flex flex-col">
            <h3 className="font-bold text-lg ka-text">Dashboard Keamanan</h3>
            <p className="text-sm ka-text2 mt-2">
              Ringkasan aset yang Anda pantau, peringatan, dan status pemeriksaan dalam satu tampilan.
            </p>
            <div className="ka-card2 p-4 mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 ka-blue" /><span className="text-xs ka-text2">Ringkasan Aset</span></div>
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 ka-blue" /><span className="text-xs ka-text2">Pantauan Real-Time</span></div>
              <div className="flex items-center gap-2"><Bell className="w-4 h-4 ka-gold" /><span className="text-xs ka-text2">Peringatan</span></div>
              <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 ka-cyan" /><span className="text-xs ka-text2">Status Pemeriksaan</span></div>
            </div>
            <p className="text-[11px] ka-text2 mt-3 opacity-70">
              Pengunjung yang belum login melihat preview tanpa saldo atau transaksi pribadi.
            </p>
            <Link to="/" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-5 mt-5 text-sm w-max">
              Buka Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2 — Verifikasi Transaksi */}
          <div className="ka-card ka-glow p-6 sm:p-8 flex flex-col">
            <h3 className="font-bold text-lg ka-text">Verifikasi Transaksi</h3>
            <p className="text-sm ka-text2 mt-2">
              Periksa status transaksi menggunakan hash transaksi dan jaringan blockchain.
            </p>
            <div className="flex items-center justify-center my-5">
              <div className="relative">
                <Smartphone className="w-20 h-20 ka-blue opacity-80" />
                <Shield className="w-8 h-8 ka-gold absolute -bottom-1 -right-1" />
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

      {/* CARA KERJA */}
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

      {/* JARINGAN DIDUKUNG */}
      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto">
          <SectionHead eyebrow="Jaringan" title="Jaringan yang Didukung" />
          <div className="flex flex-wrap gap-2.5 mt-8 justify-center">
            {NETWORKS.map((n) => (
              <span key={n} className="ka-card2 px-4 py-2 text-xs font-semibold ka-text2 inline-flex items-center gap-2">
                <Network className="w-3.5 h-3.5 ka-blue" /> {n}
              </span>
            ))}
          </div>
          <p className="text-[11px] ka-text2 mt-4 text-center opacity-70">
            Dukungan jaringan bergantung pada ketersediaan explorer dan koneksi data yang aktif.
          </p>
        </div>
      </section>

      {/* FITUR PEMERIKSAAN RISIKO */}
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

      {/* STATUS SISTEM */}
      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-[1440px] mx-auto ka-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 ka-blue" />
              <h3 className="font-bold text-sm ka-text">Status Sistem</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${systemOk ? 'bg-[var(--ka-green)]' : 'bg-[var(--ka-gold)]'} animate-pulse`} />
              <span className="text-sm font-semibold">
                {stats.loading ? 'Memeriksa…' : systemOk ? <span className="ka-green">Operasional</span> : <span className="ka-gold">Pemeliharaan</span>}
              </span>
              <span className="text-[11px] ka-text2">• {lastUpdated || 'Data belum tersedia'}</span>
            </div>
          </div>
          <p className="text-[11px] ka-text2 mt-3 opacity-70">
            Status diturunkan dari pemantauan layanan (data harga cache). Jika sumber gagal, status berubah menjadi Pemeliharaan.
          </p>
        </div>
      </section>

      {/* FAQ */}
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

      {/* CTA */}
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