import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';

export function TOTPSetup({ onDone, onCancel }) {
  const [step, setStep] = useState('generate'); // generate | verify | backup
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Step 1: Generate TOTP secret
  useEffect(() => {
    if (step !== 'generate') return;
    setLoading(true);
    base44.functions.invoke('setupTOTP', {}).then(res => {
      setSecret(res.data.secret);
      setQrCodeUrl(res.data.qrCodeUrl);
      setBackupCodes(res.data.backupCodes);
      setLoading(false);
    }).catch(err => {
      setError('Gagal generate TOTP: ' + err.message);
      setLoading(false);
    });
  }, [step]);

  // Step 2: Verify TOTP code user input
  const handleVerifyTOTP = async () => {
    if (totpCode.length !== 6) {
      setError('Kode harus 6 digit');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('verifyTOTP', {
        totpCode,
        secret
      });
      setStep('backup');
    } catch (err) {
      setError('Kode TOTP salah, coba lagi');
      setTotpCode('');
      setLoading(false);
    }
  };

  // Copy backup code
  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4">
        
        {/* Step 1: QR Code */}
        {step === 'generate' && (
          <>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-bold">Aktifkan 2FA dengan Google Authenticator</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm">Scan QR code dengan aplikasi authenticator Anda:</p>
                
                {qrCodeUrl && (
                  <div className="flex justify-center bg-white p-4 rounded-xl">
                    <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48" />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-slate-400 text-xs">Atau masukkan key manual:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300 text-xs font-mono break-all">
                      {secret}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(secret); }}
                      className="p-2 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Sudah Scan? Verifikasi Kode
                </button>
              </>
            )}
          </>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <>
            <h2 className="text-white font-bold">Verifikasi 6-Digit Code</h2>
            <p className="text-slate-400 text-sm">Masukkan kode dari aplikasi Authenticator Anda:</p>
            
            <input
              type="text"
              maxLength="6"
              pattern="[0-9]*"
              value={totpCode}
              onChange={(e) => { setTotpCode(e.target.value.replace(/[^0-9]/g, '')); }}
              placeholder="000000"
              className="w-full text-center text-2xl font-bold bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white tracking-widest focus:border-blue-500 outline-none"
            />

            {error && (
              <div className="flex gap-2 items-start bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerifyTOTP}
              disabled={totpCode.length !== 6 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verifikasi'}
            </button>

            <button
              onClick={() => { setStep('generate'); setTotpCode(''); setError(''); }}
              className="w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
            >
              Kembali Scan QR
            </button>
          </>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && (
          <>
            <h2 className="text-white font-bold">💾 Simpan Backup Codes</h2>
            <p className="text-slate-400 text-sm">Gunakan jika Anda kehilangan akses ke Authenticator:</p>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <code className="text-slate-300 font-mono text-sm">{code}</code>
                  <button
                    onClick={() => copyCode(code, idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-400 text-xs">
                ⚠️ Simpan backup codes di tempat aman. Anda tidak bisa melihatnya lagi setelah setup selesai.
              </p>
            </div>

            <button
              onClick={onDone}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              ✅ Selesai Setup 2FA
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function TOTPVerify({ onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      // Verify TOTP dari login screen (secret harus dari session/backend)
      await base44.functions.invoke('verifyTOTPLogin', { totpCode: code });
      onSuccess();
    } catch (err) {
      setError('Kode TOTP salah');
      setCode('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <Shield className="w-12 h-12 text-blue-400 mb-4" />
      <h2 className="text-white font-bold text-xl mb-1">Verifikasi 2FA</h2>
      <p className="text-slate-400 text-sm mb-6">Masukkan 6-digit code dari Google Authenticator</p>

      <input
        type="text"
        maxLength="6"
        pattern="[0-9]*"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="000000"
        className="w-48 text-center text-4xl font-bold bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white tracking-widest focus:border-blue-500 outline-none mb-4"
        autoFocus
      />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        onClick={handleVerify}
        disabled={code.length !== 6 || loading}
        className="w-48 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verifikasi'}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Gunakan Backup Code
        </button>
      )}
    </div>
  );
}