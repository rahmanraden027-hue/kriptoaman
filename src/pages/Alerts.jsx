import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { appStorage } from '../lib/appStorage';

const STORAGE_KEY = 'ka_price_alerts';

function loadAlerts() {
  try { return JSON.parse(appStorage.get(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveAlerts(alerts) {
  appStorage.set(STORAGE_KEY, JSON.stringify(alerts));
}

const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'LINK'];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ coin: 'BTC', condition: 'above', price: '' });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState('');

  useEffect(() => {
    setAlerts(loadAlerts());
    setPushEnabled(Notification.permission === 'granted');
  }, []);

  const requestPush = async () => {
    if (!('Notification' in window)) {
      setPushStatus('Browser Anda tidak mendukung notifikasi.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setPushEnabled(true);
      setPushStatus('✓ Notifikasi push diaktifkan!');
      new Notification('KriptoAman', { body: 'Notifikasi harga aktif! Kami akan memberitahu Anda.' });
    } else {
      setPushStatus('Izin notifikasi ditolak.');
    }
    setTimeout(() => setPushStatus(''), 3000);
  };

  const addAlert = () => {
    if (!form.price) return;
    const newAlert = { id: Date.now(), ...form, price: parseFloat(form.price), active: true, createdAt: new Date().toISOString() };
    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    saveAlerts(updated);
    setForm({ coin: 'BTC', condition: 'above', price: '' });
    setShowAdd(false);
  };

  const toggleAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAlerts(updated); saveAlerts(updated);
  };

  const deleteAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated); saveAlerts(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Alerts Harga</h1>
            <p className="text-slate-500 text-xs">Notifikasi ketika harga mencapai target</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {/* Push notification toggle */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${pushEnabled ? 'bg-green-500/10 border-green-500/25' : 'bg-slate-800/50 border-slate-700/40'}`}>
          <div className="flex items-center gap-3">
            {pushEnabled ? <Bell className="w-5 h-5 text-green-400" /> : <BellOff className="w-5 h-5 text-slate-400" />}
            <div>
              <p className="text-white text-sm font-semibold">Push Notification</p>
              <p className="text-slate-400 text-xs">{pushEnabled ? 'Aktif — notifikasi browser diizinkan' : 'Nonaktif — klik untuk mengaktifkan'}</p>
            </div>
          </div>
          {!pushEnabled && (
            <button onClick={requestPush} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-semibold">
              Aktifkan
            </button>
          )}
          {pushEnabled && <CheckCircle2 className="w-5 h-5 text-green-400" />}
        </div>
        {pushStatus && <p className="text-xs text-center text-indigo-300">{pushStatus}</p>}

        {/* Add form */}
        {showAdd && (
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-5 space-y-3">
            <p className="text-white font-semibold">Buat Alert Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Koin</label>
                <select value={form.coin} onChange={e => setForm(f => ({ ...f, coin: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {COINS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Kondisi</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="above">Di atas ($)</option>
                  <option value="below">Di bawah ($)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Target Harga (USD)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Contoh: 50000"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={addAlert}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-sm font-semibold transition-colors">
                Simpan Alert
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 text-sm transition-colors">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Alert list */}
        {alerts.length === 0 && !showAdd && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada alert. Tambah alert harga pertama Anda!</p>
          </div>
        )}

        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${a.active ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-900/30 border-slate-800/30 opacity-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.condition === 'above' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {a.condition === 'above' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{a.coin} {a.condition === 'above' ? '↑' : '↓'} ${a.price.toLocaleString()}</p>
                  <p className="text-slate-500 text-[11px]">{a.active ? 'Aktif' : 'Nonaktif'} · {new Date(a.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAlert(a.id)} className="p-2 rounded-lg hover:bg-slate-700 transition-colors">
                  {a.active ? <Bell className="w-4 h-4 text-indigo-400" /> : <BellOff className="w-4 h-4 text-slate-500" />}
                </button>
                <button onClick={() => deleteAlert(a.id)} className="p-2 rounded-lg hover:bg-red-500/15 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
          <p className="text-yellow-300 text-xs"><AlertTriangle className="w-3.5 h-3.5 inline mr-1" />Alert hanya bersifat informatif. Pastikan notifikasi browser diaktifkan untuk mendapatkan peringatan real-time.</p>
        </div>

      </div>
    </div>
  );
}