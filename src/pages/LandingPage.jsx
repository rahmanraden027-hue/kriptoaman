import React, { useState, useEffect } from 'react';
import { Shield, Zap, TrendingUp, Lock, Globe, ChevronDown, Star, Users, ArrowRight, CheckCircle, Smartphone, BarChart3, Bot, Wallet, Eye, RefreshCw, FileText, Download, Circle, CheckCircle2, Clock, Menu, X } from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    color: 'cyan',
    title: 'Keamanan Berlapis',
    desc: 'PIN lock, OTP withdrawal, verifikasi tx hash otomatis. Aset kamu selalu terlindungi.'
  },
  {
    icon: Bot,
    color: 'indigo',
    title: 'Auto-Trading Cerdas',
    desc: 'Buat strategi trading otomatis dengan rules builder, grid bot, dan paper trading.'
  },
  {
    icon: BarChart3,
    color: 'emerald',
    title: 'Chart Realtime',
    desc: 'Candlestick chart live langsung dari Binance. Analisis teknikal dengan RSI, MACD, EMA.'
  },
  {
    icon: Wallet,
    color: 'amber',
    title: 'Multi-Coin Wallet',
    desc: 'Kelola BTC, ETH, USDT, SOL, dan IDR dalam satu platform terintegrasi.'
  },
  {
    icon: TrendingUp,
    color: 'blue',
    title: 'DEX & CEX Hybrid',
    desc: 'Swap langsung di DEX atau hubungkan ke Binance, Bybit, OKX dalam satu tempat.'
  },
  {
    icon: Globe,
    color: 'purple',
    title: 'Dibuat untuk Indonesia',
    desc: 'Deposit & withdraw via bank lokal (BCA, Mandiri, GoPay). Dukungan Bahasa Indonesia penuh.'
  },
];

const STATS = [
  { value: '10,000+', label: 'Pengguna Aktif' },
  { value: 'Rp 50M+', label: 'Volume Trading' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'Rating Pengguna' },
];

const STEPS = [
  { no: '01', title: 'Daftar Gratis', desc: 'Buat akun dalam 1 menit. Tidak perlu KYC untuk mulai.' },
  { no: '02', title: 'Deposit Aset', desc: 'Deposit kripto atau IDR via bank lokal & e-wallet.' },
  { no: '03', title: 'Mulai Trading', desc: 'Gunakan auto-trading, grid bot, atau trading manual.' },
];

const TESTIMONIALS = [
  { name: 'Budi S.', city: 'Jakarta', rating: 5, text: 'Akhirnya ada platform yang aman dan mudah dipahami. Auto-trading-nya keren banget!' },
  { name: 'Sari W.', city: 'Surabaya', rating: 5, text: 'Grid bot KriptoAman bantu saya profit konsisten tiap bulan tanpa harus mantengin chart.' },
  { name: 'Andi R.', city: 'Bandung', rating: 5, text: 'DEX + CEX dalam satu app. Sangat memudahkan manajemen portofolio saya.' },
];

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#060d1a]/95 backdrop-blur border-b border-cyan-900/40 shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <LogoSVG size={34} />
          <span className="font-extrabold tracking-widest text-base uppercase">
            <span className="text-white">Kripto</span><span className="text-emerald-400">Aman</span>
          </span>
        </div>
        {/* CTA */}
        <a href="#daftar"
          className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20">
          Mulai Gratis
        </a>
      </div>
    </nav>
  );
}

function LogoSVG({ size = 40 }) {
  return (
    <svg width={size} height={size * 52 / 48} viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lp_shield_outer" x1="24" y1="1" x2="24" y2="51" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="60%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="lp_shield_body" x1="24" y1="4" x2="24" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0c2340" />
          <stop offset="100%" stopColor="#061220" />
        </linearGradient>
        <linearGradient id="lp_coin" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path d="M24 1L3 9V25C3 36.5 12.5 46.5 24 50C35.5 46.5 45 36.5 45 25V9L24 1Z" fill="url(#lp_shield_outer)" />
      <path d="M24 4.5L6 11.5V25C6 34.8 14.2 43.5 24 46.8C33.8 43.5 42 34.8 42 25V11.5L24 4.5Z" fill="url(#lp_shield_body)" />
      <g stroke="#2dd4bf" strokeWidth="0.7" strokeLinecap="round" opacity="0.8">
        <line x1="24" y1="20" x2="17" y2="20" /><line x1="17" y1="20" x2="14" y2="17" />
        <circle cx="14" cy="17" r="1" fill="#2dd4bf" />
        <line x1="17" y1="20" x2="14" y2="23" /><circle cx="14" cy="23" r="1" fill="#2dd4bf" />
        <line x1="24" y1="20" x2="31" y2="20" /><line x1="31" y1="20" x2="34" y2="17" />
        <circle cx="34" cy="17" r="1" fill="#2dd4bf" />
        <line x1="31" y1="20" x2="34" y2="23" /><circle cx="34" cy="23" r="1" fill="#2dd4bf" />
        <line x1="24" y1="28" x2="24" y2="34" /><line x1="24" y1="34" x2="21" y2="37" />
        <circle cx="21" cy="37" r="1" fill="#f59e0b" />
        <line x1="24" y1="34" x2="27" y2="37" /><circle cx="27" cy="37" r="1" fill="#f59e0b" />
      </g>
      <circle cx="24" cy="22" r="7.5" fill="url(#lp_coin)" />
      <text x="24" y="26.5" textAnchor="middle" fontSize="9" fontWeight="900" fontFamily="Arial, system-ui" fill="#7c2d12">₿</text>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060d1a] text-white overflow-x-hidden">
      <NavBar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-10 overflow-hidden">
        {/* BG glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* Grid lines bg */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            Platform Kripto Terpercaya untuk Investor Indonesia
          </div>

          {/* Big logo */}
          <div className="mb-8 drop-shadow-[0_0_40px_rgba(0,212,255,0.4)]">
            <LogoSVG size={100} />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
            <span className="text-white">Investasi Kripto</span><br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Tanpa Rasa Takut
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            Platform trading kripto all-in-one dengan keamanan berlapis, auto-trading cerdas, dan dukungan penuh Bahasa Indonesia.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12" id="daftar">
            <a href="https://kriptoaman.app"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-cyan-500/30 flex items-center gap-2 justify-center">
              Mulai Gratis Sekarang <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#fitur"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-base rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
              Lihat Fitur <ChevronDown className="w-5 h-5" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
                <p className="text-xl sm:text-2xl font-black text-cyan-400">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-40">
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </div>
      </section>

      {/* ── FITUR ── */}
      <section id="fitur" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Fitur Unggulan</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2">
              Semua yang kamu butuhkan,<br />
              <span className="text-cyan-400">dalam satu platform</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const colorMap = {
                cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
                indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
                emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
                amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
                blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
                purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
              };
              const cls = colorMap[f.color];
              return (
                <div key={i} className={`bg-gradient-to-br ${cls} border rounded-2xl p-6 hover:scale-105 transition-transform duration-200`}>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Cara Kerja</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-2 mb-14">
            Mulai dalam <span className="text-cyan-400">3 langkah mudah</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="relative flex flex-col items-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-black text-white mb-4 shadow-lg shadow-cyan-500/30">
                  {s.no}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY HIGHLIGHT ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-cyan-500/20 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
            <div className="shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Keamanan adalah prioritas kami</h2>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                KriptoAman menggunakan enkripsi end-to-end, verifikasi dua faktor, dan sistem monitoring 24/7 untuk memastikan aset kamu selalu aman.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {['PIN Lock', 'OTP Withdrawal', 'Tx Hash Verification', 'Encrypted Storage', 'Disclaimer Gate'].map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Testimoni</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-2 mb-12">
            Dipercaya <span className="text-cyan-400">ribuan investor</span> Indonesia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                <div className="flex gap-0.5 mb-3">
                  {Array(t.rating).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-3xl p-10 sm:p-14 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <LogoSVG size={64} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Siap mulai perjalanan<br />
                <span className="text-cyan-400">kripto kamu?</span>
              </h2>
              <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
                Bergabung dengan ribuan investor Indonesia yang sudah trading aman bersama KriptoAman.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://kriptoaman.app"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-cyan-500/30 flex items-center gap-2 justify-center">
                  <Smartphone className="w-5 h-5" /> Download App
                </a>
                <a href="https://kriptoaman.app/register"
                  className="px-8 py-4 bg-white/5 border border-white/15 text-white font-bold text-base rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
                  Daftar di Web <ArrowRight className="w-5 h-5" />
                </a>
              </div>
              <p className="text-slate-600 text-xs mt-6">Gratis selamanya • Tidak ada biaya tersembunyi</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoSVG size={28} />
            <span className="font-extrabold tracking-widest text-sm uppercase">
              <span className="text-white">Kripto</span><span className="text-emerald-400">Aman</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 justify-center">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Disclaimer</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Kontak</a>
          </div>
          <p className="text-slate-600 text-xs">© 2026 KriptoAman. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}