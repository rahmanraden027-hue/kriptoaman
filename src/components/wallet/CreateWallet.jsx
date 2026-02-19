import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateWallet, encryptData, hashPassword, saveWallet } from './walletUtils';
import { Shield, Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react';

export default function CreateWallet({ onWalletCreated }) {
  const [step, setStep] = useState(1); // 1: set password, 2: backup mnemonic, 3: verify
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCreatePassword = async () => {
    if (password.length < 8) { setError('Password minimal 8 karakter'); return; }
    if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
    setError('');
    setLoading(true);
    const w = await generateWallet();
    setWallet(w);
    setLoading(false);
    setStep(2);
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(wallet.mnemonic);
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2000);
  };

  const handleFinish = () => {
    const encryptedPrivateKey = encryptData(wallet.privateKey, password);
    const encryptedMnemonic = encryptData(wallet.mnemonic, password);
    const walletData = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      encryptedPrivateKey,
      encryptedMnemonic,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    saveWallet(walletData);
    onWalletCreated(walletData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 mb-4">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bitcoin Wallet</h1>
          <p className="text-slate-400 text-sm mt-1">Buat dompet Bitcoin baru Anda</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Buat Password</h2>
            <p className="text-slate-400 text-sm">Password ini digunakan untuk mengenkripsi private key Anda di browser.</p>
            <div className="space-y-2">
              <Label className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Konfirmasi Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="bg-slate-800 border-slate-700 text-white"
                onKeyDown={e => e.key === 'Enter' && handleCreatePassword()}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button onClick={handleCreatePassword} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? 'Membuat wallet...' : 'Lanjut'}
            </Button>
          </div>
        )}

        {step === 2 && wallet && (
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Backup Seed Phrase</h2>
            <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <p className="text-orange-300 text-sm">Simpan 12 kata ini di tempat yang aman. Ini adalah satu-satunya cara memulihkan wallet Anda jika browser di-reset.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {wallet.mnemonic.split(' ').map((word, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2 py-1.5">
                  <span className="text-slate-500 text-xs w-4">{i + 1}.</span>
                  <span className="text-white text-sm font-mono">{word}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={handleCopyMnemonic} className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
              {copiedMnemonic ? <><Check className="w-4 h-4 mr-2 text-green-400" />Tersalin!</> : <><Copy className="w-4 h-4 mr-2" />Salin Seed Phrase</>}
            </Button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="accent-orange-500" />
              <span className="text-slate-300 text-sm">Saya sudah menyimpan seed phrase saya</span>
            </label>
            <Button onClick={() => setStep(3)} disabled={!confirmed} className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50">
              Lanjut
            </Button>
          </div>
        )}

        {step === 3 && wallet && (
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Wallet Siap! 🎉</h2>
            <p className="text-slate-400 text-sm">Wallet Bitcoin Anda berhasil dibuat. Alamat Bitcoin Anda:</p>
            <div className="bg-slate-800 rounded-xl p-3">
              <p className="text-orange-400 font-mono text-sm break-all">{wallet.address}</p>
            </div>
            <Button onClick={handleFinish} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              Buka Wallet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}