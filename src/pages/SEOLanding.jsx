import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, TrendingUp, Lock, ArrowRight, Eye, Network, Award } from 'lucide-react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import TrustBadges from '../components/trust/TrustBadges';

const FEATURES = [
  { icon: Shield, title: 'Informasi Transparan', desc: 'Status fitur, sumber data, dan batasan layanan dijelaskan secara terbuka.' },
  { icon: Lock, title: 'Keamanan Akun', desc: '2FA, riwayat sesi terverifikasi server, dan kontrol keamanan akun tersedia untuk membantu melindungi akses pengguna.' },
  { icon: TrendingUp, title: 'Market Intelligence', desc: 'Pantau harga, tren, dan data pasar aset digital dari sumber yang tersedia.' },
  { icon: Eye, title: 'Watch-Only Portfolio', desc: 'Hubungkan alamat publik untuk pemantauan portofolio tanpa menyerahkan seed phrase atau private key.' },
  { icon: Network, title: 'Pemantauan Multi-Network', desc: 'Pantau jaringan blockchain dan status konektivitas yang didukung berdasarkan data yang tersedia.' },
  { icon: Award, title: 'Edukasi & Insight', desc: 'Gunakan materi edukasi dan indikator risiko sebagai referensi tambahan untuk keputusan mandiri.' },
];

const UPDATES = [
  { name: '📊 Market Intelligence', role: 'Fokus Produk', text: 'KriptoAman dikembangkan sebagai platform informasi, pemantauan, dan analisis risiko aset digital.' },
  { name: '✅ Informasi Transparan', role: 'Status Layanan', text: 'Status layanan, sumber data, dan batasan fitur ditampilkan secara terbuka selama pengembangan.' },
  { name: '📱 Aplikasi Android', role: 'Persiapan Rilis', text: 'Versi Android terus diuji untuk memastikan pengalaman pemantauan yang stabil dan konsisten.' },
];

const STATS = [
  { value: '—', label: 'Pengguna Terverifikasi' },
  { value: '—', label: 'Pemeriksaan Dilakukan' },
  { value: '—', label: 'Uptime Terukur' },
  { value: '—', label: 'Aset yang Dipantau' },
];

export default function SEOLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <section className="px-4 pt-10 pb-16 text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-4"><KriptoAmanLogo size={56} showText={false} /></div>
        <h1 className="text-3xl font-extrabold leading-tight mb-3">
          Platform <span className="text-cyan-400">Market Intelligence Kripto</span><br />untuk Pemantauan yang Lebih Transparan
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          KriptoAman adalah platform informasi, pemantauan, dan analisis risiko aset digital. KriptoAman bukan exchange, broker, penyelenggara perdagangan, atau kustodian aset kripto.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={createPageUrl('Home')} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            Mulai Memantau <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to={createPageUrl('Edukasi')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-colors">
            Pelajari Aset Digital
          </Link>
        </div>
        <div className="mt-8"><TrustBadges compact /></div>
      </section>

      <section className="px-4 pb-12 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
              <div className="text-xl font-extrabold text-cyan-400">{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-12 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-center mb-2 text-white">Transparansi & Keamanan</h2>
        <p className="text-slate-500 text-xs text-center mb-5">Status data dan batasan layanan ditampilkan secara terbuka untuk membantu pengguna mengambil keputusan mandiri.</p>
        <TrustBadges />
      </section>

      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Fokus <span className="text-cyan-400">KriptoAman</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-cyan-400" /></div>
              <div><div className="font-semibold text-sm text-white">{title}</div><div className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Cara Menggunakan KriptoAman</h2>
        <div className="space-y-3">
          {[
            { step: '01', title: 'Buat Akun', desc: 'Daftar untuk mengakses fitur pemantauan dan keamanan akun.' },
            { step: '02', title: 'Lengkapi Keamanan', desc: 'Aktifkan 2FA dan tinjau perangkat atau sesi login yang terverifikasi server.' },
            { step: '03', title: 'Pantau Pasar & Jaringan', desc: 'Lihat data harga, tren, jaringan, dan indikator yang tersedia dari sumber terhubung.' },
            { step: '04', title: 'Hubungkan Alamat Publik', desc: 'Gunakan mode watch-only untuk memantau alamat publik tanpa memberikan seed phrase atau private key.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-extrabold text-sm flex items-center justify-center shrink-0">{step}</div>
              <div><div className="font-semibold text-sm text-white">{title}</div><div className="text-slate-400 text-xs mt-0.5">{desc}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Pembaruan KriptoAman</h2>
        <div className="space-y-3">
          {UPDATES.map(item => (
            <div key={item.name} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
              <p className="text-slate-300 text-sm">{item.text}</p>
              <div className="mt-2 text-xs text-slate-500">{item.name} · {item.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">FAQ — Pertanyaan Umum</h2>
        <div className="space-y-3">
          {[
            { q: 'Apakah KriptoAman merupakan exchange atau kustodian?', a: 'Tidak. KriptoAman saat ini berfungsi sebagai platform informasi, pemantauan, dan analisis risiko aset digital.' },
            { q: 'Apakah saya dapat deposit atau menarik dana melalui KriptoAman?', a: 'Tidak pada versi publik saat ini. Fitur deposit, penarikan, perdagangan, swap, lending, dan eksekusi transaksi tidak diaktifkan.' },
            { q: 'Apa fungsi wallet di KriptoAman?', a: 'Wallet publik berfungsi dalam mode watch-only untuk membantu memantau alamat publik yang Anda hubungkan. KriptoAman tidak meminta seed phrase atau private key.' },
            { q: 'Apakah indikator risiko menjamin suatu aset aman?', a: 'Tidak. Analisis risiko bersifat indikatif dan bukan jaminan keamanan, keuntungan, atau hasil investasi.' },
            { q: 'Data pasar berasal dari mana?', a: 'KriptoAman menggunakan sumber data eksternal dan layanan jaringan yang tersedia. Status sumber dan fallback ditampilkan bila relevan.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
              <div className="font-semibold text-sm text-cyan-300 mb-1.5">{q}</div>
              <div className="text-slate-400 text-xs leading-relaxed">{a}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-2">Mulai Memantau Aset Digital</h2>
          <p className="text-slate-400 text-sm mb-6">Buat akun untuk menggunakan fitur informasi, pemantauan, dan keamanan yang tersedia.</p>
          <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors">
            Buka KriptoAman <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
