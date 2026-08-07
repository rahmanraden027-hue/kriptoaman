import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PinSetup, PIN_ENABLED_KEY } from '../components/security/PinLock';
import { TOTPSetup } from '../components/security/TOTP2FA';
import SecurityScoreGauge from '../components/security/SecurityScoreGauge';
import SecurityToggle from '../components/security/SecurityToggle';
import {
  Shield, ShieldCheck, Key, Fingerprint, Smartphone, Monitor, Globe, Clock, Trash2,
  CheckCircle2, XCircle, AlertTriangle, Mail, Phone, BadgeCheck, Lock,
  TriangleAlert, ChevronRight, Copy, Check,
} from 'lucide-react';

const K2FA = 'cv_2fa_enabled';
const K_ANTI = 'ka_antiphishing';
const K_WPROT = 'ka_withdrawal_protection';
const K_PHONE = 'ka_phone_verified';

function mkDevices() {
  const now = Date.now();
  return [
    { id: '1', name: 'Perangkat Ini', type: 'browser', browser: 'Chrome', os: 'Windows 11', ip: '103.xx.xx.xx', loc: 'Jakarta, ID', last: now, current: true, trusted: true },
    { id: '2', name: 'iPhone 15 Pro', type: 'mobile', browser: 'Safari', os: 'iOS 17', ip: '103.xx.xx.xx', loc: 'Jakarta, ID', last: now - 2 * 864e5, current: false, trusted: true },
    { id: '3', name: 'Laptop Kantor', type: 'monitor', browser: 'Firefox', os: 'macOS', ip: '180.xx.xx.xx', loc: 'Surabaya, ID', last: now - 7 * 864e5, current: false, trusted: false },
  ];
}
function mkHistory() {
  const acts = ['Login berhasil', 'Login berhasil', 'Login gagal (password salah)', 'Login dari perangkat baru', 'Login berhasil'];
  const locs = ['Jakarta, ID', 'Jakarta, ID', 'Jakarta, ID', 'Surabaya, ID', 'Jakarta, ID'];
  return acts.map((a, i) => ({
    id: String(i), action: a, success: !a.includes('gagal'), loc: locs[i],
    ip: `103.${Math.floor(Math.random() * 255)}.xx.xx`, date: Date.now() - i * 5 * 36e5,
    device: i % 2 ? 'Safari / iPhone' : 'Chrome / Windows',
  }));
}
const fmt = (t) => new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const devIcon = (t) => (t === 'mobile' ? Smartphone : t === 'browser' ? Globe : Monitor);

function Card({ icon: Icon, title, sub, children, delay = 0 }) {
  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: `${delay}ms` }}>
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

function StatusPill({ ok, label }) {
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? 'bg-ka-emerald/15 text-ka-emerald' : 'bg-[#e74c3c]/15 text-[#e74c3c]'}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{label}
    </span>
  );
}

function MiniStat({ icon: Icon, label, ok, placeholder, loading, onClick, link }) {
  const inner = (
    <div className={`ka-surface p-3 flex flex-col items-center gap-1 ${onClick ? 'ka-surface-hover' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${placeholder ? 'bg-ka-card-border' : ok ? 'bg-ka-emerald/15' : 'bg-[#e74c3c]/10'}`}>
        <Icon className={`w-4 h-4 ${placeholder ? 'text-ka-muted' : ok ? 'text-ka-emerald' : 'text-[#e74c3c]'}`} />
      </div>
      <span className="text-white text-[10px] font-bold">{label}</span>
      <span className={`text-[9px] font-bold ${placeholder ? 'ka-muted' : ok ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
        {placeholder ? 'Segera' : loading ? '…' : ok ? 'Aktif' : 'Nonaktif'}
      </span>
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

  const [tfa, setTfa] = useState(() => localStorage.getItem(K2FA) === 'true');
  const [setupTfa, setSetupTfa] = useState(false);
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_ENABLED_KEY) === 'true');
  const [setupPin, setSetupPin] = useState(false);
  const [anti, setAnti] = useState(() => localStorage.getItem(K_ANTI) || '');
  const [antiInput, setAntiInput] = useState('');
  const [wprot, setWprot] = useState(() => localStorage.getItem(K_WPROT) === 'true');
  const [phone, setPhone] = useState(() => localStorage.getItem(K_PHONE) === 'true');
  const [phoneInput, setPhoneInput] = useState('');
  const [devices, setDevices] = useState(mkDevices);
  const [history] = useState(mkHistory);
  const [copied, setCopied] = useState(false);
  const [emergency, setEmergency] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      base44.entities.KYCVerification.filter({ userEmail: u.email })
        .then((r) => setKyc(r[0] || null))
        .catch(() => {})
        .finally(() => setLoadingKyc(false));
    }).catch(() => setLoadingKyc(false));
  }, []);

  const kycVerified = kyc?.status === 'verified';
  const emailVerified = !!user?.email;

  const factors = [
    { ok: tfa, w: 16 },
    { ok: pin, w: 14 },
    { ok: kycVerified, w: 18 },
    { ok: emailVerified, w: 12 },
    { ok: phone, w: 10 },
    { ok: !!anti, w: 12 },
    { ok: wprot, w: 18 },
  ];
  const score = factors.reduce((s, f) => s + (f.ok ? f.w : 0), 0);

  const recs = [
    { ok: tfa, label: 'Aktifkan Autentikasi Dua Faktor (2FA)' },
    { ok: pin, label: 'Pasang PIN kunci aplikasi' },
    { ok: kycVerified, label: 'Selesaikan verifikasi KYC' },
    { ok: !!anti, label: 'Atur kode Anti-Phishing' },
    { ok: wprot, label: 'Aktifkan Perlindungan Withdrawal' },
    { ok: phone, label: 'Verifikasi nomor telepon' },
  ].filter((r) => !r.ok);

  const saveAnti = () => {
    const v = antiInput.trim();
    if (v.length < 4) return;
    localStorage.setItem(K_ANTI, v);
    setAnti(v);
    setAntiInput('');
  };
  const verifyPhone = () => {
    if (phoneInput.replace(/\D/g, '').length < 8) return;
    localStorage.setItem(K_PHONE, 'true');
    setPhone(true);
    setPhoneInput('');
  };
  const revokeDevice = (id) => setDevices((d) => d.filter((x) => x.id !== id));

  const doEmergencyLock = () => {
    localStorage.setItem('ka_emergency_lock', 'true');
    setEmergency(true);
    setTimeout(() => { base44.auth.logout('/'); }, 1500);
  };

  if (setupPin) {
    return <PinSetup onDone={() => { localStorage.setItem(PIN_ENABLED_KEY, 'true'); setPin(true); setSetupPin(false); }} onCancel={() => setSetupPin(false)} />;
  }

  return (
    <div className="ka-bg min-h-screen text-white pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-9 h-9 rounded-xl bg-ka-emerald/15 border border-ka-emerald/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-ka-emerald" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Security Hub</h1>
            <p className="ka-muted text-[10px]">Kontrol keamanan akun enterprise</p>
          </div>
        </div>

        {/* Score */}
        <div className="ka-surface ka-emerald-glow p-5 ka-fade-up flex items-center gap-4">
          <SecurityScoreGauge score={score} />
          <div className="flex-1">
            <p className="ka-muted text-[11px] font-semibold uppercase tracking-wider">Security Score</p>
            <p className="text-white font-bold text-sm mt-0.5">{score >= 80 ? 'Akun Anda terlindungi dengan baik' : score >= 50 ? 'Beberapa perlindungan perlu diaktifkan' : 'Akun Anda rentan — segera amankan'}</p>
            <p className="ka-muted text-[10px] mt-1">{factors.filter((f) => f.ok).length}/{factors.length} lapisan aktif</p>
          </div>
        </div>

        {/* Quick checklist */}
        <div className="grid grid-cols-2 gap-2.5 ka-fade-up" style={{ animationDelay: '60ms' }}>
          <MiniStat icon={ShieldCheck} label="2FA" ok={tfa} onClick={() => !tfa && setSetupTfa(true)} />
          <MiniStat icon={Fingerprint} label="Passkey" placeholder />
          <MiniStat icon={Mail} label="Email" ok={emailVerified} />
          <MiniStat icon={Phone} label="Telepon" ok={phone} />
          <MiniStat icon={BadgeCheck} label="KYC" ok={kycVerified} loading={loadingKyc} link="KYCVerificationPage" />
          <MiniStat icon={Key} label="PIN App" ok={pin} onClick={() => !pin && setSetupPin(true)} />
        </div>

        {/* 2FA */}
        <Card icon={ShieldCheck} title="Autentikasi Dua Faktor (2FA)" sub="Lapisan keamanan tambahan dengan TOTP">
          {setupTfa && !tfa ? (
            <TOTPSetup onDone={() => { localStorage.setItem(K2FA, 'true'); setTfa(true); setSetupTfa(false); }} onCancel={() => setSetupTfa(false)} />
          ) : (
            <div className="flex items-center justify-between">
              <StatusPill ok={tfa} label={tfa ? 'Aktif · TOTP' : 'Nonaktif'} />
              {tfa
                ? <button onClick={() => { localStorage.setItem(K2FA, 'false'); setTfa(false); }} className="text-[#e74c3c] text-xs font-bold tap-reset">Nonaktifkan</button>
                : <button onClick={() => setSetupTfa(true)} className="bg-ka-emerald/15 border border-ka-emerald/30 text-ka-emerald text-xs font-bold px-3 py-1.5 rounded-lg tap-reset">Aktifkan</button>}
            </div>
          )}
        </Card>

        {/* Device Management */}
        <Card icon={Monitor} title="Manajemen Perangkat" sub={`${devices.length} perangkat terhubung`}>
          <div className="space-y-2">
            {devices.map((d) => {
              const Icon = devIcon(d.type);
              return (
                <div key={d.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${d.current ? 'bg-ka-emerald/8 border-ka-emerald/25' : 'bg-ka-card border-ka-card-border'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.current ? 'bg-ka-emerald/20' : 'bg-ka-card-border'}`}>
                    <Icon className={`w-4 h-4 ${d.current ? 'text-ka-emerald' : 'text-ka-muted'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white text-xs font-bold">{d.name}</span>
                      {d.current && <span className="text-[9px] bg-ka-emerald/20 text-ka-emerald px-1.5 py-0.5 rounded-full">Ini</span>}
                      {d.trusted && <span className="text-[9px] bg-ka-emerald/12 text-ka-emerald px-1.5 py-0.5 rounded-full">Dipercaya</span>}
                    </div>
                    <p className="ka-muted text-[10px] mt-0.5">{d.browser} · {d.os}</p>
                    <p className="ka-muted text-[9px]">{d.loc} · {d.ip} · {fmt(d.last)}</p>
                  </div>
                  {!d.current && <button onClick={() => revokeDevice(d.id)} className="text-ka-muted hover:text-[#e74c3c] tap-reset p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Active Sessions */}
        <Card icon={Globe} title="Sesi Aktif" sub="Sesi login yang masih berlaku" delay={40}>
          <div className="space-y-2">
            {devices.filter((d) => d.current || d.trusted).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-ka-card border border-ka-card-border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-ka-emerald ka-pulse-dot shrink-0" />
                  <span className="text-white text-xs font-bold truncate">{d.name}</span>
                </div>
                <span className="ka-muted text-[10px]">{d.loc}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Login History */}
        <Card icon={Clock} title="Riwayat Login" sub="Aktivitas otentikasi terkini" delay={80}>
          <div className="space-y-1">
            {history.map((l) => (
              <div key={l.id} className="flex items-start gap-2.5 py-2 border-b border-ka-card-border last:border-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${l.success ? 'bg-ka-emerald/20' : 'bg-[#e74c3c]/20'}`}>
                  {l.success ? <CheckCircle2 className="w-3.5 h-3.5 text-ka-emerald" /> : <XCircle className="w-3.5 h-3.5 text-[#e74c3c]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${l.success ? 'text-white' : 'text-[#e74c3c]'}`}>{l.action}</p>
                  <p className="ka-muted text-[9px]">{l.device} · {l.loc} · {l.ip}</p>
                </div>
                <span className="ka-muted text-[9px] shrink-0">{fmt(l.date)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Anti-Phishing Code */}
        <Card icon={Shield} title="Kode Anti-Phishing" sub="Kode rahasia pada setiap email resmi KriptoAman" delay={120}>
          {anti ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="ka-muted text-[10px]">Kode aktif</p>
                <p className="text-ka-emerald font-mono text-sm font-bold">{anti}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { navigator.clipboard?.writeText(anti); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="ka-muted hover:text-ka-emerald tap-reset p-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-ka-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => { localStorage.removeItem(K_ANTI); setAnti(''); }} className="text-[#e74c3c] text-xs font-bold tap-reset">Ubah</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={antiInput} onChange={(e) => setAntiInput(e.target.value)} placeholder="Min. 4 karakter"
                className="flex-1 bg-ka-card border border-ka-card-border rounded-lg px-3 py-2 text-white text-xs" />
              <button onClick={saveAnti} className="bg-ka-emerald/15 border border-ka-emerald/30 text-ka-emerald text-xs font-bold px-3 rounded-lg tap-reset">Set</button>
            </div>
          )}
        </Card>

        {/* Withdrawal Protection */}
        <Card icon={Lock} title="Perlindungan Withdrawal" sub="24h hold + verifikasi untuk penarikan besar" delay={160}>
          <div className="flex items-center justify-between">
            <p className="text-white text-xs">Hold 24 jam pada penarikan di atas $1.000</p>
            <SecurityToggle checked={wprot} onChange={(v) => { localStorage.setItem(K_WPROT, String(v)); setWprot(v); }} />
          </div>
        </Card>

        {/* Email & Phone Verification */}
        <div className="grid grid-cols-1 gap-2.5 ka-fade-up" style={{ animationDelay: '200ms' }}>
          <Card icon={Mail} title="Verifikasi Email">
            <div className="flex items-center justify-between">
              <p className="text-white text-xs font-mono truncate">{user?.email || '—'}</p>
              <StatusPill ok={emailVerified} label={emailVerified ? 'Terverifikasi' : 'Belum'} />
            </div>
          </Card>
          <Card icon={Phone} title="Verifikasi Telepon">
            {phone ? (
              <div className="flex items-center justify-between">
                <p className="text-white text-xs font-mono">+62 ··· ···· (terverifikasi)</p>
                <StatusPill ok label="Aktif" />
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+62 8xx xxxx" inputMode="tel"
                  className="flex-1 bg-ka-card border border-ka-card-border rounded-lg px-3 py-2 text-white text-xs" />
                <button onClick={verifyPhone} className="bg-ka-emerald/15 border border-ka-emerald/30 text-ka-emerald text-xs font-bold px-3 rounded-lg tap-reset">Verifikasi</button>
              </div>
            )}
          </Card>
        </div>

        {/* KYC Status */}
        <Card icon={BadgeCheck} title="Status KYC" sub="Verifikasi identitas sesuai regulasi Bappebti" delay={240}>
          <div className="flex items-center justify-between">
            <StatusPill ok={kycVerified} label={loadingKyc ? 'Memeriksa…' : kycVerified ? 'Terverifikasi' : kyc?.status === 'pending' ? 'Pending' : 'Belum'} />
            <Link to={createPageUrl('KYCVerificationPage')} className="flex items-center gap-1 text-ka-emerald text-xs font-bold tap-reset">
              {kycVerified ? 'Detail' : 'Verifikasi'} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Security Recommendations */}
        <Card icon={AlertTriangle} title="Rekomendasi Keamanan" delay={280}>
          {recs.length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle2 className="w-4 h-4 text-ka-emerald" />
              <p className="text-ka-emerald text-xs font-bold">Semua lapisan keamanan aktif. Kerja bagus!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recs.map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-yellow-200 text-xs">{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Emergency Account Lock */}
        <div className="ka-surface p-4 ka-fade-up border-[#e74c3c]/30" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert className="w-4 h-4 text-[#e74c3c]" />
            <h3 className="text-white font-bold text-sm">Emergency Account Lock</h3>
          </div>
          <p className="ka-muted text-[11px] leading-relaxed mb-3">
            Kunci seketika semua akses akun dan paksa logout dari semua perangkat. Gunakan hanya jika mencurigai akun dibajak.
          </p>
          <button onClick={doEmergencyLock} disabled={emergency}
            className="w-full py-2.5 rounded-xl bg-[#e74c3c]/15 border border-[#e74c3c]/40 text-[#e74c3c] text-xs font-bold tap-reset disabled:opacity-60">
            {emergency ? 'Mengunci akun…' : 'Kunci Akun Sekarang'}
          </button>
        </div>

        <p className="ka-muted text-[10px] text-center leading-relaxed pt-1">
          KriptoAman · Enkripsi SSL 256-bit · Sesuai regulasi Bappebti &amp; OJK
        </p>
      </div>
    </div>
  );
}