import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import IDRPriceCard from '../components/home/IDRPriceCard';
import BappebtiTrustBadge from '../components/home/BappebtiTrustBadge';
import QRISDepositBanner from '../components/home/QRISDepositBanner';
import { TrendingUp, Wallet, Zap, Bell, BookOpen, ArrowRight, Shield, Activity, Users, FileCheck } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Wallet', page: 'Wallet', icon: Wallet, color: 'from-blue-500 to-indigo-600' },
  { label: 'Market', page: 'Market', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
  { label: 'Referral', page: 'Referral', icon: Users, color: 'from-yellow-500 to-orange-500' },
  { label: 'KYC', page: 'KYC', icon: FileCheck, color: 'from-purple-500 to-pink-500' },
];

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  const coins = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">

        {/* Hero greeting */}
        <div className="rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-blue-600/20 to-purple-600/30" />
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative p-6">
            <KriptoAmanLogo size={40} showText={true} textSize="text-base" className="mb-4" />
            <p className="text-slate-300 text-sm">{greeting()},</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              {user?.full_name?.split(' ')[0] || 'Pengguna'} 👋
            </h1>

            {/* App description dengan fitur utama */}
            <div className="mt-4 space-y-2">
              <p className="text-slate-300 text-xs font-semibold">Platform kripto terpercaya Indonesia dengan:</p>
              <ul className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Multi-Coin Wallet</strong> — Kelola BTC, ETH, USDT, SOL dalam satu tempat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Auto-Trading Cerdas</strong> — Buat strategi otomatis dengan grid bot & paper trading</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Chart Realtime</strong> — Analisis teknikal dengan RSI, MACD, EMA dari Binance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Keamanan Berlapis</strong> — PIN lock, OTP withdrawal, verifikasi tx hash otomatis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Deposit/Withdraw IDR</strong> — Via bank lokal (BCA, Mandiri, GoPay, dll)</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 text-xs font-semibold">HTTPS Secure</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/25 px-3 py-1.5 rounded-full">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-400 text-xs font-semibold">Live Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick access */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Akses Cepat</p>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_LINKS.map(({ label, page, icon: Icon, color }) => (
              <Link key={page} to={createPageUrl(page)}
                className="flex flex-col items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/40 rounded-2xl hover:border-indigo-500/40 transition-all active:scale-95">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-300 text-[10px] font-semibold text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bappebti Trust Badge */}
        <BappebtiTrustBadge />

        {/* QRIS & E-wallet Deposit */}
        <QRISDepositBanner onDepositClick={() => window.location.href = createPageUrl('Wallet')} />

        {/* Live prices in IDR */}
        <IDRPriceCard />

        {/* CTA links */}
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

        {/* Referral banner */}
        <Link to={createPageUrl('Referral')}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl hover:opacity-80 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-yellow-300 font-bold text-sm">Undang Teman, Dapat Bonus!</p>
              <p className="text-slate-400 text-[10px]">Kamu & teman masing-masing dapat Rp 25.000</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-yellow-500 shrink-0" />
        </Link>

      </div>
    </div>
  );
}