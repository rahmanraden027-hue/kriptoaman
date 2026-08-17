import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PinSetup, PIN_ENABLED_KEY } from '../components/security/PinLock';
import { TOTPSetup } from '../components/security/TOTP2FA';
import SecurityScoreGauge from '../components/security/SecurityScoreGauge';
import { Shield, ShieldCheck, Key, Fingerprint, Mail, Phone, BadgeCheck, Info, CheckCircle2, Circle, MonitorSmartphone, LogOut } from 'lucide-react';

const K_ANTI = 'ka_antiphishing';
const K_WPROT = 'ka_withdrawal_protection';
const K_PHONE = 'ka_phone_verified';

function Card({ icon: Icon, title, sub, children }) {
  return (
    <div className="ka-surface p-4 ka-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-ka-emerald" />
        <div>
          <h3 className="text-white font-bold text-sm">{title}</h3>
          {sub && <p className="ka-muted text-[10px]">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ icon: Icon, label, ok, pending, loading, onClick, link }) {
  const status = pending ? 'Dalam pengembangan' : loading ? 'Memeriksa…' : ok ? 'Aktif' : 'Siap diaktifkan';
  const inner = (
    <div className="ka-surface p-3 flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ok ? 'bg-ka-emerald/15' : 'bg-ka-card-border'}`}>
        <Icon className={`w-4 h-4 ${ok ? 'text-ka-emerald' : 'text-ka-muted'}`} />
      </div>
      <span className="text-white text-[10px] font-bold">{label}</span>
      <span className={`text-[9px] font-bold ${ok ? 'text-ka-emerald' : 'ka-muted'}`}>{status}</span>
    </div>
  );
  if (link) return <Link to={createPageUrl(link)}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="text-left tap-reset">{inner}</button>;
  return inner;
}

function formatSeen(value) {
  if (!value) return 'Tidak tersedia';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function SessionRow({ session, onRevoke, busy }) {
  const location = [session.city, session.country].filter(Boolean).join(', ');
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/30 p-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-ka-emerald/10 flex items-center justify-center">
          <MonitorSmartphone className="w-4 h-4 text-ka-emerald" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white text-xs font-bold">{session.device_label}</p>
            {session.current && <span className="rounded-full bg-ka-emerald/15 border border-ka-emerald/30 px-2 py-0.5 text-[9px] font-bold text-ka-emerald">Perangkat ini</span>}
            {!session.active && <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[9px] font-semibold text-slate-400">Sesi berakhir</span>}
          </div>
          <p className="ka-muted text-[10px] mt-1">Terakhir aktif: {formatSeen(session.last_seen_at)}</p>
          {(session.ip_masked || location) && (
            <p className="ka-muted text-[10px] mt-0.5">
              {[session.ip_masked, location].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
        {!session.current && session.active && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRevoke(session.id)}
            className="tap-reset shrink-0 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-300 disabled:opacity-50"
          >
            Cabut
          </button>
        )}
      </div>
    </div>
  );
}

export default function SecurityHub() {
  const [user, setUser] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [tfa, setTfa] = useState(false);
  const [loadingTfa, setLoadingTfa] = useState(true);
  const [setupTfa, setSetupTfa] = useState(false);
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_ENABLED_KEY) === 'true');
  const [setupPin, setSetupPin] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const anti = !!localStorage.getItem(K_ANTI);
  const wprot = localStorage.getItem(K_WPROT) === 'true';
  const phone = localStorage.getItem(K_PHONE) === 'true';

  const loadSessions = async () => {
    setSessionError('');
    try {
      const rows = await kriptoAuth.getSessions();
      setSessions(rows);
    } catch {
      setSessions([]);
      setSessionError('Riwayat sesi belum dapat dimuat.');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    kriptoAuth.get2FAStatus()
      .then((data) => setTfa(Boolean(data.enabled)))
      .catch(() => setTfa(false))
      .finally(() => setLoadingTfa(false));

    base44.auth.me()
      .then((u) => {
        setUser(u);
        base44.entities.KYCVerification.filter({ userEmail: u.email })
          .then((r) => setKyc(r[0] || null))
          .catch(() => {})
          .finally(() => setLoadingKyc(false));
      })
      .catch(() => setLoadingKyc(false));

    loadSessions();
  }, []);

  const revokeOne = async (sessionId) => {
    setSessionBusy(true);
    setSessionError('');
    try {
      await kriptoAuth.revokeSession(sessionId);
      await loadSessions();
    } catch {
      setSessionError('Sesi tersebut belum dapat dicabut. Silakan coba lagi.');
    } finally {
      setSessionBusy(false);
    }
  };

  const revokeOthers = async () => {
    setSessionBusy(true);
    setSessionError('');
    try {
      await kriptoAuth.revokeOtherSessions();
      await loadSessions();
    } catch {
      setSessionError('Sesi perangkat lain belum dapat dicabut. Silakan coba lagi.');
    } finally {
      setSessionBusy(false);
    }
  };

  const kycVerified = kyc?.status === 'verified';
  const emailAvailable = !!user?.email;
  const factors = [tfa, pin, kycVerified, emailAvailable, phone, anti, wprot];
  const score = Math.round((factors.filter(Boolean).length / factors.length) * 100);
  const recs = [
    [tfa, 'Aktifkan autentikasi dua faktor (2FA)'],
    [pin, 'Tambahkan PIN aplikasi'],
    [kycVerified, 'Lengkapi proses verifikasi identitas'],
    [anti, 'Tambahkan kode anti-phishing'],
    [wprot, 'Aktifkan perlindungan penarikan'],
    [phone, 'Tambahkan verifikasi nomor telepon'],
  ].filter(([ok]) => !ok);
  const activeOtherSessions = sessions.filter((session) => session.active && !session.current).length;

  if (setupPin) {
    return (
      <PinSetup
        onDone={() => {
          localStorage.setItem(PIN_ENABLED_KEY, 'true');
          setPin(true);
          setSetupPin(false);
        }}
        onCancel={() => setSetupPin(false)}
      />
    );
  }

  return (
    <div className="ka-bg min-h-screen text-white pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center gap-2 pt-1">
          <div className="w-9 h-9 rounded-xl bg-ka-emerald/15 border border-ka-emerald/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-ka-emerald" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Pusat Keamanan</h1>
            <p className="ka-muted text-[10px]">Kelola fitur perlindungan akun yang tersedia</p>
          </div>
        </div>

        <div className="ka-surface ka-emerald-glow p-5 flex items-center gap-4">
          <SecurityScoreGauge score={score} />
          <div className="flex-1">
            <p className="ka-muted text-[11px] font-semibold uppercase tracking-wider">Kelengkapan Pengaturan</p>
            <p className="text-white font-bold text-sm mt-0.5">
              {score >= 80
                ? 'Pengaturan keamanan Anda hampir lengkap'
                : score >= 50
                  ? 'Keamanan dapat ditingkatkan dengan beberapa langkah tambahan'
                  : 'Mulai aktifkan fitur perlindungan yang tersedia'}
            </p>
            <p className="ka-muted text-[10px] mt-1">Indikator ini menghitung pengaturan yang tersedia, bukan jaminan tingkat keamanan.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <MiniStat icon={ShieldCheck} label="2FA" ok={tfa} loading={loadingTfa} onClick={() => !tfa && !loadingTfa && setSetupTfa(true)} />
          <MiniStat icon={Fingerprint} label="Passkey" pending />
          <MiniStat icon={Mail} label="Email akun" ok={emailAvailable} />
          <MiniStat icon={Phone} label="Telepon" ok={phone} />
          <MiniStat icon={BadgeCheck} label="Verifikasi Identitas" ok={kycVerified} loading={loadingKyc} link="KYCVerificationPage" />
          <MiniStat icon={Key} label="PIN App" ok={pin} onClick={() => !pin && setSetupPin(true)} />
        </div>

        <Card icon={ShieldCheck} title="Autentikasi Dua Faktor (2FA)" sub="Lapisan autentikasi TOTP yang diverifikasi server KriptoAman">
          {setupTfa && !tfa ? (
            <TOTPSetup
              onDone={() => {
                setTfa(true);
                setSetupTfa(false);
              }}
              onCancel={() => setSetupTfa(false)}
            />
          ) : (
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${tfa ? 'text-ka-emerald' : 'ka-muted'}`}>{loadingTfa ? 'Memeriksa…' : tfa ? 'Aktif di server' : 'Siap diaktifkan'}</span>
              {!tfa && !loadingTfa && (
                <button onClick={() => setSetupTfa(true)} className="bg-ka-emerald/15 border border-ka-emerald/30 text-ka-emerald text-xs font-bold px-3 py-1.5 rounded-lg tap-reset">Aktifkan</button>
              )}
            </div>
          )}
        </Card>

        <Card icon={Info} title="Perangkat & Riwayat Login" sub="Hanya menampilkan sesi yang terverifikasi server">
          {loadingSessions ? (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-200 text-xs">Memuat sesi login terverifikasi…</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-white text-xs font-bold">Belum ada data perangkat terverifikasi</p>
                <span className="shrink-0 rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-semibold text-slate-300">0 perangkat</span>
              </div>
              <p className="text-blue-200 text-xs leading-relaxed">Hanya sesi login nyata yang dibuat server KriptoAman yang akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="ka-muted text-[10px]">{sessions.filter((s) => s.active).length} sesi aktif terverifikasi</p>
                {activeOtherSessions > 0 && (
                  <button
                    type="button"
                    disabled={sessionBusy}
                    onClick={revokeOthers}
                    className="tap-reset inline-flex items-center gap-1 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-300 disabled:opacity-50"
                  >
                    <LogOut className="w-3 h-3" />
                    Keluar dari perangkat lain
                  </button>
                )}
              </div>
              {sessions.map((session) => (
                <SessionRow key={session.id} session={session} onRevoke={revokeOne} busy={sessionBusy} />
              ))}
            </div>
          )}
          {sessionError && <p className="mt-2 text-[10px] text-amber-300">{sessionError}</p>}
          <p className="ka-muted text-[9px] mt-2 leading-relaxed">Alamat IP ditampilkan dalam bentuk tersamarkan. Lokasi hanya ditampilkan bila tersedia dari infrastruktur server dan bersifat perkiraan.</p>
        </Card>

        <Card icon={Shield} title="Langkah Peningkatan" sub="Pilihan yang dapat Anda lengkapi secara bertahap">
          {recs.length === 0 ? (
            <div className="flex gap-2 items-center text-ka-emerald text-xs font-semibold"><CheckCircle2 className="w-4 h-4" />Semua pengaturan yang tersedia telah dilengkapi.</div>
          ) : (
            <div className="space-y-2">
              {recs.map(([, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-300"><Circle className="w-3.5 h-3.5 text-ka-emerald" />{label}</div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
