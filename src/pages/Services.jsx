import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NativeMobileUtility from '@/components/mobile/NativeMobileUtility';
import { useLanguage } from '@/lib/LanguageContext';
import {
  ShieldCheck, GraduationCap, Info, BarChart3,
  TrendingUp, MessageCircle, Settings, Mail, ChevronRight, ArrowLeft,
  Lock, Server, FileCheck2, Database, UserCog, Layers3, Radar, WalletCards,
} from 'lucide-react';

const COPY = {
  id: {
    kicker: 'EKOSISTEM KRIPTOAMAN',
    title: 'Ekosistem Produksi',
    body: 'Permukaan inti KriptoAman disusun berdasarkan fungsi produksi: pasar, jaringan, dompet, penemuan, dan status sistem.',
    unified: 'RUTE PRODUKSI',
    core: 'PRODUK INTI',
    main: 'Layanan Produksi',
    explore: 'OPERASIONAL & LAYANAN',
    open: 'BUKA',
    secureTitle: 'Workspace Aman',
    secureBody: 'Akses operasional menyesuaikan status akun dan peran pengguna.',
    platformLayer: 'LAPISAN DATA',
    dataLayers: ['Data Pasar', 'On-chain', 'Bukti Jaringan', 'Identitas'],
    adminTitle: 'Workspace Admin',
    adminBody: 'Tersedia hanya untuk sesi admin yang sah.',
  },
  en: {
    kicker: 'KRIPTOAMAN ECOSYSTEM',
    title: 'Production Ecosystem',
    body: 'KriptoAman core surfaces are organized by production function: markets, network, wallet, discovery, and system status.',
    unified: 'PRODUCTION ROUTES',
    core: 'CORE PRODUCTS',
    main: 'Production Surfaces',
    explore: 'OPERATIONS & SERVICES',
    open: 'OPEN',
    secureTitle: 'Secure Workspace',
    secureBody: 'Operational access adapts to account status and user role.',
    platformLayer: 'DATA LAYERS',
    dataLayers: ['Market Data', 'On-chain', 'Network Evidence', 'Identity'],
    adminTitle: 'Admin Workspace',
    adminBody: 'Available only to an authenticated admin session.',
  },
};

const ITEMS = {
  id: {
    primary: [
      { label: 'Intelijen Pasar', to: '/Market', icon: BarChart3, desc: 'Database pasar, pergerakan, radar, dan data aset' },
      { label: 'Jaringan ZEVARYQ', to: '/ZEVARYQ', icon: ShieldCheck, desc: 'Chain ID, RPC, tinggi blok, dan bukti jaringan' },
      { label: 'ZEVARYQ Wallet', to: '/wallet-app', icon: WalletCards, desc: 'Dompet ZVQ, aset, terima, dan fungsi swap' },
      { label: 'QoryVEx Discovery', to: '/qoryvex/discovery', icon: Radar, desc: 'Penemuan kontrak dan token berbasis bukti pihak pertama' },
      { label: 'Status Sistem', to: '/SystemStatus', icon: Server, desc: 'Status langsung aplikasi, pasar, jaringan, dan ZEVARYQ' },
    ],
    secondary: [
      { label: 'Verifikasi KYC', page: 'KYC', icon: ShieldCheck },
      { label: 'Pendidikan Kripto', page: 'Edukasi', icon: GraduationCap },
      { label: 'Portofolio', page: 'PortfolioOverview', icon: BarChart3 },
      { label: 'Riset Pasar', page: 'MarketResearch', icon: TrendingUp },
      { label: 'Dukungan', page: 'Support', icon: MessageCircle },
      { label: 'Pengaturan', page: 'Settings', icon: Settings },
      { label: 'Tentang KriptoAman', page: 'AboutUs', icon: Info },
      { label: 'Kontak', page: 'Contact', icon: Mail },
    ],
  },
  en: {
    primary: [
      { label: 'Market Intelligence', to: '/Market', icon: BarChart3, desc: 'Market database, movers, radar and asset data' },
      { label: 'ZEVARYQ Network', to: '/ZEVARYQ', icon: ShieldCheck, desc: 'Chain ID, RPC, block height and network evidence' },
      { label: 'ZEVARYQ Wallet', to: '/wallet-app', icon: WalletCards, desc: 'ZVQ wallet, assets, receive and swap surface' },
      { label: 'QoryVEx Discovery', to: '/qoryvex/discovery', icon: Radar, desc: 'Contract and token discovery from first-party evidence' },
      { label: 'System Status', to: '/SystemStatus', icon: Server, desc: 'Live app, market, network and ZEVARYQ status' },
    ],
    secondary: [
      { label: 'KYC Verification', page: 'KYC', icon: ShieldCheck },
      { label: 'Crypto Education', page: 'Edukasi', icon: GraduationCap },
      { label: 'Portfolio', page: 'PortfolioOverview', icon: BarChart3 },
      { label: 'Market Research', page: 'MarketResearch', icon: TrendingUp },
      { label: 'Support', page: 'Support', icon: MessageCircle },
      { label: 'Settings', page: 'Settings', icon: Settings },
      { label: 'About KriptoAman', page: 'AboutUs', icon: Info },
      { label: 'Contact', page: 'Contact', icon: Mail },
    ],
  },
};

const ADMIN_SERVICES = [
  { label: 'Admin Control', page: 'ServerControl', icon: Server, desc: 'Infrastructure command workspace' },
  { label: 'Admin KYC', page: 'AdminKYCManagement', icon: FileCheck2, desc: 'Identity review operations' },
  { label: 'User Balances', page: 'AdminUserBalances', icon: UserCog, desc: 'Account and balance review' },
  { label: 'Platform Assets', page: 'AdminPlatformAssets', icon: Database, desc: 'Verified platform asset management' },
  { label: 'Security Center', page: 'SecurityCenter', icon: Lock, desc: 'Owner security command' },
];

export default function Services() {
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const text = COPY[language] || COPY.id;
  const items = useMemo(() => ITEMS[language] || ITEMS.id, [language]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="ka-bg ka-workspace-page min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7" aria-labelledby="service-matrix-title">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Link
                to={createPageUrl('Home')}
                aria-label={language === 'en' ? 'Back to home' : 'Kembali ke beranda'}
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/8 text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
              <div>
                <p className="ka-command-kicker"><Layers3 className="h-3.5 w-3.5" aria-hidden="true" /> {text.kicker}</p>
                <h1 id="service-matrix-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{text.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{text.body}</p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-2 text-[10px] font-bold text-sky-300">{text.unified}</span>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <section className="ka-command-panel p-4 sm:p-5" aria-labelledby="primary-services-title">
              <div className="mb-4">
                <p className="ka-command-kicker"><Radar className="h-3.5 w-3.5" aria-hidden="true" /> {text.core}</p>
                <h2 id="primary-services-title" className="mt-2 text-lg font-black">{text.main}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.primary.map(({ label, page, to, icon: Icon, desc }) => (
                  <Link key={to || page} to={to || createPageUrl(page)} className="ka-command-tile group p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                      <Icon className="h-5 w-5 text-sky-400" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-sm font-black">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-sky-300">{text.open} <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" /></div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="ka-command-panel p-4 sm:p-5" aria-label={text.explore}>
              <p className="ka-command-kicker">{text.explore}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {items.secondary.map(({ label, page, icon: Icon }) => (
                  <Link key={page} to={createPageUrl(page)} className="ka-command-tile flex min-h-28 flex-col justify-between p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
                    <Icon className="h-5 w-5 text-sky-400" aria-hidden="true" />
                    <span className="text-sm font-bold leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <NativeMobileUtility />

            {user?.role === 'admin' ? (
              <section className="ka-command-panel border-emerald-500/20 p-4 sm:p-5" aria-labelledby="admin-workspace-title">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10"><ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" /></div>
                  <div>
                    <p id="admin-workspace-title" className="text-sm font-black text-emerald-300">{text.adminTitle}</p>
                    <p className="text-[10px] text-slate-500">{text.adminBody}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {ADMIN_SERVICES.map(({ label, page, icon: Icon, desc }) => (
                    <Link key={page} to={createPageUrl(page)} className="ka-command-tile flex items-center gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10"><Icon className="h-4 w-4 text-indigo-300" aria-hidden="true" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{label}</p>
                        <p className="truncate text-[9px] text-slate-500">{desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <section className="ka-command-panel p-5">
                <ShieldCheck className="h-6 w-6 text-sky-400" aria-hidden="true" />
                <h2 className="mt-4 text-base font-black">{text.secureTitle}</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{text.secureBody}</p>
              </section>
            )}

            <section className="ka-command-panel p-5" aria-label={text.platformLayer}>
              <p className="ka-command-kicker">{text.platformLayer}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {text.dataLayers.map((label) => (
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
