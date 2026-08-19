import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { Gift, Copy, Share2, Check, ArrowLeft, ShieldCheck, UserPlus, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Referral() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [incomingCode, setIncomingCode] = useState('');
  const [referral, setReferral] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      let nextUser = u;
      if (!u.referralCode) {
        const code = `KA${(u.id?.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || Math.random().toString(36).slice(-6)).toUpperCase().padEnd(6, '0')}`.slice(0, 8);
        try {
          nextUser = await base44.auth.updateMe({ referralCode: code });
        } catch {
          nextUser = { ...u, referralCode: code };
        }
      }
      setUser(nextUser);
      try {
        const data = await kriptoAuth.getReferral();
        setReferral(data?.referral || null);
      } catch {
        setReferral(null);
      }
    }).catch(() => {});
  }, []);

  const referralCode = user?.referralCode || 'KA------';
  const referralLink = `${window.location.origin}/register?ref=${encodeURIComponent(referralCode)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async () => {
    const text = `Kenalkan KriptoAman kepada teman Anda. Kode referral: ${referralCode}. Reward KAM Points hanya tersedia jika syarat campaign dan verifikasi terpenuhi.`;
    if (navigator.share) {
      await navigator.share({ title: 'KriptoAman Referral', text, url: referralLink }).catch(() => null);
    } else {
      await handleCopy();
    }
  };

  async function registerIncomingReferral(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage('');
    try {
      const result = await kriptoAuth.registerReferral(incomingCode.trim().toUpperCase());
      setStatusMessage(result?.created ? 'Kode referral berhasil didaftarkan.' : 'Kode referral sebelumnya sudah tercatat pada akun ini.');
      const latest = await kriptoAuth.getReferral();
      setReferral(latest?.referral || null);
    } catch (error) {
      setStatusMessage(error?.message || 'Kode referral belum dapat didaftarkan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Profile')} className="rounded-xl border border-slate-700 bg-slate-900/70 p-2.5 text-slate-400">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.18em] text-cyan-300">KAM REFERRAL</p>
            <h1 className="text-xl font-extrabold">Program Referral KriptoAman</h1>
            <p className="mt-1 text-xs text-slate-500">Program berbasis KAM Points dengan verifikasi kelayakan dan perlindungan anti-duplikasi.</p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#071423]/90 p-6 shadow-xl shadow-black/20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(34,211,238,.15),transparent_30%),radial-gradient(circle_at_5%_100%,rgba(139,92,246,.10),transparent_30%)]" />
          <div className="relative">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><Gift className="h-5 w-5 text-cyan-300" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Kode referral Anda</p>
                <p className="mt-1 text-2xl font-black tracking-[0.16em] text-cyan-200">{referralCode}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-950/50 px-3 py-3 text-xs text-slate-400 break-all">{referralLink}</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button onClick={handleCopy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 text-sm font-bold">
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}{copied ? 'Tersalin' : 'Salin Link'}
              </button>
              <button onClick={handleShare} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-extrabold text-slate-950">
                <Share2 className="h-4 w-4" /> Bagikan
              </button>
            </div>
          </div>
        </section>

        <section className="ka-surface p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10"><UserPlus className="h-4 w-4 text-violet-300" /></div>
            <div>
              <h2 className="font-bold">Punya kode referral dari teman?</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Satu akun hanya dapat mencatat satu referrer. Self-referral dan kode yang tidak valid akan ditolak.</p>
            </div>
          </div>

          {referral ? (
            <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-300" /><p className="text-sm font-bold text-emerald-200">Referral tercatat</p></div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-slate-600">Campaign</p><p className="font-semibold text-slate-300">{referral.campaignCode}</p></div>
                <div><p className="text-slate-600">Status</p><p className="font-semibold text-slate-300">{referral.status}</p></div>
              </div>
            </div>
          ) : (
            <form onSubmit={registerIncomingReferral} className="mt-4 flex gap-2">
              <input required maxLength={8} value={incomingCode} onChange={(e) => setIncomingCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="KA123456" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm tracking-widest outline-none focus:border-violet-400" />
              <button disabled={submitting} className="rounded-xl bg-violet-500 px-4 text-sm font-extrabold disabled:opacity-50">{submitting ? '...' : 'Daftarkan'}</button>
            </form>
          )}
          {statusMessage && <p className="mt-3 text-xs text-slate-400">{statusMessage}</p>}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ['1', 'Kode tercatat', 'Invitee mendaftarkan kode referral yang valid saat campaign referral aktif.'],
            ['2', 'Verifikasi', 'Email invitee harus terverifikasi dan KYC harus berstatus approved.'],
            ['3', 'Reward ledger', 'Jika memenuhi syarat dan budget tersedia, Reward Engine mencatat KAM Points satu kali.'],
          ].map(([num, title, body]) => (
            <div key={num} className="ka-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-xs font-black text-cyan-300">{num}</div>
              <p className="mt-3 text-sm font-bold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
          <div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" /><p className="text-xs leading-relaxed text-slate-400">KAM Points masih off-chain, tidak dapat dipindahtangankan, dan belum dapat ditukar menjadi token KAM. Besaran reward mengikuti campaign aktif yang dibuat admin; tidak ada nilai rupiah atau harga token yang dijanjikan pada halaman ini.</p></div>
        </section>
      </div>
    </div>
  );
}
