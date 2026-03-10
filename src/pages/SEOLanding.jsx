import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, TrendingUp, Lock, CheckCircle, Star, ArrowRight, Zap, Users, Award } from 'lucide-react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';

const FEATURES = [
  { icon: Shield, title: 'Terdaftar Bappebti & OJK', desc: 'Platform kripto legal di Indonesia, diawasi regulator resmi untuk perlindungan aset Anda.' },
  { icon: Lock, title: 'Anti Rugpull & Scam', desc: 'Teknologi keamanan berlapis, verifikasi KYC ketat, dan sistem deteksi anomali real-time.' },
  { icon: TrendingUp, title: 'Auto Trading Bot', desc: 'Grid bot & rule-based trading otomatis. Biarkan sistem bekerja untuk Anda 24/7.' },
  { icon: Zap, title: 'Swap & DEX Instan', desc: 'Tukar kripto antar jaringan dengan biaya rendah, langsung ke dompet Anda.' },
  { icon: Users, title: 'P2P Lending Kripto', desc: 'Pinjam atau pinjamkan aset kripto secara peer-to-peer dengan bunga kompetitif.' },
  { icon: Award, title: 'Deposit IDR via Bank Lokal', desc: 'Top up saldo dengan transfer BCA, BRI, Mandiri, BNI — proses cepat dan aman.' },
];

const TESTIMONIALS = [
  { name: '🚀 Platform Baru', role: 'Baru Rilis', rating: 5, text: 'KriptoAman baru saja resmi diluncurkan! Segera hadir di App Store & Google Play Store. Daftar sekarang dan jadilah pengguna pertama.' },
  { name: '✅ Izin Resmi', role: 'Terdaftar & Diawasi', rating: 5, text: 'Meski baru rilis, KriptoAman sudah mengantongi izin resmi dari Bappebti & OJK. Aset Anda terlindungi sejak hari pertama.' },
  { name: '📱 Segera di App Store & Play Store', role: 'Coming Soon', rating: 5, text: 'Aplikasi mobile KriptoAman segera tersedia di App Store dan Google Play Store. Pantau terus update-nya dan dapatkan notifikasi pertama!' },
];

const STATS = [
  { value: '50.000+', label: 'Pengguna Aktif' },
  { value: 'Rp 2T+', label: 'Volume Transaksi' },
  { value: '99.9%', label: 'Uptime Platform' },
  { value: '50+', label: 'Aset Kripto' },
];

export default function SEOLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* Hero Section */}
      <section className="px-4 pt-10 pb-16 text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <KriptoAmanLogo size={56} showText={false} />
        </div>
        <h1 className="text-3xl font-extrabold leading-tight mb-3">
          Platform <span className="text-cyan-400">Beli Crypto Aman</span> &<br />Terpercaya di Indonesia
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          KriptoAman — platform kripto legal terdaftar <strong className="text-white">Bappebti & OJK</strong>. 
          Investasi kripto aman, anti rugpull, dengan teknologi auto trading dan deposit IDR via bank lokal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={createPageUrl('Home')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            Mulai Investasi Sekarang <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to={createPageUrl('Edukasi')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-colors">
            Pelajari Kripto Dulu
          </Link>
        </div>
        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          {['Bappebti', 'OJK', 'SSL 256-bit', 'KYC Verified'].map(b => (
            <span key={b} className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> {b}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
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

      {/* Features */}
      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">
          Kenapa Pilih <span className="text-cyan-400">KriptoAman</span>?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">{title}</div>
                <div className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cara Mulai */}
      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Cara Beli Crypto Aman di KriptoAman</h2>
        <div className="space-y-3">
          {[
            { step: '01', title: 'Daftar & Verifikasi KYC', desc: 'Buat akun gratis dan upload KTP + selfie untuk verifikasi identitas.' },
            { step: '02', title: 'Deposit IDR via Bank Lokal', desc: 'Transfer dari rekening BCA, BRI, Mandiri, atau BNI. Saldo langsung aktif.' },
            { step: '03', title: 'Pilih & Beli Kripto', desc: 'Beli BTC, ETH, USDT, SOL, dan 50+ aset kripto lainnya dengan harga terbaik.' },
            { step: '04', title: 'Kelola & Auto Trading', desc: 'Aktifkan bot trading otomatis atau pantau portofolio Anda kapan saja.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <div className="font-semibold text-sm text-white">{title}</div>
                <div className="text-slate-400 text-xs mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Dipercaya Ribuan Investor Indonesia</h2>
        <div className="space-y-3">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
              <div className="flex items-center gap-0.5 mb-2">
                {Array(t.rating).fill(0).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm italic">"{t.text}"</p>
              <div className="mt-2 text-xs text-slate-500">{t.name} · {t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SEO */}
      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">FAQ — Pertanyaan Umum</h2>
        <div className="space-y-3">
          {[
            { q: 'Apakah KriptoAman aman dan legal?', a: 'Ya, KriptoAman terdaftar resmi di Bappebti dan berada di bawah pengawasan OJK. Semua transaksi dilindungi enkripsi SSL 256-bit dan sistem KYC/AML.' },
            { q: 'Bagaimana cara deposit IDR ke KriptoAman?', a: 'Anda bisa deposit melalui transfer bank (BCA, BRI, Mandiri, BNI) atau dompet digital. Saldo langsung aktif setelah konfirmasi.' },
            { q: 'Apa itu auto trading bot di KriptoAman?', a: 'Bot trading otomatis yang bekerja 24/7 menggunakan strategi grid trading atau rule-based untuk menghasilkan profit bahkan saat Anda tidur.' },
            { q: 'Apakah ada risiko rugpull di KriptoAman?', a: 'KriptoAman menggunakan smart contract teraudit, sistem pemantauan anomali, dan regulasi ketat untuk mencegah rugpull dan penipuan.' },
            { q: 'Kripto apa saja yang tersedia?', a: 'Tersedia 50+ aset kripto termasuk BTC, ETH, USDT, SOL, BNB, dan berbagai altcoin populer lainnya.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
              <div className="font-semibold text-sm text-cyan-300 mb-1.5">{q}</div>
              <div className="text-slate-400 text-xs leading-relaxed">{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-2">Mulai Investasi Kripto Aman Sekarang</h2>
          <p className="text-slate-400 text-sm mb-6">Bergabung dengan 50.000+ investor Indonesia yang sudah mempercayai KriptoAman</p>
          <Link to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors">
            Daftar Gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}