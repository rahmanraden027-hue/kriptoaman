import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import IDRPriceCard from '../components/home/IDRPriceCard';
import QRISDepositBanner from '../components/home/QRISDepositBanner';
import TrustBadges from '../components/trust/TrustBadges';
import { TrendingUp, Wallet, Bell, ArrowRight, Shield, Users, FileCheck, Zap, BookOpen, BarChart3, Gift, Star, ChevronRight } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Wallet', page: 'Wallet', icon: Wallet, color: 'from-blue-500 to-indigo-600', desc: 'Kelola aset' },
  { label: 'Market', page: 'Market', icon: TrendingUp, color: 'from-green-500 to-emerald-600', desc: 'Harga live' },
  { label: 'Auto-Trade', page: 'AutoTrading', icon: Zap, color: 'from-violet-500 to-purple-600', desc: 'Bot trading' },
  { label: 'Portfolio', page: 'PortfolioOverview', icon: BarChart3, color: 'from-cyan-500 to-blue-500', desc: 'Analisis' },
  { label: 'KYC', page: 'KYC', icon: FileCheck, color: 'from-yellow-500 to-orange-500', desc: 'Verifikasi' },
  { label: 'Referral', page: 'Referral', icon: Gift, color: 'from-pink-500 to-rose-500', desc: 'Bonus Rp25K' },
  { label: 'Edukasi', page: 'Edukasi', icon: BookOpen, color: 'from-teal-500 to-green-500', desc: 'Belajar kripto' },
  { label: 'P2P', page: 'P2PLending', icon: Users, color: 'from-amber-500 to-yellow-500', desc: 'Lending' },
  { label: 'Tentang', page: 'SEOLanding', icon: Star, color: 'from-indigo-500 to-violet-600', desc: 'Kenapa kami' },
];

const FEATURES = [
  { icon: '🔐', title: 'Keamanan Enterprise', desc: 'PIN lock, 2FA, OTP withdrawal, enkripsi AES-256' },
  { icon: '📊', title: 'Chart Profesional', desc: 'Candlestick, RSI, MACD, EMA realtime dari Binance' },
  { icon: '🤖', title: 'AI Auto-Trading', desc: 'Grid bot, paper trading, backtest strategi otomatis' },
  { icon: '💳', title: 'Deposit IDR', desc: 'QRIS, GoPay, OVO, DANA, BCA, Mandiri, BRI' },
  { icon: '🌐', title: 'Multi-Chain Wallet', desc: 'BTC, ETH, SOL, BNB, MATIC, USDT dalam satu app' },
  { icon: '📈', title: 'P2P Lending', desc: 'Pinjam atau investasikan kripto dengan bunga kompetitif' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setKycStatus(u?.kycStatus);
    }).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ── Hero ── */}
        <div className="rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-blue-600/20 to-purple-600/30" />
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative p-6">
            <KriptoAmanLogo size={40} showText={true} textSize="text-base" className="mb-3" />
            <p className="text-slate-400 text-xs">{greeting()},</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              {user?.full_name?.split(' ')[0] || 'Pengguna'} 👋
            </h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Platform kripto all-in-one terpercaya Indonesia. Aman, cepat, dan sesuai regulasi Bappebti & OJK.
            </p>

            {/* Status tags */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-[10px] font-semibold">Live Data</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/25 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 text-[10px] font-semibold">SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/25 px-2.5 py-1 rounded-full">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400 text-[10px] font-semibold">Bappebti</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KYC Status Banner ── */}
        {kycStatus !== 'approved' ? (
          <Link to={createPageUrl('KYC')}
            className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/25 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="text-yellow-300 text-xs font-semibold">
                {kycStatus === 'pending' ? '⏳ KYC dalam proses review' : '⚡ Lengkapi KYC untuk akses penuh'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-yellow-500 shrink-0" />
          </Link>
        ) : (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-2xl px-4 py-3">
            <Shield className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-green-300 text-xs font-semibold">✓ KYC Terverifikasi — Full Access Aktif</span>
            <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">Level 2</span>
          </div>
        )}

        {/* ── Quick Links ── */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Akses Cepat</p>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_LINKS.map(({ label, page, icon: Icon, color, desc }) => (
              <Link key={page} to={createPageUrl(page)}
                className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/60 border border-slate-700/40 rounded-2xl hover:border-indigo-500/40 transition-all active:scale-95">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-200 text-[10px] font-bold text-center leading-tight">{label}</span>
                <span className="text-slate-500 text-[9px] text-center leading-tight">{desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── QRIS & E-wallet Deposit ── */}
        <QRISDepositBanner onDepositClick={() => window.location.href = createPageUrl('Wallet')} />

        {/* ── Live Prices ── */}
        <IDRPriceCard />

        {/* ── Trust Badges ── */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-center mb-3">Regulasi & Keamanan</p>
          <TrustBadges />
        </div>

        {/* ── Fitur Unggulan ── */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Fitur Unggulan</p>
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-3.5">
                <span className="text-xl">{f.icon}</span>
                <p className="text-white text-xs font-bold mt-2">{f.title}</p>
                <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('Alerts')}
            className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl hover:bg-yellow-500/15 transition-all">
            <Bell className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold">Alerts</p>
              <p className="text-slate-400 text-[10px]">Notifikasi harga</p>
            </div>
          </Link>
          <Link to={createPageUrl('KYC')}
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl hover:bg-green-500/15 transition-all">
            <Shield className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold">Verifikasi KYC</p>
              <p className="text-slate-400 text-[10px]">Aktifkan fitur penuh</p>
            </div>
          </Link>
        </div>

        {/* ── Referral Banner ── */}
        <Link to={createPageUrl('Referral')}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-orange-500/10 border border-pink-500/20 rounded-2xl hover:opacity-80 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center text-lg shrink-0">🎁</div>
            <div>
              <p className="text-white font-bold text-sm">Undang Teman, Dapat Bonus!</p>
              <p className="text-slate-400 text-[10px]">Kamu & teman masing-masing dapat Rp 25.000</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-pink-400 shrink-0" />
        </Link>

        {/* ── Footer ── */}
        <div className="text-center pb-2">
          <p className="text-slate-600 text-[10px] leading-relaxed">
            KriptoAman beroperasi sesuai regulasi Bappebti & OJK Indonesia.<br />
            Transaksi dijamin dengan enkripsi SSL 256-bit. © 2025 KriptoAman
          </p>
        </div>

      </div>
    </div>
  );
}