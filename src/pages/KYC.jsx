import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Loader2, ShieldAlert, ShieldCheck, ScanFace, LockKeyhole, DatabaseZap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { startKyc } from '@/lib/kriptoKyc';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const DIDIT_HOSTS = new Set(['verify.didit.me', 'verification.didit.me']);

function isOfficialDiditUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && DIDIT_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export default function KYC() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [readiness, setReadiness] = useState(null);

  async function refreshUser() {
    try { setUser(await base44.auth.me()); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    refreshUser();
    fetch('/api/kyc/readiness', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        setReadiness({ ...data, ready: response.ok && data.ready === true });
      })
      .catch(() => setReadiness({ ready: false, checks: {} }));
  }, []);

  async function beginVerification() {
    if (!readiness?.ready) {
      setError(en ? 'KYC server is not ready. Please try again after configuration is completed.' : 'Server KYC belum siap. Coba lagi setelah konfigurasi diselesaikan.');
      return;
    }
    setStarting(true);
    setError('');
    try {
      const result = await startKyc();
      if (result.status === 'approved') return refreshUser();
      if (!isOfficialDiditUrl(result.url)) throw new Error(en ? 'The verification URL is not an official Didit URL.' : 'URL verifikasi bukan domain resmi Didit.');
      window.location.assign(result.url);
    } catch (err) {
      setError(err.message || (en ? 'Unable to start KYC.' : 'Tidak dapat memulai KYC.'));
      setStarting(false);
    }
  }

  const status = user?.kycStatus || 'none';
  const approved = status === 'approved';
  const pending = status === 'pending';
  const checking = readiness === null;

  return (
    <div className="ka-bg ka-workspace-page min-h-screen px-4 pt-5 pb-28 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="ka-command-hero p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Link to={createPageUrl('Profile')} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/8 text-slate-400 transition hover:text-white" aria-label={en ? 'Back to profile' : 'Kembali ke profil'}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <KriptoAmanLogo size={48} showText={false} animate={false} />
              <div>
                <p className="ka-command-kicker"><ScanFace className="h-3.5 w-3.5" /> KRIPTOAMAN IDENTITY INTELLIGENCE</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{en ? 'Identity Verification Center' : 'Pusat Verifikasi Identitas'}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{en ? 'Secure identity verification through the official Didit flow with server-side readiness checks.' : 'Verifikasi identitas melalui alur resmi Didit dengan pemeriksaan kesiapan server dan perlindungan data.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ka-command-status">{readiness?.ready ? (en ? 'Verification ready' : 'Verifikasi siap') : (en ? 'Readiness check' : 'Pemeriksaan kesiapan')}</span>
              <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[10px] font-bold text-blue-300">DIDIT VERIFIED FLOW</span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <div className={`ka-command-panel flex items-start gap-3 p-4 ${readiness?.ready ? 'border-emerald-500/25' : 'border-amber-500/25'}`}>
              {checking ? <Loader2 className="h-5 w-5 animate-spin text-sky-400" /> : readiness?.ready ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <ShieldAlert className="h-5 w-5 text-amber-400" />}
              <div>
                <p className="text-sm font-bold text-white">{checking ? (en ? 'Checking KYC infrastructure…' : 'Memeriksa infrastruktur KYC…') : readiness?.ready ? (en ? 'KYC infrastructure ready' : 'Infrastruktur KYC siap') : (en ? 'KYC configuration incomplete' : 'Konfigurasi KYC belum lengkap')}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{en ? 'Secrets remain server-side and are never exposed in the browser.' : 'Secret tetap berada di sisi server dan tidak pernah ditampilkan di browser.'}</p>
              </div>
            </div>

            <div className="ka-command-panel p-6 text-center sm:p-8">
              {loading ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-sky-400" /> : approved ? (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/25 bg-emerald-500/10"><CheckCircle2 className="h-10 w-10 text-emerald-400" /></div>
                  <h2 className="mt-5 text-2xl font-black">{en ? 'Identity verified' : 'Identitas Terverifikasi'}</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{en ? 'Your identity was approved by the verification provider.' : 'Identitas Anda telah disetujui oleh penyedia verifikasi.'}</p>
                </>
              ) : pending ? (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/25 bg-amber-500/10"><Clock className="h-10 w-10 text-amber-400" /></div>
                  <h2 className="mt-5 text-2xl font-black">{en ? 'Verification in progress' : 'Verifikasi Sedang Berjalan'}</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{en ? 'Complete the Didit flow or wait for the review result.' : 'Selesaikan proses Didit atau tunggu hasil pemeriksaan.'}</p>
                  <button onClick={beginVerification} disabled={starting || !readiness?.ready} className="ka-command-button mt-5 min-h-12 w-full px-5 disabled:opacity-50">{starting ? (en ? 'Opening Didit…' : 'Membuka Didit…') : (en ? 'Continue verification' : 'Lanjutkan Verifikasi')}</button>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-sky-500/25 bg-sky-500/10"><ShieldCheck className="h-10 w-10 text-sky-400" /></div>
                  <h2 className="mt-5 text-2xl font-black">{en ? 'Verify with Didit' : 'Verifikasi dengan Didit'}</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{en ? 'Your identity document and live selfie are processed in Didit’s official flow. KriptoAman stores only the session reference and required status.' : 'Dokumen identitas dan selfie langsung diproses dalam alur resmi Didit. KriptoAman hanya menyimpan referensi sesi dan status yang diperlukan.'}</p>
                  <button onClick={beginVerification} disabled={starting || !readiness?.ready} className="ka-command-button mt-5 min-h-12 w-full px-5 disabled:opacity-50">
                    {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    {starting ? (en ? 'Preparing session…' : 'Menyiapkan sesi…') : (en ? 'Start identity verification' : 'Mulai Verifikasi Identitas')}
                  </button>
                </>
              )}
              {error && <p role="alert" className="mt-4 text-xs text-red-400">{error}</p>}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-3">
            {[
              [LockKeyhole, en ? 'Private by design' : 'Privasi terjaga', en ? 'Sensitive credentials stay outside the browser.' : 'Kredensial sensitif tidak ditampilkan di browser.'],
              [DatabaseZap, en ? 'Server verified' : 'Diverifikasi server', en ? 'Readiness is checked before a verification session starts.' : 'Kesiapan diperiksa sebelum sesi verifikasi dimulai.'],
              [ShieldCheck, en ? 'Official domain only' : 'Hanya domain resmi', en ? 'The app accepts HTTPS verification URLs on approved Didit domains.' : 'Aplikasi hanya menerima URL HTTPS pada domain Didit yang disetujui.'],
            ].map(([Icon, title, body]) => (
              <div key={title} className="ka-command-tile p-4">
                <Icon className="h-5 w-5 text-sky-400" />
                <p className="mt-3 text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </aside>
        </div>

        <div className="ka-command-panel p-4 text-xs leading-relaxed text-slate-400">
          {en ? 'Prepare your original identity document and camera. Continue only on an HTTPS Didit domain. Never send documents, OTPs, seed phrases, or private keys through chat.' : 'Siapkan dokumen identitas asli dan kamera. Lanjutkan hanya pada domain HTTPS Didit. Jangan pernah mengirim dokumen, OTP, seed phrase, atau private key melalui chat.'}
        </div>
      </div>
    </div>
  );
}
