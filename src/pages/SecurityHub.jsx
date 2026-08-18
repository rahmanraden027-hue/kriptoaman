import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PinSetup, PIN_ENABLED_KEY } from '../components/security/PinLock';
import { TOTPSetup } from '../components/security/TOTP2FA';
import SecurityScoreGauge from '../components/security/SecurityScoreGauge';
import {
  Shield, ShieldCheck, Key, Fingerprint, Mail, Phone, BadgeCheck, Info,
  CheckCircle2, Circle, MonitorSmartphone, LogOut, LockKeyhole, Radar,
  Activity, Server, Sparkles
} from 'lucide-react';

const K_ANTI = 'ka_antiphishing';
const K_WPROT = 'ka_withdrawal_protection';
const K_PHONE = 'ka_phone_verified';

function Card({ icon: Icon, title, sub, children }) {
  return (
    <div className="ka-surface ka-surface-hover relative overflow-hidden p-5 ka-fade-up">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="relative mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
          <Icon className="h-4.5 w-4.5 text-cyan-300" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-white">{title}</h3>
          {sub && <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">{sub}</p>}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, ok, pending, loading, onClick, link }) {
  const status = pending ? 'Dalam pengembangan' : loading ? 'Memeriksa…' : ok ? 'Aktif' : 'Siap diaktifkan';
  const inner = (
    <div className="ka-surface ka-surface-hover group flex min-h-28 flex-col items-center justify-center gap-2 p-3 text-center">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all ${ok ? 'border-cyan-400/30 bg-cyan-400/12 shadow-[0_0_24px_rgba(34,211,238,0.08)]' : 'border-slate-700/60 bg-slate-900/55'}`}>
        <Icon className={`h-4.5 w-4.5 ${ok ? 'text-cyan-300' : 'text-slate-500'}`} />
      </div>
      <span className="text-[10px] font-extrabold text-white">{label}</span>
      <span className={`text-[9px] font-bold ${ok ? 'text-emerald-300' : 'text-slate-500'}`}>{status}</span>
    </div>
  );
  if (link) return <Link to={createPageUrl(link)}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="tap-reset w-full text-left">{inner}</button>;
  return inner;
}

function formatSeen(value) {
  if (!value) return 'Tidak tersedia';
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function SessionRow({ session, onRevoke, busy }) {
  const location = [session.city, session.country].filter(Boolean).join(', ');
  return (
    <div className="rounded-2xl border border-slate-700/55 bg-slate-950/35 p-3.5 transition-colors hover:border-cyan-400/20">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
          <MonitorSmartphone className="h-4 w-4 text-cyan-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-white">{session.device_label}</p>
            {session.current && <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">Perangkat ini</span>}
            {!session.active && <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[9px] font-semibold text-slate-400">Sesi berakhir</span>}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Terakhir aktif: {formatSeen(session.last_seen_at)}</p>
          {(session.ip_masked || location) && <p className="mt-0.5 text-[10px] text-slate-500">{[session.ip_masked, location].filter(Boolean).join(' • ')}</p>}
        </div>
        {!session.current && session.active && (
          <button type="button" disabled={busy} onClick={() => onRevoke(session.id)}
            className="tap-reset shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-300 disabled:opacity-50">
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
    kriptoAuth.get2FAStatus().then((data) => setTfa(Boolean(data.enabled))).catch(() => setTfa(false)).finally(() => setLoadingTfa(false));
    base44.auth.me().then((u) => {
      setUser(u);
      base44.entities.KYCVerification.filter({ userEmail: u.email })
        .then((r) => setKyc(r[0] || null)).catch(() => {}).finally(() => setLoadingKyc(false));
    }).catch(() => setLoadingKyc(false));
    loadSessions();
  }, []);

  const revokeOne = async (sessionId) => {
    setSessionBusy(true); setSessionError('');
    try { await kriptoAuth.revokeSession(sessionId); await loadSessions(); }
    catch { setSessionError('Sesi tersebut belum dapat dicabut. Silakan coba lagi.'); }
    finally { setSessionBusy(false); }
  };

  const revokeOthers = async () => {
    setSessionBusy(true); setSessionError('');
    try { await kriptoAuth.revokeOtherSessions(); await loadSessions(); }
    catch { setSessionError('Sesi perangkat lain belum dapat dicabut. Silakan coba lagi.'); }
    finally { setSessionBusy(false); }
  };

  const kycVerified = kyc?.status === 'verified';
  const emailAvailable = !!user?.email;
  const factors = [tfa, pin, kycVerified, emailAvailable, phone, anti, wprot];
  const score = Math.round((factors.filter(Boolean).length / factors.length) * 100);
  const recs = [
    [tfa, 'Aktifkan autentikasi dua faktor (2FA)'], [pin, 'Tambahkan PIN aplikasi'],
    [kycVerified, 'Lengkapi proses verifikasi identitas'], [anti, 'Tambahkan kode anti-phishing'],
    [wprot, 'Aktifkan perlindungan penarikan'], [phone, 'Tambahkan verifikasi nomor telepon'],
  ].filter(([ok]) => !ok);
  const activeOtherSessions = sessions.filter((session) => session.active && !session.current).length;
  const activeCount = sessions.filter((session) => session.active).length;

  if (setupPin) {
    return <PinSetup onDone={() => { localStorage.setItem(PIN_ENABLED_KEY, 'true'); setPin(true); setSetupPin(false); }} onCancel={() => setSetupPin(false)} />;
  }

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(8,20,36,.96),rgba(4,12,25,.96))] p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-80 bg-blue-600/10 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[1.45fr_.8fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-300">
                <Radar className="h-3.5 w-3.5" /> KRIPTOAMAN CYBER DEFENSE CENTER
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 shadow-[0_0_32px_rgba(34,211,238,0.1)]">
                  <Shield className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Pusat Keamanan</h1>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">Satu pusat untuk autentikasi, identitas, sesi perangkat, dan posture keamanan akun KriptoAman.</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  [Activity, 'Security score', `${score}%`],
                  [MonitorSmartphone, 'Sesi aktif', String(activeCount)],
                  [LockKeyhole, '2FA', loadingTfa ? '...' : tfa ? 'Aktif' : 'Siap'],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/7 bg-white/[0.035] p-3 backdrop-blur">
                    <Icon className="h-4 w-4 text-cyan-300" />
                    <p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-0.5 text-sm font-extrabold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="ka-surface ka-emerald-glow flex items-center gap-4 p-5">
              <SecurityScoreGauge score={score} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-300"><Sparkles className="h-3 w-3" /> Security posture</div>
                <p className="mt-2 text-sm font-extrabold text-white">{score >= 80 ? 'Pengaturan hampir lengkap' : score >= 50 ? 'Beberapa lapisan dapat ditingkatkan' : 'Aktifkan perlindungan utama'}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">Skor menunjukkan kelengkapan konfigurasi, bukan jaminan keamanan absolut.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat icon={ShieldCheck} label="2FA" ok={tfa} loading={loadingTfa} onClick={() => !tfa && !loadingTfa && setSetupTfa(true)} />
          <MiniStat icon={Fingerprint} label="Passkey" pending />
          <MiniStat icon={Mail} label="Email akun" ok={emailAvailable} />
          <MiniStat icon={Phone} label="Telepon" ok={phone} />
          <MiniStat icon={BadgeCheck} label="Identitas" ok={kycVerified} loading={loadingKyc} link="KYCVerificationPage" />
          <MiniStat icon={Key} label="PIN App" ok={pin} onClick={() => !pin && setSetupPin(true)} />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card icon={ShieldCheck} title="Autentikasi Dua Faktor (2FA)" sub="TOTP yang diverifikasi server KriptoAman">
            {setupTfa && !tfa ? (
              <TOTPSetup onDone={() => { setTfa(true); setSetupTfa(false); }} onCancel={() => setSetupTfa(false)} />
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/50 bg-slate-950/30 p-3.5">
                <span className={`text-xs font-bold ${tfa ? 'text-emerald-300' : 'text-slate-400'}`}>{loadingTfa ? 'Memeriksa…' : tfa ? 'Aktif di server' : 'Siap diaktifkan'}</span>
                {!tfa && !loadingTfa && <button onClick={() => setSetupTfa(true)} className="tap-reset rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-300">Aktifkan</button>}
              </div>
            )}
          </Card>

          <Card icon={Server} title="Status Pertahanan Akun" sub="Ringkasan lapisan yang aktif saat ini">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Email', emailAvailable], ['Identitas', kycVerified], ['PIN', pin], ['2FA', tfa],
              ].map(([label, ok]) => (
                <div key={label} className="rounded-2xl border border-slate-700/50 bg-slate-950/30 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className={`mt-1 text-xs font-extrabold ${ok ? 'text-emerald-300' : 'text-slate-400'}`}>{ok ? 'Aktif' : 'Belum aktif'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card icon={Info} title="Perangkat & Riwayat Login" sub="Hanya sesi yang terverifikasi server">
          {loadingSessions ? (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3"><p className="text-xs text-blue-200">Memuat sesi login terverifikasi…</p></div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-white">Belum ada data perangkat terverifikasi</p><span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] text-slate-300">0 perangkat</span></div>
              <p className="mt-1.5 text-xs leading-relaxed text-blue-200">Hanya sesi login nyata yang dibuat server KriptoAman yang muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] text-slate-400">{activeCount} sesi aktif terverifikasi</p>
                {activeOtherSessions > 0 && <button type="button" disabled={sessionBusy} onClick={revokeOthers} className="tap-reset inline-flex items-center gap-1 rounded-xl border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-300 disabled:opacity-50"><LogOut className="h-3 w-3" /> Keluar dari perangkat lain</button>}
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">{sessions.map((session) => <SessionRow key={session.id} session={session} onRevoke={revokeOne} busy={sessionBusy} />)}</div>
            </div>
          )}
          {sessionError && <p className="mt-2 text-[10px] text-amber-300">{sessionError}</p>}
          <p className="mt-3 text-[9px] leading-relaxed text-slate-500">Alamat IP disamarkan. Lokasi hanya ditampilkan bila tersedia dari infrastruktur server dan bersifat perkiraan.</p>
        </Card>

        <Card icon={Shield} title="Langkah Peningkatan" sub="Prioritas yang dapat dilengkapi secara bertahap">
          {recs.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-xs font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" />Semua pengaturan yang tersedia telah dilengkapi.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">{recs.map(([, label]) => <div key={label} className="flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-950/30 p-3 text-xs text-slate-300"><Circle className="h-3.5 w-3.5 text-cyan-300" />{label}</div>)}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
