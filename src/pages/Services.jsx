import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ShieldCheck, Gift, GraduationCap, Users, Info, Coins, Zap, BarChart3,
  TrendingUp, Sparkles, MessageCircle, Settings, Mail, AlertTriangle, ChevronRight, ArrowLeft,
} from 'lucide-react';

const PRIMARY = [
  { label: 'KYC Verification', page: 'KYC', icon: ShieldCheck, desc: 'Verifikasi identitas' },
  { label: 'Referral', page: 'Referral', icon: Gift, desc: 'Undang & dapat bonus' },
  { label: 'Pendidikan Kripto', page: 'Edukasi', icon: GraduationCap, desc: 'Belajar kripto' },
  { label: 'P2P Lending', page: 'P2PLending', icon: Users, desc: 'Pinjam & investasi' },
  { label: 'Tentang Kami', page: 'AboutUs', icon: Info, desc: 'Kenapa KriptoAman' },
];

const SECONDARY = [
  { label: 'DEX & Savings', page: 'DEXSavings', icon: Coins },
  { label: 'Auto-Trade', page: 'AutoTrading', icon: Zap },
  { label: 'Portfolio', page: 'PortfolioOverview', icon: BarChart3 },
  { label: 'Market Research', page: 'MarketResearch', icon: TrendingUp },
  { label: 'Premium', page: 'Premium', icon: Sparkles },
  { label: 'Support', page: 'Support', icon: MessageCircle },
  { label: 'Settings', page: 'Settings', icon: Settings },
  { label: 'Kontak', page: 'Contact', icon: Mail },
  { label: 'Disclaimer', page: 'Disclaimer', icon: AlertTriangle },
];

export default function Services() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="ka-bg min-h-screen text-white pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        <div className="flex items-center gap-3 pt-1">
          <Link to={createPageUrl('Home')} className="tap-reset ka-muted hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Layanan</h1>
            <p className="ka-muted text-xs">Semua fitur KriptoAman dalam satu tempat</p>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="ka-surface p-3 flex items-center gap-2 border-ka-emerald/30">
            <ShieldCheck className="w-4 h-4 text-ka-emerald" />
            <span className="text-ka-emerald text-xs font-bold">Mode Admin</span>
          </div>
        )}

        {/* Primary services */}
        <div>
          <p className="ka-muted text-[11px] font-semibold uppercase tracking-wider mb-2.5">Utama</p>
          <div className="space-y-2">
            {PRIMARY.map(({ label, page, icon: Icon, desc }) => (
              <Link key={page} to={createPageUrl(page)}
                className="ka-surface ka-surface-hover p-3.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-ka-emerald/12 border border-ka-emerald/25 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-ka-emerald" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold">{label}</p>
                  <p className="ka-muted text-[11px]">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 ka-muted shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary services */}
        <div>
          <p className="ka-muted text-[11px] font-semibold uppercase tracking-wider mb-2.5">Lainnya</p>
          <div className="grid grid-cols-3 gap-2.5">
            {SECONDARY.map(({ label, page, icon: Icon }) => (
              <Link key={page} to={createPageUrl(page)}
                className="ka-surface ka-surface-hover p-3 flex flex-col items-center gap-2 text-center tap-target">
                <div className="w-10 h-10 rounded-xl bg-ka-emerald/10 border border-ka-emerald/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-ka-emerald" />
                </div>
                <span className="text-white text-[10px] font-bold leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}