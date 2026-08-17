import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, BarChart3, Settings2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import WalletProfileCard from '../components/wallet/WalletProfileCard';
import WalletConnectPanel from '../components/wallet/WalletConnectPanel';
import KAMTokenCard from '../components/wallet/KAMTokenCard';

export default function Wallet() {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [connectedAddressCount, setConnectedAddressCount] = useState(0);
  const en = language === 'en';

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-2xl space-y-5 px-4 sm:px-6 pt-5">
        <header className="flex items-center justify-between">
          <KriptoAmanLogo size={42} showText textSize="text-sm" />
          <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold text-blue-300">
            {en ? 'WATCH-ONLY MODE' : 'MODE PEMANTAUAN'}
          </span>
        </header>

        <WalletProfileCard user={currentUser} address="" coin="" />

        <section className="ka-surface overflow-hidden p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10">
              <Wifi className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold">{en ? 'Watch-only portfolio' : 'Portofolio dalam mode pemantauan'}</h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {en
                  ? 'The public version monitors public wallet and asset information. Sending, swapping, deposits, withdrawals, trading, lending, staking, bridging, and CEX execution are not enabled.'
                  : 'Versi publik digunakan untuk memantau informasi alamat publik dan aset. Pengiriman, swap, deposit, penarikan, perdagangan, lending, staking, bridge, dan eksekusi CEX tidak diaktifkan.'}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('Market')} className="ka-surface ka-surface-hover flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <span className="text-sm font-semibold">{en ? 'Watch Markets' : 'Pantau Pasar'}</span>
          </Link>
          <Link to={createPageUrl('SecurityHub')} className="ka-surface ka-surface-hover flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
            <Settings2 className="h-6 w-6 text-amber-400" />
            <span className="text-sm font-semibold">{en ? 'Security Center' : 'Pusat Keamanan'}</span>
          </Link>
        </div>

        <WalletConnectPanel onConnectionCountChange={setConnectedAddressCount} />

        <KAMTokenCard userBalance={currentUser?.kamBalance || 0} />

        <section className="grid gap-3 sm:grid-cols-3" aria-label={en ? 'Monitoring status' : 'Status pemantauan'}>
          {[
            [
              en ? 'Connected addresses' : 'Alamat terhubung',
              String(connectedAddressCount),
              connectedAddressCount
                ? (en ? 'Public wallet connection active' : 'Koneksi alamat publik aktif')
                : (en ? 'Connect a public wallet when available' : 'Hubungkan alamat publik saat tersedia'),
            ],
            [en ? 'Recent activity' : 'Aktivitas terbaru', '—', en ? 'No monitored transactions' : 'Belum ada transaksi yang dipantau'],
            [en ? 'Wallet mode' : 'Mode wallet', en ? 'Watch-only' : 'Pemantauan', en ? 'No custody or transaction execution' : 'Tanpa kustodi atau eksekusi transaksi'],
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
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {en
                  ? 'KriptoAman does not ask for a seed phrase or private key. Do not enter private credentials into any monitoring form.'
                  : 'KriptoAman tidak meminta seed phrase atau private key. Jangan memasukkan kredensial privat ke formulir pemantauan apa pun.'}
              </p>
            </div>
          </div>
        </section>

        <p className="px-2 text-center text-xs leading-relaxed text-slate-500">
          {en
            ? 'KriptoAman provides monitoring and informational tools. It does not custody assets, execute trades, or guarantee investment outcomes.'
            : 'KriptoAman menyediakan alat pemantauan dan informasi. KriptoAman tidak menyimpan aset, mengeksekusi perdagangan, atau menjamin hasil investasi.'}
        </p>
      </div>
    </div>
  );
}
