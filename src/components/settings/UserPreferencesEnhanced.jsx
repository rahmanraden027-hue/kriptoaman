import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Volume2, Eye, Lock, DollarSign, AlertCircle } from 'lucide-react';

const NOTIFICATION_CATEGORIES = [
  { id: 'transactions', label: 'Transaksi', icon: DollarSign, description: 'Notifikasi untuk deposit, tarik, transfer' },
  { id: 'security', label: 'Keamanan', icon: Lock, description: 'Alert login, perubahan password' },
  { id: 'alerts', label: 'Alert Pasar', icon: AlertCircle, description: 'Notifikasi harga & peluang trading' },
  { id: 'social', label: 'Sosial', icon: Eye, description: 'Mention, reply, dan update komunitas' },
];

const THEME_OPTIONS = [
  { id: 'dark', label: 'Gelap', icon: Moon },
  { id: 'light', label: 'Terang', icon: Sun },
];

export default function UserPreferencesEnhanced({ user, onSave, saving }) {
  const [prefs, setPrefs] = useState({
    theme: 'dark',
    notifications: {
      transactions: true,
      security: true,
      alerts: false,
      social: true,
    },
    soundEnabled: true,
    emailDigest: 'daily',
    showBalancePublicly: false,
    dataCollection: false,
  });

  const [changes, setChanges] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('user_preferences');
    if (stored) {
      try {
        setPrefs(JSON.parse(stored));
      } catch (e) {
        // Keep defaults
      }
    }
  }, []);

  const handleToggleNotification = (category) => {
    setPrefs(p => ({
      ...p,
      notifications: {
        ...p.notifications,
        [category]: !p.notifications[category],
      },
    }));
    setChanges(true);
  };

  const handleThemeChange = (theme) => {
    setPrefs(p => ({ ...p, theme }));
    setChanges(true);
  };

  const handleToggleSetting = (key) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
    setChanges(true);
  };

  const handleSelectChange = (key, value) => {
    setPrefs(p => ({ ...p, [key]: value }));
    setChanges(true);
  };

  const handleSave = async () => {
    localStorage.setItem('user_preferences', JSON.stringify(prefs));
    if (onSave) {
      await onSave({ preferences: prefs });
    }
    setChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <Sun className="w-4 h-4 text-yellow-400" />
          Tema Visual
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {THEME_OPTIONS.map(theme => {
            const Icon = theme.icon;
            const isSelected = prefs.theme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          Notifikasi
        </h3>
        <div className="space-y-3">
          {NOTIFICATION_CATEGORIES.map(category => {
            const Icon = category.icon;
            const isEnabled = prefs.notifications[category.id];
            return (
              <div
                key={category.id}
                className="flex items-start justify-between p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">{category.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{category.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleNotification(category.id)}
                  className={`w-10 h-6 rounded-full transition-all flex items-center ${
                    isEnabled ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sound & Email */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-white text-sm font-semibold">Suara Notifikasi</p>
              <p className="text-slate-500 text-xs mt-0.5">Mainkan suara untuk notifikasi penting</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('soundEnabled')}
            className={`w-10 h-6 rounded-full transition-all flex items-center ${
              prefs.soundEnabled ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                prefs.soundEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-slate-600/50 pt-3">
          <p className="text-slate-400 text-xs font-semibold mb-2.5">Email Digest</p>
          <select
            value={prefs.emailDigest}
            onChange={(e) => handleSelectChange('emailDigest', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="never">Tidak pernah</option>
          </select>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-white text-sm font-semibold">Tampilkan Saldo Secara Publik</p>
              <p className="text-slate-500 text-xs mt-0.5">Izinkan pengguna lain melihat saldo Anda</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('showBalancePublicly')}
            className={`w-10 h-6 rounded-full transition-all flex items-center ${
              prefs.showBalancePublicly ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                prefs.showBalancePublicly ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-white text-sm font-semibold">Pengumpulan Data Analitik</p>
              <p className="text-slate-500 text-xs mt-0.5">Bantu kami improve dengan data penggunaan</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('dataCollection')}
            className={`w-10 h-6 rounded-full transition-all flex items-center ${
              prefs.dataCollection ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                prefs.dataCollection ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      {changes && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Preferensi'
          )}
        </button>
      )}
    </div>
  );
}