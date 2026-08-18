import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, BarChart3, Settings2, ShieldCheck, WalletCards, AlertCircle, Activity, Radar, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import WalletProfileCard from '../components/wallet/WalletProfileCard';
import WalletConnectPanel from '../components/wallet/WalletConnectPanel';
import KAMTokenCard from '../components/wallet/KAMTokenCard';

const ADMIN_BALANCE_COINS = ['BTC', 'ETH', 'SOL', 'USDT'];

export default function Wallet() {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [connectedAddressCount, setConnectedAddressCount] = useState(0);
  const [adminBalances, setAdminBalances] = useState(null);
  const [adminBalanceError, setAdminBalanceError] = useState('');
  const en = language === 'en';

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    let active = true;
    if (currentUser?.role !== 'admin') {
      setAdminBalances(null);
      setAdminBalanceError('');
      return () => { active = false; };
    }

    setAdminBalanceError('');
    kriptoAuth.getAdminBalance()
      .then((data) => {
        if (!active) return;
        setAdminBalances(data?.balances || {});
      })
      .catch(() => {
        if (!active) return;
        setAdminBalances(null);
        setAdminBalanceError(en ? 'Internal administrative balance could not be loaded.' : 'Saldo administrasi internal KriptoAman belum dapat dimuat.');
      });

    return () => { active = false; };
  }, [currentUser?.id, currentUser?.role, en]);

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/15 bg-[#071423]/85 p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,.16),transparent_28%),radial-gradient(circle_at_10%_100%,rgba(99,102,241,.12),transparent_30%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-2 shadow-[0_0_32px_rgba(56,189,248,.12)]">
                <KriptoAmanLogo size={42} showText={false} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.22em] text-sky-300">KRIPTOAMAN PORTFOLIO INTELLIGENCE</p>
                <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">{en ? 'Portfolio & Public Address Monitor' : 'Portofolio & Pemantauan Alamat Publik'}</h1>
                <p className="mt-1 text-xs text-slate-400">{en ? 'Live visibility, security context, and public-address intelligence.' : 'Visibilitas live, konteks keamanan, dan intelijen alamat publik.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-cyan-300"><Radar className="h-3 w-3" /> {en ? 'WATCH ONLY' : 'PEMANTAUAN'}</span>
              <span className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-300"><ShieldCheck className="h-3 w-3" /> {en ? 'SECURE SESSION' : 'SESI AMAN'}</span>
            </div>
          </div>
        </section>

        <WalletProfileCard user={currentUser} address="" coin="" />

        {currentUser?.role === 'admin' && (
          <section className="ka-surface overflow-hidden p-5 shadow-[0_20px_60px_rgba(0,0,0,.18)]" aria-label={en ? 'Internal administrative balance' : 'Saldo administrasi internal KriptoAman'}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 shadow-[0_0_28px_rgba(139,92,246,.14)]">
                <WalletCards className="h-5 w-5 text-violet-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{en ? 'KriptoAman Internal Administrative Balance' : 'Saldo administrasi internal KriptoAman'}</h2>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                    {en ? 'ADMIN ONLY' : 'KHUSUS ADMIN'}
                  </span>
                </div>
              </div>
            </div>

            {adminBalanceError ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{adminBalanceError}</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ADMIN_BALANCE_COINS.map((coin) => (
                  <div key={coin} className="rounded-2xl border border-sky-400/10 bg-slate-950/45 p-4 shadow-inner shadow-sky-500/5">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500">{coin}</p>
                    <p className="mt-1 truncate text-lg font-extrabold text-white">
                      {adminBalances ? Number(adminBalances?.[coin] || 0).toLocaleString('en-US', { maximumFractionDigits: 8 }) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="ka-surface overflow-hidden p-5 lg:col-span-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10">
                <Wifi className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.18em] text-cyan-300">LIVE MONITORING</p>
                <h2 className="mt-1 font-bold">{en ? 'Watch-only portfolio' : 'Portofolio dalam mode pemantauan'}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {en
                    ? 'The public version monitors public address and asset information. Sending, swapping, deposits, withdrawals, trading, lending, staking, bridging, and CEX execution are not enabled.'
                    : 'Versi publik digunakan untuk memantau informasi alamat publik dan aset. Pengiriman, swap, deposit, penarikan, perdagangan, lending, staking, bridge, dan eksekusi CEX tidak diaktifkan.'}
                </p>
              </div>
            </div>
          </section>

          <section className="ka-surface p-5 lg:col-span-4">
            <div className="flex items-center gap-2 text-sky-300"><Activity className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[0.18em]">STATUS GRID</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center lg:grid-cols-1">
              <div className="rounded-xl border border-sky-400/10 bg-slate-950/35 p-3"><p className="text-lg font-extrabold">{connectedAddressCount}</p><p className="text-[10px] text-slate-500">{en ? 'Addresses' : 'Alamat'}</p></div>
              <div className="rounded-xl border border-sky-400/10 bg-slate-950/35 p-3"><p className="text-lg font-extrabold text-emerald-300">LIVE</p><p className="text-[10px] text-slate-500">{en ? 'Monitor' : 'Pantau'}</p></div>
              <div className="rounded-xl border border-sky-400/10 bg-slate-950/35 p-3"><p className="text-lg font-extrabold text-cyan-300">ON</p><p className="text-[10px] text-slate-500">{en ? 'Security' : 'Keamanan'}</p></div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('Market')} className="ka-surface ka-surface-hover flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
            <BarChart3 className="h-6 w-6 text-cyan-300" />
            <span className="text-sm font-semibold">{en ? 'Watch Markets' : 'Pantau Pasar'}</span>
          </Link>
          <Link to={createPageUrl('SecurityHub')} className="ka-surface ka-surface-hover flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
            <Settings2 className="h-6 w-6 text-violet-300" />
            <span className="text-sm font-semibold">{en ? 'Security Center' : 'Pusat Keamanan'}</span>
          </Link>
        </div>

        <WalletConnectPanel onConnectionCountChange={setConnectedAddressCount} />
        <KAMTokenCard userBalance={currentUser?.kamBalance || 0} />

        <section className="grid gap-3 sm:grid-cols-3" aria-label={en ? 'Monitoring status' : 'Status pemantauan'}>
          {[
            [en ? 'Connected public addresses' : 'Alamat publik terhubung', String(connectedAddressCount), connectedAddressCount ? (en ? 'Public address connection active' : 'Koneksi alamat publik aktif') : (en ? 'Connect a public address when available' : 'Hubungkan alamat publik saat tersedia')],
            [en ? 'Recent activity' : 'Aktivitas terbaru', '—', en ? 'No monitored transactions' : 'Belum ada transaksi yang dipantau'],
            [en ? 'Monitoring mode' : 'Mode pemantauan', en ? 'Watch-only' : 'Pemantauan', en ? 'No custody or transaction execution' : 'Tanpa kustodi atau eksekusi transaksi'],
          ].map(([label, value, description]) => (
            <div key={label} className="ka-surface p-4">
              <p className="text-xs font-semibold text-slate-400">{label}</p>
              <p className="mt-2 text-lg font-extrabold text-white">{value}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-white">{en ? 'Public-address monitoring only' : 'Hanya pemantauan alamat publik'}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{en ? 'KriptoAman does not ask for a seed phrase or private key. Do not enter private credentials into any monitoring form.' : 'KriptoAman tidak meminta seed phrase atau private key. Jangan memasukkan kredensial privat ke formulir pemantauan apa pun.'}</p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600"><Sparkles className="h-3 w-3" /> KRIPTOAMAN INTELLIGENCE WORKSPACE</div>
      </div>
    </div>
  );
}
