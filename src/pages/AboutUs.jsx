import React from 'react';
import { Shield, Zap, Globe, Users, Award, Lock, TrendingUp, Heart, Mail, ExternalLink } from 'lucide-react';
import TrustBadges from '../components/trust/TrustBadges';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: Shield, title: 'Keamanan Terjamin', desc: 'Enkripsi end-to-end dan perlindungan multi-layer untuk aset digital Anda.', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  { icon: Globe, title: 'Multi-Chain', desc: 'Dukung lebih dari 20 jaringan blockchain termasuk ETH, BNB, SOL, dan lainnya.', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/20' },
  { icon: Zap, title: 'Real-Time Data', desc: 'Harga live, DEX screener, dan analitik pasar yang diperbarui setiap detik.', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/20' },
  { icon: TrendingUp, title: 'Auto Trading', desc: 'Strategi trading otomatis dengan AI untuk memaksimalkan peluang pasar.', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/20' },
  { icon: Lock, title: 'Dompet Non-Custodial', desc: 'Anda memegang kendali penuh atas private key dan aset Anda.', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/20' },
  { icon: Users, title: 'Komunitas Aktif', desc: 'Bergabung dengan ribuan pengguna kripto Indonesia yang aktif.', color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/20' },
];

const STATS = [
  { label: 'Pengguna Aktif', value: '10K+' },
  { label: 'Chain Didukung', value: '20+' },
  { label: 'Protokol DeFi', value: '18+' },
  { label: 'Uptime', value: '99.9%' },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* Hero */}
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
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">Platform manajemen aset kripto terpercaya untuk pengguna Indonesia</p>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-3">Misi Kami</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            KriptoAman hadir untuk memberikan akses mudah, aman, dan cerdas ke dunia aset digital bagi seluruh masyarakat Indonesia. Kami percaya bahwa keuangan terdesentralisasi harus dapat diakses oleh semua orang, bukan hanya para ahli teknologi.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mt-3">
            Dengan menggabungkan teknologi blockchain terkini dan antarmuka yang intuitif, kami memudahkan Anda mengelola, memperdagangkan, dan mengembangkan portofolio kripto Anda.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {STATS.map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 text-center">
              <p className="text-white font-black text-lg">{s.value}</p>
              <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div>
          <h2 className="text-white font-bold text-lg mb-3">Keunggulan Platform</h2>
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

        {/* Values */}
        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-700/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-400" />
            <h2 className="text-white font-bold">Nilai-Nilai Kami</h2>
          </div>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Transparansi dalam setiap transaksi dan kebijakan</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Keamanan sebagai prioritas utama platform</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Inklusivitas untuk semua kalangan pengguna</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">✦</span> Inovasi berkelanjutan dalam ekosistem DeFi</li>
          </ul>
        </div>

        {/* Contact CTA */}
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
          <p className="text-slate-600 text-xs pt-1">© 2025 KriptoAman · Terdaftar di Indonesia</p>
        </div>

      </div>
    </div>
  );
}