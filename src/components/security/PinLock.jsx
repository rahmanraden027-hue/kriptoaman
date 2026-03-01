import React, { useState, useEffect, useRef } from 'react';
import { Shield, Delete, Fingerprint, Eye, EyeOff } from 'lucide-react';

const PIN_STORAGE_KEY = 'cv_app_pin_hash';
const PIN_ENABLED_KEY = 'cv_pin_enabled';
const BIOMETRIC_ENABLED_KEY = 'cv_biometric_enabled';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30000; // 30s

function hashPin(pin) {
  // simple hash for demo — in production use bcrypt/argon2
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash * 31 + pin.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16) + pin.length;
}

function PinDots({ value, length = 6 }) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {Array.from({ length }).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
          i < value.length
            ? 'bg-blue-500 border-blue-500 scale-110'
            : 'bg-transparent border-slate-600'
        }`} />
      ))}
    </div>
  );
}

function NumPad({ onPress, onDelete, onBiometric, biometricEnabled }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
      {keys.map((key, idx) => {
        if (key === '') return biometricEnabled ? (
          <button key={idx} onClick={onBiometric}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95">
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

// ─── Setup PIN ───────────────────────────────────────────────────────────────
export function PinSetup({ onDone, onCancel }) {
  const [step, setStep] = useState('set'); // set | confirm
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const current = step === 'set' ? pin : confirm;
  const PIN_LENGTH = 6;

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
      setTimeout(() => { setStep('confirm'); }, 200);
    }
    if (step === 'confirm' && confirm.length === PIN_LENGTH) {
      if (confirm === pin) {
        localStorage.setItem(PIN_STORAGE_KEY, hashPin(pin));
        localStorage.setItem(PIN_ENABLED_KEY, 'true');
        setTimeout(() => onDone(), 150);
      } else {
        setError('PIN tidak cocok. Coba lagi.');
        setTimeout(() => { setConfirm(''); setError(''); }, 800);
      }
    }
  }, [pin, confirm, step]);

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
      <PinDots value={current} />
      {error && <p className="text-red-400 text-sm mb-3 animate-pulse">{error}</p>}
      <NumPad onPress={handlePress} onDelete={handleDelete} biometricEnabled={false} />
      {onCancel && (
        <button onClick={onCancel} className="mt-6 text-slate-500 text-sm hover:text-slate-300 transition-colors">
          Batal
        </button>
      )}
    </div>
  );
}

// ─── PIN Unlock Screen ────────────────────────────────────────────────────────
export function PinUnlock({ onUnlocked, onForgot }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [now, setNow] = useState(Date.now());
  const biometricEnabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
  const PIN_LENGTH = 6;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLocked = lockedUntil && now < lockedUntil;
  const lockSecondsLeft = isLocked ? Math.ceil((lockedUntil - now) / 1000) : 0;

  const handlePress = (digit) => {
    if (isLocked || pin.length >= PIN_LENGTH) return;
    setPin(p => p + digit);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored && hashPin(pin) === stored) {
      setError('');
      setTimeout(() => onUnlocked(), 150);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION);
        setError(`Terlalu banyak percobaan. Tunggu ${LOCKOUT_DURATION / 1000} detik.`);
      } else {
        setError(`PIN salah. ${MAX_ATTEMPTS - newAttempts} percobaan tersisa.`);
      }
      setTimeout(() => { setPin(''); setError(e => newAttempts >= MAX_ATTEMPTS ? e : ''); }, 500);
    }
  }, [pin]);

  const handleBiometric = async () => {
    if (!window.PublicKeyCredential) { setError('Biometrik tidak didukung di browser ini.'); return; }
    // Simulate biometric success
    onUnlocked();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-5">
        <Shield className="w-8 h-8 text-blue-400" />
      </div>
      <h2 className="text-white font-bold text-xl mb-1">CoinVault Terkunci</h2>
      <p className="text-slate-400 text-sm mb-1">Masukkan PIN untuk membuka</p>

      <PinDots value={pin} />

      {isLocked ? (
        <div className="text-red-400 text-sm font-semibold my-4">
          🔒 Terkunci selama {lockSecondsLeft} detik
        </div>
      ) : (
        error && <p className="text-red-400 text-xs mb-3">{error}</p>
      )}

      <NumPad
        onPress={handlePress}
        onDelete={handleDelete}
        onBiometric={handleBiometric}
        biometricEnabled={biometricEnabled}
      />

      {onForgot && (
        <button onClick={onForgot} className="mt-6 text-slate-500 text-xs hover:text-slate-300 transition-colors">
          Lupa PIN? Reset wallet
        </button>
      )}
    </div>
  );
}

// ─── Hook: session timeout + PIN gate ────────────────────────────────────────
const LAST_ACTIVE_KEY = 'cv_last_active';

export function useAppLock(timeoutMs = 5 * 60 * 1000) {
  const [locked, setLocked] = useState(false);
  const pinEnabled = localStorage.getItem(PIN_ENABLED_KEY) === 'true';

  useEffect(() => {
    if (!pinEnabled) return;
    const check = () => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
      if (Date.now() - last > timeoutMs) setLocked(true);
    };
    const bump = () => localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    bump();
    check();
    const interval = setInterval(check, 15000);
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

export { PIN_ENABLED_KEY, BIOMETRIC_ENABLED_KEY, PIN_STORAGE_KEY };