import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { Save, Loader2, Check, ShieldCheck, AlertCircle } from 'lucide-react';

const COIN_DEFAULTS = {
  BTC: 0,
  ETH: 0,
  SOL: 0,
  USDT: 0,
};

export default function AdminBalanceEditor() {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState(COIN_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then(async (u) => {
        if (!active) return;
        setUser(u);
        if (u?.role !== 'admin') return;
        const data = await kriptoAuth.getAdminBalance();
        if (!active) return;
        setBalances({ ...COIN_DEFAULTS, ...(data?.balances || {}) });
      })
      .catch(() => {
        if (active) setError('Saldo admin belum dapat dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleChange = (coin, value) => {
    const next = value === '' ? '' : Number(value);
    setBalances(prev => ({ ...prev, [coin]: next }));
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const normalized = Object.fromEntries(
        Object.entries(balances).map(([coin, value]) => [coin, Number(value || 0)]),
      );
      const data = await kriptoAuth.updateAdminBalance(normalized);
      setBalances({ ...COIN_DEFAULTS, ...(data?.balances || normalized) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.status === 403
        ? 'Akses ditolak. Hanya admin yang dapat mengubah saldo.'
        : 'Saldo belum dapat disimpan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa akses admin…
      </div>
    );
  }

  // Defense in depth: Settings already hides the Saldo tab for non-admins,
  // and the server endpoint independently rejects every non-admin request.
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Kontrol Saldo Admin</h3>
        </div>
        <p className="text-sm text-slate-400">{user.email}</p>
        <p className="text-xs text-slate-500 mt-1">Hanya akun dengan peran admin terverifikasi yang dapat mengubah nilai pada layar ini.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.keys(COIN_DEFAULTS).map(coin => (
          <div key={coin}>
            <label className="block text-sm font-semibold text-slate-300 mb-2">{coin}</label>
            <input
              type="number"
              min="0"
              max="1000000000000000"
              step="0.001"
              value={balances[coin]}
              onChange={e => handleChange(coin, e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="0"
              inputMode="decimal"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Saldo'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-3 text-xs text-slate-400">
        Nilai saldo ini disimpan melalui endpoint server khusus admin. Pengguna biasa tidak memiliki menu maupun izin API untuk mengubahnya.
      </div>
    </div>
  );
}
