import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock3, Sparkles, Users, Gift, ArrowRight, X, Activity, Database } from 'lucide-react';
import KriptoAmanLogo from '../brand/KriptoAmanLogo';
import { useLanguage } from '@/lib/LanguageContext';
import { useWeb3 } from '../web3/Web3Provider';

export default function KAMTokenCard() {
  const { language } = useLanguage();
  const web3 = useWeb3();
  const [showAcquireFlow, setShowAcquireFlow] = useState(false);
  const [points, setPoints] = useState({ balance: 0, history: [] });
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState('');
  const [network, setNetwork] = useState({ loading: true, live: false, verified: false });
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

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadNetwork = async () => {
      try {
        const query = web3?.account ? `?address=${encodeURIComponent(web3.account)}` : '';
        const response = await fetch(`/api/kam/network-status${query}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'KAM network unavailable');
        if (active) setNetwork({ ...data, loading: false });
      } catch (error) {
        if (active && error?.name !== 'AbortError') {
          setNetwork({ loading: false, live: false, verified: false, status: 'unavailable' });
        }
      }
    };
    loadNetwork();
    const interval = window.setInterval(loadNetwork, 30_000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [web3?.account]);

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
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${network.verified ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-amber-300/25 bg-amber-300/10 text-amber-200'}`}>
            {network.verified ? (en ? 'RPC VERIFIED' : 'RPC TERVERIFIKASI') : (en ? 'MAINNET CANDIDATE' : 'KANDIDAT MAINNET')}
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
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-100">{en ? 'On-chain KAM' : 'KAM on-chain'}</p>
            <p className="mt-1 text-lg font-bold">
              {network.verified && web3?.account && network.wallet?.balanceKAM != null
                ? Number(network.wallet.balanceKAM).toLocaleString(en ? 'en-US' : 'id-ID', { maximumFractionDigits: 8 })
                : '—'}
            </p>
            <p className="mt-1 text-[10px] text-sky-100/70">
              {web3?.account
                ? (network.verified ? (en ? 'Verified from KAM RPC.' : 'Terverifikasi dari RPC KAM.') : (en ? 'RPC not publicly verified.' : 'RPC belum terverifikasi publik.'))
                : (en ? 'Connect an EVM public address.' : 'Hubungkan alamat publik EVM.')}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-black/10 p-2">
            <p className="text-[9px] uppercase tracking-wide text-sky-100/60">Chain ID</p>
            <p className="mt-1 text-xs font-bold">{network.chainId || 22028}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-2">
            <p className="text-[9px] uppercase tracking-wide text-sky-100/60">{en ? 'Block' : 'Blok'}</p>
            <p className="mt-1 text-xs font-bold">{network.verified && network.blockNumber != null ? Number(network.blockNumber).toLocaleString(en ? 'en-US' : 'id-ID') : '—'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-2">
            <p className="text-[9px] uppercase tracking-wide text-sky-100/60">{en ? 'Source' : 'Sumber'}</p>
            <p className={`mt-1 text-xs font-bold ${network.verified ? 'text-emerald-200' : 'text-amber-200'}`}>{network.verified ? 'RPC LIVE' : 'CANDIDATE'}</p>
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
          {network.verified ? <Activity className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <Database className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />}
          <div>
            <p className="font-semibold text-white">
              {network.verified
                ? (en ? 'Verified KAM on-chain data' : 'Data on-chain KAM terverifikasi')
                : (en ? 'KAM mainnet candidate — not public' : 'Kandidat mainnet KAM — belum publik')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {network.verified
                ? (en ? `Chain ID ${network.chainIdHex} and current block are read directly from the official RPC.` : `Chain ID ${network.chainIdHex} dan blok terkini dibaca langsung dari RPC resmi.`)
                : (en ? 'The app shows verified configuration only. Block height, wallet balance, market price, volume, and circulating supply remain blank until a matching public RPC is live.' : 'Aplikasi hanya menampilkan konfigurasi yang telah diverifikasi. Tinggi blok, saldo wallet, harga pasar, volume, dan suplai beredar tetap kosong sampai RPC publik yang sesuai aktif.')}
            </p>
          </div>
        </div>
        <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${network.verified ? 'bg-emerald-400/8 text-emerald-200' : 'bg-amber-400/8 text-amber-200'}`}>
          {network.verified ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <Clock3 className="h-4 w-4 shrink-0" />}
          {network.verified
            ? (en ? 'Read-only verification. Transactions remain disabled.' : 'Verifikasi read-only. Transaksi tetap dinonaktifkan.')
            : (en ? 'Do not send assets until public activation is formally announced.' : 'Jangan mengirim aset sampai aktivasi publik diumumkan resmi.')}
        </div>
      </div>
    </section>
  );
}
