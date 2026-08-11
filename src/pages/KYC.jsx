import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { startKyc } from '@/lib/kriptoKyc';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pt-6 pb-24">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Profile')} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">{en ? 'Identity verification' : 'Verifikasi Identitas'}</h1>
            <p className="text-slate-500 text-xs">{en ? 'Real KYC through Didit' : 'KYC nyata melalui Didit'}</p>
          </div>
        </div>

        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${readiness?.ready ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-amber-500/25 bg-amber-500/10'}`}>
          {checking ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : readiness?.ready ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-amber-400" />}
          <div>
            <p className="text-sm font-bold text-white">{checking ? (en ? 'Checking KYC server…' : 'Memeriksa server KYC…') : readiness?.ready ? (en ? 'KYC server ready' : 'Server KYC siap') : (en ? 'KYC configuration incomplete' : 'Konfigurasi KYC belum lengkap')}</p>
            <p className="mt-1 text-xs text-slate-400">{en ? 'Secrets are checked server-side and are never displayed in the browser.' : 'Secret diperiksa di server dan tidak pernah ditampilkan di browser.'}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 text-center space-y-4">
          {loading ? <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" /> : approved ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">{en ? 'KYC verified' : 'KYC Terverifikasi'}</h2>
              <p className="text-slate-400 text-sm">{en ? 'Your identity was approved by the verification provider.' : 'Identitas Anda telah disetujui oleh penyedia verifikasi.'}</p>
            </>
          ) : pending ? (
            <>
              <Clock className="w-14 h-14 text-amber-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">{en ? 'Verification in progress' : 'Verifikasi Sedang Berjalan'}</h2>
              <p className="text-slate-400 text-sm">{en ? 'Complete the Didit flow or wait for the review result.' : 'Selesaikan proses Didit atau tunggu hasil pemeriksaan.'}</p>
              <button onClick={beginVerification} disabled={starting || !readiness?.ready} className="w-full py-3.5 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-2xl">
                {starting ? (en ? 'Opening Didit…' : 'Membuka Didit…') : (en ? 'Continue verification' : 'Lanjutkan Verifikasi')}
              </button>
            </>
          ) : (
            <>
              <ShieldCheck className="w-14 h-14 text-blue-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">{en ? 'Verify with Didit' : 'Verifikasi dengan Didit'}</h2>
              <p className="text-slate-400 text-sm">{en ? 'Your identity document and live selfie are processed in Didit’s official flow. KriptoAman stores only the session reference and required status.' : 'Dokumen identitas dan selfie langsung diproses dalam alur resmi Didit. KriptoAman hanya menyimpan referensi sesi dan status yang diperlukan.'}</p>
              <button onClick={beginVerification} disabled={starting || !readiness?.ready} className="w-full py-3.5 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {starting ? (en ? 'Preparing session…' : 'Menyiapkan sesi…') : (en ? 'Start real KYC test' : 'Mulai Uji KYC Nyata')}
              </button>
            </>
          )}
          {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs leading-relaxed text-slate-400">
          {en ? 'Prepare your original identity document and camera. Continue only on an HTTPS Didit domain. Never send documents, OTPs, seed phrases, or private keys through chat.' : 'Siapkan dokumen identitas asli dan kamera. Lanjutkan hanya pada domain HTTPS Didit. Jangan pernah mengirim dokumen, OTP, seed phrase, atau private key melalui chat.'}
        </div>
      </div>
    </div>
  );
}
