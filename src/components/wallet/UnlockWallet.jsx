import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyPassword, clearWallet } from './walletUtils';
import { Lock, Eye, EyeOff, Trash2, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function UnlockWallet({ wallet, onUnlocked, onReset }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const handleUnlock = () => {
    if (!verifyPassword(password, wallet.passwordHash)) {
      setError('Password salah. Coba lagi.');
      return;
    }
    setError('');
    onUnlocked(password);
  };

  const handleReset = () => {
    clearWallet();
    onReset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 mb-4">
            <Lock className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">CoinVault</h1>
          <p className="text-slate-400 text-sm mt-1 font-mono truncate px-4">{wallet.address}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="bg-slate-800 border-slate-700 text-white pr-10"
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                autoFocus
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={handleUnlock} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Buka Wallet
          </Button>

          <div className="border-t border-slate-700 pt-3">
            {!showConfirmReset ? (
              <button onClick={() => setShowConfirmReset(true)} className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-sm transition-colors mx-auto">
                <Trash2 className="w-3.5 h-3.5" />
                Reset Wallet
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400 text-xs text-center">Yakin ingin menghapus wallet? Data tidak bisa dipulihkan tanpa seed phrase.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowConfirmReset(false)} className="flex-1 border-slate-700 text-slate-400">
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleReset} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Hapus
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}