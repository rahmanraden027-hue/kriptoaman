import React, { useState, useEffect } from 'react';
import { Shield, Delete, Fingerprint } from 'lucide-react';

export const PIN_STORAGE_KEY   = 'cv_app_pin_hash';
export const PIN_SALT_KEY      = 'cv_app_pin_salt';
export const PIN_ENABLED_KEY   = 'cv_pin_enabled';
export const BIOMETRIC_ENABLED_KEY = 'cv_biometric_enabled';

const MAX_ATTEMPTS      = 5;
const LOCKOUT_BASE_MS   = 30000;   // 30s pertama, lalu exponential
const PIN_LENGTH        = 6;

// ── SHA-256 + salt menggunakan Web Crypto API (async, aman) ──────────────────
async function hashPin(pin, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + pin + 'kriptoaman_v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Anti-Pattern: deteksi PIN berurutan / mudah ditebak ────────────────────
function isPinWeak(pin) {
  if (/^(\d)\1{5}$/.test(pin)) return true;           // 111111, 222222
  if (/^(012345|123456|234567|345678|456789|987654|876543|654321)$/.test(pin)) return true;
  return false;
}

// ── Dots visual ─────────────────────────────────────────────────────────────
function PinDots({ value }) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
          i < value.length ? 'bg-blue-500 border-blue-500 scale-110' : 'bg-transparent border-slate-600'
        }`} />
      ))}
    </div>
  );
}

// ── Numpad ───────────────────────────────────────────────────────────────────
function NumPad({ onPress, onDelete, onBiometric, biometricEnabled }) {
  const keys = ['1','2','3','4','5','6','7','8','9','bio','0','del'];
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
      {keys.map((key, idx) => {
        if (key === 'bio') return biometricEnabled ? (
          <button key={idx} onClick={onBiometric}
            className="h-16 rounded-2xl flex items-center justify-center text-blue-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95">
            <Fingerprint className="w-7 h-7" />
          </button>
        ) : <div key={idx} />;
        if (key === 'del') return (
          <button key={idx} onClick={onDelete}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95">
            <Delete className="w-6 h-6" />
          </button>
        );
        return (
          <button key={idx} onClick={() => onPress(key)}
            className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/40 text-white text-2xl font-semibold transition-all active:scale-95 shadow-sm">
            {key}
          </button>
        );
      })}
    </div>
  );
}

// ── Setup PIN ────────────────────────────────────────────────────────────────
export function PinSetup({ onDone, onCancel }) {
  const [step, setStep] = useState('set');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const current = step === 'set' ? pin : confirm;

  const handlePress = (digit) => {
    if (current.length >= PIN_LENGTH) return;
    if (step === 'set') setPin(p => p + digit);
    else setConfirm(p => p + digit);
  };

  const handleDelete = () => {
    if (step === 'set') setPin(p => p.slice(0, -1));
    else setConfirm(p => p.slice(0, -1));
  };

  useEffect(() => {
    if (step === 'set' && pin.length === PIN_LENGTH) {
      if (isPinWeak(pin)) {
        setError('PIN terlalu mudah ditebak. Coba kombinasi lain.');
        setTimeout(() => { setPin(''); setError(''); }, 1000);
        return;
      }
      setTimeout(() => { setStep('confirm'); }, 200);
    }
  }, [pin, step]);

  useEffect(() => {
    if (step === 'confirm' && confirm.length === PIN_LENGTH) {
      if (confirm !== pin) {
        setError('PIN tidak cocok. Coba lagi.');
        setTimeout(() => { setConfirm(''); setError(''); }, 800);
        return;
      }
      setSaving(true);
      const salt = generateSalt();
      hashPin(pin, salt).then(hash => {
        localStorage.setItem(PIN_STORAGE_KEY, hash);
        localStorage.setItem(PIN_SALT_KEY, salt);
        localStorage.setItem(PIN_ENABLED_KEY, 'true');
        localStorage.setItem('cv_pin_created_at', Date.now().toString());
        setSaving(false);
        onDone();
      });
    }
  }, [confirm, step]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
        <Shield className="w-7 h-7 text-blue-400" />
      </div>
      <h2 className="text-white font-bold text-xl mb-1">
        {step === 'set' ? 'Buat PIN Keamanan' : 'Konfirmasi PIN'}
      </h2>
      <p className="text-slate-400 text-sm mb-2">
        {step === 'set' ? 'Masukkan 6 digit PIN baru Anda' : 'Masukkan PIN sekali lagi untuk konfirmasi'}
      </p>
      <p className="text-slate-600 text-xs mb-1">🔒 Hash SHA-256 + salt — tersimpan lokal</p>
      <PinDots value={current} />
      {error && <p className="text-red-400 text-sm mb-3 animate-pulse">{error}</p>}
      {saving && <p className="text-blue-400 text-xs mb-3">Mengenkripsi PIN...</p>}
      <NumPad onPress={handlePress} onDelete={handleDelete} biometricEnabled={false} />
      {onCancel && (
        <button onClick={onCancel} className="mt-6 text-slate-500 text-sm hover:text-slate-300 transition-colors">
          Batal
        </button>
      )}
    </div>
  );
}

// ── PIN Unlock ───────────────────────────────────────────────────────────────
export function PinUnlock({ onUnlocked, onForgot }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(() => parseInt(sessionStorage.getItem('cv_pin_attempts') || '0'));
  const [lockedUntil, setLockedUntil] = useState(() => parseInt(sessionStorage.getItem('cv_locked_until') || '0'));
  const [now, setNow] = useState(Date.now());
  const [verifying, setVerifying] = useState(false);
  const biometricEnabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const isLocked = lockedUntil > now;
  const lockSecondsLeft = isLocked ? Math.ceil((lockedUntil - now) / 1000) : 0;

  const handlePress = (digit) => {
    if (isLocked || verifying || pin.length >= PIN_LENGTH) return;
    setPin(p => p + digit);
  };

  const handleDelete = () => { if (!verifying) setPin(p => p.slice(0, -1)); };

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || verifying) return;
    setVerifying(true);

    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    const salt   = localStorage.getItem(PIN_SALT_KEY);

    hashPin(pin, salt || '').then(hash => {
      if (stored && hash === stored) {
        sessionStorage.removeItem('cv_pin_attempts');
        sessionStorage.removeItem('cv_locked_until');
        setError('');
        setVerifying(false);
        setTimeout(() => onUnlocked(), 150);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        sessionStorage.setItem('cv_pin_attempts', newAttempts.toString());

        // Exponential lockout: 30s, 60s, 120s, ...
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockMs = LOCKOUT_BASE_MS * Math.pow(2, newAttempts - MAX_ATTEMPTS);
          const until = Date.now() + lockMs;
          setLockedUntil(until);
          sessionStorage.setItem('cv_locked_until', until.toString());
          setError(`Terkunci ${lockMs / 1000} detik — terlalu banyak percobaan.`);
        } else {
          setError(`PIN salah. ${MAX_ATTEMPTS - newAttempts} percobaan tersisa.`);
        }
        setTimeout(() => { setPin(''); setVerifying(false); }, 500);
      }
    });
  }, [pin]);

  // ── WebAuthn Biometric nyata ─────────────────────────────────────────────
  const handleBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setError('Biometrik tidak didukung di perangkat ini.');
      return;
    }
    try {
      // Cek apakah biometric tersedia di device
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) { setError('Sensor biometrik tidak tersedia.'); return; }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credentialId = localStorage.getItem('cv_webauthn_cred_id');

      if (!credentialId) {
        // Register biometric pertama kali
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'KriptoAman', id: window.location.hostname },
            user: { id: new Uint8Array(16), name: 'user', displayName: 'KriptoAman User' },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
            timeout: 60000,
          }
        });
        if (credential) {
          localStorage.setItem('cv_webauthn_cred_id', btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
          localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
          onUnlocked();
        }
      } else {
        // Authenticate dengan biometric yang sudah terdaftar
        const rawId = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{ id: rawId, type: 'public-key', transports: ['internal'] }],
            userVerification: 'required',
            timeout: 60000,
          }
        });
        if (assertion) onUnlocked();
      }
    } catch (err) {
      if (err.name !== 'NotAllowedError') setError('Biometrik gagal. Gunakan PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-5">
        <Shield className="w-8 h-8 text-blue-400" />
      </div>
      <h2 className="text-white font-bold text-xl mb-1">KriptoAman Terkunci</h2>
      <p className="text-slate-400 text-sm mb-1">Masukkan PIN untuk membuka</p>
      <p className="text-slate-600 text-[10px]">🔐 SHA-256 encrypted</p>

      <PinDots value={pin} />

      {isLocked ? (
        <div className="text-red-400 text-sm font-semibold my-4">
          🔒 Terkunci — tunggu {lockSecondsLeft} detik
        </div>
      ) : verifying ? (
        <p className="text-blue-400 text-xs my-2">Memverifikasi...</p>
      ) : (
        error && <p className="text-red-400 text-xs mb-3">{error}</p>
      )}

      <NumPad onPress={handlePress} onDelete={handleDelete} onBiometric={handleBiometric} biometricEnabled={biometricEnabled} />

      {onForgot && (
        <button onClick={onForgot} className="mt-6 text-slate-500 text-xs hover:text-slate-300 transition-colors">
          Lupa PIN? Reset & logout
        </button>
      )}
    </div>
  );
}

// ── Session Lock Hook ────────────────────────────────────────────────────────
const LAST_ACTIVE_KEY = 'cv_last_active';

export function useAppLock(timeoutMs = 5 * 60 * 1000) {
  const [locked, setLocked] = useState(false);
  const pinEnabled = localStorage.getItem(PIN_ENABLED_KEY) === 'true';

  useEffect(() => {
    if (!pinEnabled) return;
    const bump = () => localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    const check = () => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
      if (Date.now() - last > timeoutMs) setLocked(true);
    };
    bump();
    check();
    const interval = setInterval(check, 10000);
    window.addEventListener('click', bump);
    window.addEventListener('keydown', bump);
    window.addEventListener('touchstart', bump);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('touchstart', bump);
    };
  }, [pinEnabled, timeoutMs]);

  const unlock = () => {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    setLocked(false);
  };

  return { locked: pinEnabled && locked, unlock, pinEnabled };
}