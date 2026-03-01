import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Smartphone, Monitor, Globe, Clock, Trash2, CheckCircle2, XCircle, Key, RefreshCw, AlertTriangle, Copy, Check, Lock, Fingerprint, Timer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PinSetup, PIN_ENABLED_KEY, BIOMETRIC_ENABLED_KEY, PIN_STORAGE_KEY } from '../security/PinLock';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const STORAGE_KEY_2FA = 'cv_2fa_enabled';
const STORAGE_KEY_DEVICES = 'cv_login_devices';
const STORAGE_KEY_SECRET = 'cv_2fa_secret';

// Simulate TOTP secret generation
function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getDeviceIcon(type) {
  if (type === 'mobile') return Smartphone;
  if (type === 'browser') return Globe;
  return Monitor;
}

function generateMockDevices() {
  const devices = [
    {
      id: '1',
      name: 'Perangkat Ini',
      type: 'browser',
      browser: 'Chrome 122',
      os: 'Windows 11',
      ip: '103.xx.xx.xx',
      location: 'Jakarta, Indonesia',
      lastLogin: new Date().toISOString(),
      current: true,
      trusted: true,
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      type: 'mobile',
      browser: 'Safari',
      os: 'iOS 17.3',
      ip: '103.xx.xx.xx',
      location: 'Jakarta, Indonesia',
      lastLogin: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      current: false,
      trusted: true,
    },
    {
      id: '3',
      name: 'Laptop Kantor',
      type: 'monitor',
      browser: 'Firefox 123',
      os: 'macOS Sonoma',
      ip: '180.xx.xx.xx',
      location: 'Surabaya, Indonesia',
      lastLogin: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      current: false,
      trusted: false,
    },
  ];
  return devices;
}

function generateLoginHistory() {
  const actions = ['Login berhasil', 'Login berhasil', 'Login berhasil', 'Login gagal (salah password)', 'Login berhasil', 'Login dari perangkat baru'];
  const locations = ['Jakarta, ID', 'Jakarta, ID', 'Jakarta, ID', 'Jakarta, ID', 'Surabaya, ID', 'Jakarta, ID'];
  return Array.from({ length: 6 }, (_, i) => ({
    id: i.toString(),
    action: actions[i],
    success: !actions[i].includes('gagal'),
    location: locations[i],
    ip: `103.${Math.floor(Math.random() * 255)}.xx.xx`,
    date: new Date(Date.now() - i * 18 * 3600000).toISOString(),
    device: i % 2 === 0 ? 'Chrome / Windows' : 'Safari / iPhone',
  }));
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TwoFASetup({ secret, onDone, onCancel }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const otpauthUrl = `otpauth://totp/CoinVault?secret=${secret}&issuer=CoinVault`;

  const copySecret = () => {
    navigator.clipboard.writeText(secret).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Masukkan 6 digit kode dari aplikasi autentikator');
      return;
    }
    // Simulate verify (accept any 6 digit code for demo)
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-blue-300 text-xs">Gunakan aplikasi seperti Google Authenticator, Authy, atau 1Password untuk scan QR atau masukkan kunci rahasia di bawah ini.</p>
      </div>

      {/* Manual key */}
      <div className="bg-slate-800 rounded-xl p-4 space-y-2">
        <p className="text-slate-400 text-xs font-semibold">KUNCI RAHASIA (manual entry)</p>
        <div className="flex items-center gap-2">
          <code className="text-orange-400 font-mono text-xs break-all flex-1 bg-slate-900 px-2 py-1.5 rounded-lg">{secret}</code>
          <button onClick={copySecret} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors shrink-0">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-slate-600 text-[10px]">Pilih "Enter key manually" di aplikasi autentikator Anda dan paste kunci di atas.</p>
      </div>

      {/* Code input */}
      <div className="space-y-2">
        <label className="text-slate-300 text-sm font-medium">Kode Verifikasi</label>
        <Input
          type="text"
          maxLength={6}
          inputMode="numeric"
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
          placeholder="Masukkan 6 digit kode"
          className="bg-slate-800 border-slate-700 text-white text-center text-xl tracking-[0.3em] font-mono"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Batal</Button>
        <Button onClick={handleVerify} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Aktifkan 2FA</Button>
      </div>
    </div>
  );
}

export default function SecuritySection() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => localStorage.getItem(STORAGE_KEY_2FA) === 'true');
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState(() => localStorage.getItem(STORAGE_KEY_SECRET) || '');
  const [devices] = useState(generateMockDevices);
  const [loginHistory] = useState(generateLoginHistory);
  const [disableConfirm, setDisableConfirm] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  const startSetup = () => {
    const s = generateSecret();
    setSecret(s);
    localStorage.setItem(STORAGE_KEY_SECRET, s);
    setSetupMode(true);
  };

  const handleEnabled = () => {
    localStorage.setItem(STORAGE_KEY_2FA, 'true');
    setIs2FAEnabled(true);
    setSetupMode(false);
  };

  const handleDisable = () => {
    if (!/^\d{6}$/.test(disableCode)) { setDisableError('Masukkan 6 digit kode dari autentikator'); return; }
    localStorage.setItem(STORAGE_KEY_2FA, 'false');
    setIs2FAEnabled(false);
    setDisableConfirm(false);
    setDisableCode('');
    setDisableError('');
  };

  return (
    <div className="space-y-6">

      {/* 2FA Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${is2FAEnabled ? 'bg-green-500/20' : 'bg-slate-700'}`}>
              {is2FAEnabled ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <ShieldOff className="w-5 h-5 text-slate-400" />}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Autentikasi Dua Faktor (2FA)</p>
              <p className={`text-xs font-semibold ${is2FAEnabled ? 'text-green-400' : 'text-slate-500'}`}>
                {is2FAEnabled ? '✓ Aktif · TOTP' : 'Belum aktif'}
              </p>
            </div>
          </div>
          {!setupMode && !disableConfirm && (
            is2FAEnabled
              ? <Button size="sm" variant="outline" onClick={() => setDisableConfirm(true)} className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs">Nonaktifkan</Button>
              : <Button size="sm" onClick={startSetup} className="bg-green-600 hover:bg-green-700 text-white text-xs">Aktifkan</Button>
          )}
        </div>

        {!is2FAEnabled && !setupMode && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-xs">2FA meningkatkan keamanan akun Anda secara signifikan. Aktifkan sekarang untuk melindungi wallet dan transaksi.</p>
          </div>
        )}

        {setupMode && (
          <TwoFASetup secret={secret} onDone={handleEnabled} onCancel={() => setSetupMode(false)} />
        )}

        {disableConfirm && (
          <div className="space-y-3 border-t border-slate-700/50 pt-4">
            <p className="text-slate-300 text-sm">Masukkan kode dari aplikasi autentikator untuk menonaktifkan 2FA:</p>
            <Input
              type="text"
              maxLength={6}
              inputMode="numeric"
              value={disableCode}
              onChange={e => { setDisableCode(e.target.value.replace(/\D/g, '')); setDisableError(''); }}
              placeholder="6 digit kode"
              className="bg-slate-900 border-slate-700 text-white text-center font-mono text-lg tracking-widest"
            />
            {disableError && <p className="text-red-400 text-xs">{disableError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setDisableConfirm(false); setDisableCode(''); }} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs">Batal</Button>
              <Button onClick={handleDisable} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs">Nonaktifkan</Button>
            </div>
          </div>
        )}
      </div>

      {/* Connected Devices */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span className="text-white font-semibold text-sm">Perangkat Terhubung</span>
          <span className="ml-auto text-[10px] text-slate-500">{devices.length} perangkat</span>
        </div>
        {devices.map(device => {
          const Icon = getDeviceIcon(device.type);
          return (
            <div key={device.id} className={`flex items-start gap-3 p-3 rounded-xl border ${device.current ? 'bg-blue-500/10 border-blue-500/20' : 'bg-slate-900/40 border-slate-700/30'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${device.current ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
                <Icon className={`w-4 h-4 ${device.current ? 'text-blue-400' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold">{device.name}</span>
                  {device.current && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">Ini</span>}
                  {device.trusted && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">Dipercaya</span>}
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">{device.browser} · {device.os}</p>
                <p className="text-slate-600 text-[10px]">{device.location} · {device.ip}</p>
                <p className="text-slate-600 text-[10px]">Login terakhir: {formatDate(device.lastLogin)}</p>
              </div>
              {!device.current && (
                <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Login History */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-white font-semibold text-sm">Riwayat Login</span>
          <span className="ml-auto text-[10px] text-slate-500">6 aktivitas terakhir</span>
        </div>
        {loginHistory.map(log => (
          <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-700/30 last:border-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${log.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {log.success ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${log.success ? 'text-white' : 'text-red-400'}`}>{log.action}</p>
              <p className="text-slate-500 text-[10px]">{log.device} · {log.location} · {log.ip}</p>
            </div>
            <span className="text-slate-600 text-[10px] shrink-0">{formatDate(log.date)}</span>
          </div>
        ))}
      </div>

    </div>
  );
}