import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Loader2, Check } from 'lucide-react';

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

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Load existing balances from user data
      const existingBalances = u?.balances || COIN_DEFAULTS;
      setBalances(existingBalances);
      setLoading(false);
    });
  }, []);

  const handleChange = (coin, value) => {
    setBalances(prev => ({
      ...prev,
      [coin]: parseFloat(value) || 0,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ balances });
      setUser(u => ({ ...u, balances }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving balances:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Edit Saldo Anda</h3>
        <p className="text-sm text-slate-400">{user?.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.keys(COIN_DEFAULTS).map(coin => (
          <div key={coin}>
            <label className="block text-sm font-semibold text-slate-300 mb-2">{coin}</label>
            <input
              type="number"
              step="0.001"
              value={balances[coin]}
              onChange={e => handleChange(coin, e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <button
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
          {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan'}
        </button>
      </div>

      <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-3 text-xs text-slate-400">
        <p>💡 Saldo disimpan ke akun Anda dan dapat diakses dari mana saja.</p>
      </div>
    </div>
  );
}