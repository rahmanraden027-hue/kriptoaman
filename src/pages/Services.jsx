import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NativeMobileUtility from '@/components/mobile/NativeMobileUtility';
import {
  ShieldCheck, GraduationCap, Info, BarChart3,
  TrendingUp, Sparkles, MessageCircle, Settings, Mail, AlertTriangle, ChevronRight, ArrowLeft,
  Lock, Server, FileCheck2, Database, UserCog, Layers3, Activity, Radar,
} from 'lucide-react';

const PRIMARY = [
  { label: 'KYC Verification', page: 'KYC', icon: ShieldCheck, desc: 'Verifikasi identitas terintegrasi' },
  { label: 'Pendidikan Kripto', page: 'Edukasi', icon: GraduationCap, desc: 'Pusat pembelajaran & wawasan' },
  { label: 'Tentang Kami', page: 'AboutUs', icon: Info, desc: 'Visi, arah, dan identitas platform' },
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
  { label: 'Admin Control', page: 'ServerControl', icon: Server, desc: 'Infrastructure command workspace' },
  { label: 'Admin KYC', page: 'AdminKYCManagement', icon: FileCheck2, desc: 'Kelola pemeriksaan identitas' },
  { label: 'Saldo Pengguna', page: 'AdminUserBalances', icon: UserCog, desc: 'Audit saldo dan akun' },
  { label: 'Aset Platform', page: 'AdminPlatformAssets', icon: Database, desc: 'Kelola aset yang diverifikasi' },
  { label: 'Security Center', page: 'SecurityCenter', icon: Lock, desc: 'Owner security command' },
];

export default function Services() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="ka-bg ka-workspace-page min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Link to={createPageUrl('Home')} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/8 text-slate-400 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <p className="ka-command-kicker"><Layers3 className="h-3.5 w-3.5" /> KRIPTOAMAN SERVICE MATRIX</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Platform Services</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Seluruh fitur inti, intelijen pasar, identitas, keamanan, pembelajaran, serta kontrol admin dalam satu pusat navigasi modern.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ka-command-status">SYSTEM ONLINE</span>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-2 text-[10px] font-bold text-sky-300">UNIFIED WORKSPACE</span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-5">
            <section className="ka-command-panel p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="ka-command-kicker"><Radar className="h-3.5 w-3.5" /> CORE SERVICES</p>
                  <h2 className="mt-2 text-lg font-black">Layanan Utama</h2>
                </div>
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {PRIMARY.map(({ label, page, icon: Icon, desc }) => (
                  <Link key={page} to={createPageUrl(page)} className="ka-command-tile group p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                      <Icon className="h-5 w-5 text-sky-400" />
                    </div>
                    <p className="mt-4 text-sm font-black">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-sky-300">BUKA <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="ka-command-panel p-4 sm:p-5">
              <p className="ka-command-kicker">EXPLORE PLATFORM</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {SECONDARY.map(({ label, page, icon: Icon }) => (
                  <Link key={page} to={createPageUrl(page)} className="ka-command-tile flex min-h-28 flex-col justify-between p-4">
                    <Icon className="h-5 w-5 text-sky-400" />
                    <span className="text-sm font-bold leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <NativeMobileUtility />

            {user?.role === 'admin' ? (
              <section className="ka-command-panel border-emerald-500/20 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10"><ShieldCheck className="h-5 w-5 text-emerald-400" /></div>
                  <div>
                    <p className="text-sm font-black text-emerald-300">Admin Workspace</p>
                    <p className="text-[10px] text-slate-500">Hanya tersedia untuk sesi admin.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {ADMIN_SERVICES.map(({ label, page, icon: Icon, desc }) => (
                    <Link key={page} to={createPageUrl(page)} className="ka-command-tile flex items-center gap-3 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10"><Icon className="h-4 w-4 text-indigo-300" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{label}</p>
                        <p className="truncate text-[9px] text-slate-500">{desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <section className="ka-command-panel p-5">
                <ShieldCheck className="h-6 w-6 text-sky-400" />
                <h2 className="mt-4 text-base font-black">Secure Workspace</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">Akses layanan disesuaikan dengan status akun dan peran pengguna.</p>
              </section>
            )}

            <section className="ka-command-panel p-5">
              <p className="ka-command-kicker">PLATFORM LAYER</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['Market Intelligence', 'Identity', 'Security', 'Education'].map((label) => (
                  <div key={label} className="rounded-xl border border-slate-700/50 bg-slate-950/35 px-3 py-3 text-[10px] font-bold text-slate-300">{label}</div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
