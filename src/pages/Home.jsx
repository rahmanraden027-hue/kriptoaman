import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import { TrendingUp, Wallet, Zap, Bell, BookOpen, ArrowRight, Shield, Activity } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Wallet', page: 'Wallet', icon: Wallet, color: 'from-blue-500 to-indigo-600' },
  { label: 'Market', page: 'Market', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
  { label: 'Auto-Trade', page: 'AutoTrading', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { label: 'Edukasi', page: 'Edukasi', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd&include_24hr_change=true')
      .then(r => r.json()).then(setPrices).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  const coins = [
    { id: 'bitcoin', sym: 'BTC', name: 'Bitcoin', color: '#f59e0b' },
    { id: 'ethereum', sym: 'ETH', name: 'Ethereum', color: '#6366f1' },
    { id: 'binancecoin', sym: 'BNB', name: 'BNB', color: '#f0b90b' },
    { id: 'solana', sym: 'SOL', name: 'Solana', color: '#9945ff' },
  ];

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
            <p className="text-slate-400 text-xs mt-1">Platform kripto Anda yang aman & cerdas</p>
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

        {/* Live prices */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Harga Live</p>
            <Link to={createPageUrl('Market')} className="text-indigo-400 text-xs flex items-center gap-1 hover:text-indigo-300">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {coins.map(c => {
              const data = prices[c.id];
              const change = data?.usd_24h_change;
              return (
                <div key={c.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/40 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: c.color }}>
                      {c.sym[0]}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{c.sym}</p>
                      <p className="text-slate-500 text-[11px]">{c.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">
                      {data ? `$${data.usd.toLocaleString()}` : '—'}
                    </p>
                    <p className={`text-xs font-semibold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
          <Link to={createPageUrl('Edukasi')}
            className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl hover:bg-purple-500/15 transition-all">
            <BookOpen className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold">Edukasi</p>
              <p className="text-slate-400 text-[10px]">Belajar kripto</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}