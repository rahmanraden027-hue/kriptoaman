import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ShieldCheck, GraduationCap, Info, BarChart3,
  TrendingUp, Sparkles, MessageCircle, Settings, Mail, AlertTriangle, ChevronRight, ArrowLeft,
  Lock, Server, FileCheck2, Database, UserCog,
} from 'lucide-react';

const PRIMARY = [
  { label: 'KYC Verification', page: 'KYC', icon: ShieldCheck, desc: 'Verifikasi identitas' },
  { label: 'Pendidikan Kripto', page: 'Edukasi', icon: GraduationCap, desc: 'Belajar kripto' },
  { label: 'Tentang Kami', page: 'AboutUs', icon: Info, desc: 'Kenapa KriptoAman' },
];

const SECONDARY = [
  { label: 'Portfolio', page: 'PortfolioOverview', icon: BarChart3 },
  { label: 'Market Research', page: 'MarketResearch', icon: TrendingUp },
  { label: 'Premium', page: 'Premium', icon: Sparkles },
  { label: 'Support', page: 'Support', icon: MessageCircle },
  { label: 'Settings', page: 'Settings', icon: Settings },
  { label: 'Kontak', page: 'Contact', icon: Mail },
  { label: 'Disclaimer', page: 'Disclaimer', icon: AlertTriangle },
];

const ADMIN_SERVICES = [
  { label: 'Admin Control', page: 'ServerControl', icon: Server, desc: 'Status sistem dan konfigurasi' },
  { label: 'Admin KYC', page: 'AdminKYCManagement', icon: FileCheck2, desc: 'Kelola pemeriksaan identitas' },
  { label: 'Saldo Pengguna', page: 'AdminUserBalances', icon: UserCog, desc: 'Audit saldo dan akun' },
  { label: 'Aset Platform', page: 'AdminPlatformAssets', icon: Database, desc: 'Kelola aset yang diverifikasi' },
  { label: 'Security Center', page: 'SecurityCenter', icon: Lock, desc: 'Kontrol keamanan admin' },
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
          <div className="space-y-3">
            <div className="ka-surface p-3 flex items-center gap-2 border-ka-emerald/30">
              <ShieldCheck className="w-4 h-4 text-ka-emerald" />
              <div>
                <p className="text-ka-emerald text-xs font-bold">Panel Admin Terverifikasi</p>
                <p className="ka-muted text-[10px]">Hanya terlihat oleh akun dengan role admin.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ADMIN_SERVICES.map(({ label, page, icon: Icon, desc }) => (
                <Link key={page} to={createPageUrl(page)} className="ka-surface ka-surface-hover p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/12 border border-blue-500/25 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-bold">{label}</p>
                    <p className="ka-muted text-[10px]">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ka-muted" />
                </Link>
              ))}
            </div>
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
