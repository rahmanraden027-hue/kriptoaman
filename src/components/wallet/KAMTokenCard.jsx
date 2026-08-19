import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock3, Sparkles, Users, Gift, ArrowRight, X } from 'lucide-react';
import KriptoAmanLogo from '../brand/KriptoAmanLogo';
import { useLanguage } from '@/lib/LanguageContext';

export default function KAMTokenCard() {
  const { language } = useLanguage();
  const [showAcquireFlow, setShowAcquireFlow] = useState(false);
  const [points, setPoints] = useState({ balance: 0, history: [] });
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState('');
  const en = language === 'en';

  useEffect(() => {
    let active = true;
    setPointsLoading(true);
    setPointsError('');
    fetch('/api/auth/kam-points', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('KAM Points unavailable');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setPoints({
          balance: Number(data?.balance || 0),
          history: Array.isArray(data?.history) ? data.history : [],
        });
      })
      .catch(() => {
        if (!active) return;
        setPointsError(en ? 'KAM Points could not be loaded.' : 'KAM Points belum dapat dimuat.');
      })
      .finally(() => {
        if (active) setPointsLoading(false);
      });

    return () => { active = false; };
  }, [en]);

  const paths = [
    {
      icon: Sparkles,
      title: en ? 'Earn KAM Points' : 'Dapatkan KAM Points',
      description: en
        ? 'Eligible KriptoAman activities may earn off-chain KAM Points during the pre-release phase.'
        : 'Aktivitas KriptoAman yang memenuhi ketentuan dapat memperoleh KAM Points off-chain selama tahap pra-rilis.',
    },
    {
      icon: Users,
      title: en ? 'Community Programs' : 'Program Komunitas',
      description: en
        ? 'Verified community and participation programs may include KAM Point rewards when officially announced.'
        : 'Program komunitas dan partisipasi terverifikasi dapat mencakup reward KAM Points ketika diumumkan secara resmi.',
    },
    {
      icon: Gift,
      title: en ? 'KriptoAman Rewards' : 'Reward KriptoAman',
      description: en
        ? 'Official reward campaigns will appear here with transparent eligibility and distribution terms.'
        : 'Program reward resmi akan ditampilkan di sini dengan syarat kelayakan dan distribusi yang transparan.',
    },
  ];

  return (
    <section className="space-y-3" aria-labelledby="kam-token-title">
      <div className="overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-[#0a2540] via-[#0b3a68] to-[#8a5a12] p-5 text-white shadow-xl shadow-blue-950/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#06101d]/70">
              <KriptoAmanLogo size={48} showText={false} />
            </div>
            <div>
              <h2 id="kam-token-title" className="text-xl font-bold">KAM</h2>
              <p className="text-sm text-sky-100">KriptoAman Token</p>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
            {en ? 'PRE-RELEASE' : 'PERSIAPAN'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-black/15 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-100">KAM Points</p>
            <p className="mt-1 text-2xl font-bold">
              {pointsLoading ? '—' : Number(points.balance || 0).toLocaleString(en ? 'en-US' : 'id-ID')}
            </p>
            <p className="mt-1 text-[10px] text-sky-100/70">
              {en ? 'Off-chain reward points. Not a token balance.' : 'Poin reward off-chain. Bukan saldo token.'}
            </p>
          </div>
          <div className="rounded-xl bg-black/15 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-100">{en ? 'Market price' : 'Harga pasar'}</p>
            <p className="mt-1 text-lg font-bold">{en ? 'Not available yet' : 'Belum tersedia'}</p>
          </div>
        </div>

        {pointsError && <p className="mt-3 text-xs text-amber-200">{pointsError}</p>}

        <button
          type="button"
          onClick={() => setShowAcquireFlow(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-4 py-3 text-sm font-extrabold text-[#08213b] shadow-lg shadow-black/15 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          {en ? 'Get KAM' : 'Dapatkan KAM'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {showAcquireFlow && (
        <div className="rounded-2xl border border-cyan-400/20 bg-[#071827] p-4 shadow-xl shadow-black/20" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-300">KAM ACCESS</p>
              <h3 className="mt-1 text-lg font-extrabold text-white">{en ? 'How to get KAM' : 'Cara mendapatkan KAM'}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {en
                  ? 'During pre-release, access starts with KAM Points and official KriptoAman programs. Public token purchase is not active.'
                  : 'Selama tahap pra-rilis, akses dimulai melalui KAM Points dan program resmi KriptoAman. Pembelian token publik belum diaktifkan.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAcquireFlow(false)}
              aria-label={en ? 'Close' : 'Tutup'}
              className="rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-slate-400 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {paths.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-sky-400/10 bg-slate-950/45 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <p className="mt-3 text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>

          {points.history.length > 0 && (
            <div className="mt-4 rounded-xl border border-sky-400/10 bg-slate-950/35 p-3">
              <p className="text-xs font-bold text-white">{en ? 'Recent KAM Points activity' : 'Aktivitas KAM Points terbaru'}</p>
              <div className="mt-2 space-y-2">
                {points.history.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-slate-400">{item.reason}</span>
                    <span className="shrink-0 font-bold text-emerald-300">+{Number(item.amount).toLocaleString(en ? 'en-US' : 'id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3">
            <p className="text-xs font-semibold text-emerald-300">{en ? 'Mainnet migration' : 'Migrasi mainnet'}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {en
                ? 'Eligible KAM Points may be migrated or converted to on-chain KAM only after the public network, official addresses, distribution rules, and required verification are formally released.'
                : 'KAM Points yang memenuhi ketentuan dapat dimigrasikan atau dikonversi menjadi KAM on-chain hanya setelah jaringan publik, alamat resmi, aturan distribusi, dan verifikasi yang diperlukan dirilis secara resmi.'}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-sky-500/20 bg-[#0b1728] p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <p className="font-semibold text-white">{en ? 'On-chain data has not been published' : 'Data on-chain belum dipublikasikan'}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {en
                ? 'Price, supply, volume, contract, and official addresses will appear only after verification and publication through official KriptoAman channels.'
                : 'Harga, supply, volume, kontrak, dan alamat resmi akan ditampilkan hanya setelah data tersebut diverifikasi dan diumumkan melalui kanal resmi KriptoAman.'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-400/8 px-3 py-2 text-xs text-amber-200">
          <Clock3 className="h-4 w-4 shrink-0" />
          {en ? 'Do not send assets to an address that has not been officially announced.' : 'Jangan mengirim aset ke alamat yang belum diumumkan resmi.'}
        </div>
      </div>
    </section>
  );
}
