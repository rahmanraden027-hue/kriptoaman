import React, { useEffect, useState } from 'react';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { Shield, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';

export function TOTPSetup({ onDone, onCancel }) {
  const [step, setStep] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [setupNonce, setSetupNonce] = useState(0);

  useEffect(() => {
    if (step !== 'generate') return;
    setLoading(true);
    setError('');
    kriptoAuth.setup2FA()
      .then((data) => {
        setSecret(data.secret || '');
        setBackupCodes(data.backupCodes || []);
      })
      .catch((err) => setError(err.message || 'Gagal memulai setup 2FA'))
      .finally(() => setLoading(false));
  }, [step, setupNonce]);

  const handleVerifyTOTP = async () => {
    if (totpCode.length !== 6) return setError('Kode harus 6 digit');
    setLoading(true);
    setError('');
    try {
      await kriptoAuth.verify2FASetup(totpCode);
      setStep('backup');
    } catch (err) {
      setError(err.message || 'Kode TOTP salah. Pastikan waktu ponsel otomatis lalu coba kode terbaru.');
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  };

  const regenerate = () => {
    setSecret('');
    setTotpCode('');
    setError('');
    setSetupNonce((value) => value + 1);
  };

  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-sm overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="min-h-full flex items-start sm:items-center justify-center py-3">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
          {step === 'generate' && (
            <>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h2 className="text-white font-bold">Aktifkan 2FA</h2>
              </div>
              {loading && !secret ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
              ) : (
                <>
                  <p className="text-slate-400 text-sm">Di Google Authenticator, pilih tambah akun lalu masukkan kunci penyiapan berikut secara manual.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300 text-xs font-mono break-all">{secret}</code>
                    <button type="button" onClick={() => navigator.clipboard.writeText(secret)} className="p-2 hover:bg-slate-700 rounded" aria-label="Salin kunci 2FA"><Copy className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <p className="text-slate-500 text-xs">Jenis: berbasis waktu (TOTP), 6 digit, periode 30 detik.</p>

                  <div className="border-t border-slate-700 pt-4 space-y-3">
                    <p className="text-white text-sm font-semibold">Sudah ditautkan? Masukkan kode 6 digit yang sedang tampil.</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength="6"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => { if (e.key === 'Enter' && totpCode.length === 6 && !loading) handleVerifyTOTP(); }}
                      placeholder="000000"
                      className="w-full text-center text-2xl font-bold bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white tracking-widest focus:border-blue-500 outline-none"
                    />
                    <p className="text-slate-500 text-[11px]">Jika kode ditolak, aktifkan Tanggal & waktu otomatis di Android dan gunakan kode terbaru sebelum periode 30 detik berakhir.</p>
                  </div>

                  {error && <div className="flex gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-red-400 text-sm">{error}</p></div>}
                  <button type="button" onClick={handleVerifyTOTP} disabled={!secret || totpCode.length !== 6 || loading} className="w-full bg-blue-600 disabled:bg-slate-700 text-white font-semibold py-2.5 rounded-lg">{loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verifikasi & Aktifkan'}</button>
                  <button type="button" onClick={regenerate} disabled={loading} className="w-full text-blue-300 text-sm py-1 disabled:opacity-50">Buat ulang kunci</button>
                  <button type="button" onClick={onCancel} className="w-full text-slate-400 text-sm py-1">Batal</button>
                </>
              )}
            </>
          )}

          {step === 'backup' && (
            <>
              <h2 className="text-white font-bold">Simpan kode pemulihan</h2>
              <p className="text-slate-400 text-sm">Simpan kode ini secara offline. Kode tidak ditampilkan kembali setelah setup selesai.</p>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-1">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <code className="text-slate-300 font-mono text-sm">{code}</code>
                    <button type="button" onClick={() => copyCode(code, idx)}>{copiedIdx === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-500" />}</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={onDone} className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg">Selesai — 2FA Aktif</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
