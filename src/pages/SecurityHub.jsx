import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PinSetup, PIN_ENABLED_KEY } from '../components/security/PinLock';
import { TOTPSetup } from '../components/security/TOTP2FA';
import SecurityScoreGauge from '../components/security/SecurityScoreGauge';
import { Shield, ShieldCheck, Key, Fingerprint, Mail, Phone, BadgeCheck, Info, CheckCircle2, Circle } from 'lucide-react';

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

export default function SecurityHub() {
  const [user, setUser] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [tfa, setTfa] = useState(false);
  const [loadingTfa, setLoadingTfa] = useState(true);
  const [setupTfa, setSetupTfa] = useState(false);
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_ENABLED_KEY) === 'true');
  const [setupPin, setSetupPin] = useState(false);

  const anti = !!localStorage.getItem(K_ANTI);
  const wprot = localStorage.getItem(K_WPROT) === 'true';
  const phone = localStorage.getItem(K_PHONE) === 'true';

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
  }, []);

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

        <Card icon={Info} title="Perangkat & Riwayat Login" sub="Transparansi data keamanan akun">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-200 text-xs leading-relaxed">Data perangkat, lokasi, alamat IP, dan riwayat login akan ditampilkan setelah tersedia dari sistem sesi server yang terverifikasi. KriptoAman hanya menampilkan aktivitas akun yang bersumber dari data nyata.</p>
          </div>
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
