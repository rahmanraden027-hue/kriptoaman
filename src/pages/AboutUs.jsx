import React from 'react';
import { Shield, Zap, Globe, Users, Lock, TrendingUp, Heart, Mail, ExternalLink } from 'lucide-react';
import TrustBadges from '../components/trust/TrustBadges';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: Shield, title: 'Keamanan Akun', desc: 'Kontrol sesi, autentikasi, dan pemeriksaan keamanan digunakan untuk membantu melindungi akses akun.', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  { icon: Globe, title: 'Koneksi Dompet Publik', desc: 'Hubungkan alamat publik EVM atau Solana dalam mode pemantauan tanpa memberikan seed phrase atau private key.', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/20' },
  { icon: Zap, title: 'Data Pasar', desc: 'Pantau harga dan informasi pasar dari penyedia data yang tersedia, dengan status sumber dan fallback ditampilkan bila diperlukan.', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/20' },
  { icon: TrendingUp, title: 'Analitik & Pemantauan', desc: 'Alat analisis membantu riset dan pemantauan aset. Informasi yang ditampilkan bukan jaminan keuntungan atau rekomendasi investasi.', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/20' },
  { icon: Lock, title: 'Mode Read-Only', desc: 'Rilis publik memprioritaskan pemantauan. Penandatanganan dan transaksi dompet eksternal tidak diaktifkan pada mode ini.', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/20' },
  { icon: Users, title: 'Antarmuka untuk Indonesia', desc: 'Tersedia Bahasa Indonesia, pilihan Bahasa Inggris, tampilan harga IDR, dan akses ke pusat bantuan.', color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/20' },
];

const STATS = [
  { label: 'Data', value: 'Pasar' },
  { label: 'Bahasa', value: 'ID/EN' },
  { label: 'Dompet', value: 'EVM+SOL' },
  { label: 'Mode Publik', value: 'Read-only' },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30" />
          <div className="absolute inset-0 bg-slate-900/60" />
          <div className="relative p-7 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5"/>
                <path d="M9 8.5C9 8.5 9 7 11 7C13 7 14.5 8 14.5 10C14.5 12 12.5 12.5 12 13C11.5 13.5 11.5 14.5 11.5 14.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="11.5" cy="17" r="1" fill="white"/>
              </svg>
            </div>
            <h1 className="text-3xl font-black text-white tracking-wide">KriptoAman</h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">Platform pemantauan dan analitik aset kripto untuk pengguna Indonesia</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-3">Misi Kami</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            KriptoAman dikembangkan untuk membantu pengguna mengakses informasi aset digital melalui antarmuka yang mudah dipahami, transparan, dan berorientasi pada keamanan.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mt-3">
            Fitur publik saat ini berfokus pada pemantauan pasar, analitik, keamanan akun, dan koneksi alamat dompet publik. Fitur transaksi hanya akan ditampilkan apabila benar-benar tersedia dan telah melewati pengujian yang sesuai.
          </p>
        </div>

        <section className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-800/55 to-blue-950/40 border border-blue-700/30 rounded-2xl p-5" aria-labelledby="founder-title">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative">
            <p className="text-blue-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-2">Founder Leadership</p>
            <h2 id="founder-title" className="text-white font-black text-xl">Raden Abdul Rahman, M.Sc.</h2>
            <p className="text-sky-300 text-sm font-semibold mt-1">Founder & CEO · KriptoAman</p>
            <p className="text-slate-400 text-sm leading-relaxed mt-3">
              Memimpin pengembangan KriptoAman dengan fokus pada keamanan, transparansi informasi, edukasi aset digital, dan pengalaman pengguna yang profesional. Arah pengembangan platform menempatkan kejelasan status fitur dan keterbatasan data sebagai bagian penting dari kepercayaan pengguna.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/founder"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-colors text-sm font-semibold"
              >
                Profil Founder & CEO
                <ExternalLink className="w-4 h-4" />
              </Link>
              <a
                href="https://radenabdulrahman.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 transition-colors text-sm font-semibold"
              >
                Website Profesional
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATS.map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 text-center">
              <p className="text-white font-black text-sm sm:text-base break-words">{s.value}</p>
              <p className="text-slate-500 text-[10px] leading-tight mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-white font-bold text-lg mb-3">Kemampuan Platform</h2>
          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className={`flex items-start gap-3 p-4 rounded-xl border ${f.bg}`}>
                <div className="w-9 h-9 rounded-lg bg-slate-900/50 flex items-center justify-center shrink-0">
                  <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 text-center">Transparansi & Keamanan</p>
          <TrustBadges />
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-700/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-400" />
            <h2 className="text-white font-bold">Nilai-Nilai Kami</h2>
          </div>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Transparansi mengenai sumber, status, dan keterbatasan data</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Keamanan sebagai prioritas dalam pengembangan platform</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Antarmuka yang mudah dipahami oleh beragam pengguna</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Pengembangan fitur secara bertahap dan dapat diuji</li>
          </ul>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 text-center space-y-3">
          <h2 className="text-white font-bold">Hubungi Kami</h2>
          <a href="mailto:support@kriptoaman.com"
            className="flex items-center justify-center gap-2 py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600/30 transition-colors">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">support@kriptoaman.com</span>
          </a>
          <Link to={createPageUrl('Support')}
            className="flex items-center justify-center gap-2 py-3 bg-slate-700/40 border border-slate-600/40 rounded-xl text-slate-300 hover:bg-slate-700/60 transition-colors">
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">Pusat Bantuan</span>
          </Link>
          <Link to="/LegalCorporateInformation" className="inline-flex items-center justify-center gap-2 text-xs text-sky-300 hover:underline">
            PT Kripto Aman Indonesia · Legal & Corporate Information
          </Link>
          <p className="text-slate-600 text-xs pt-1">© 2026 PT KRIPTO AMAN INDONESIA · Republik Indonesia</p>
        </div>

      </div>
    </div>
  );
}