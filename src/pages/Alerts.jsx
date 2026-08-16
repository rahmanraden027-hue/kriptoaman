import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { appStorage } from '@/components/utils/appStorage';
import { useLanguage } from '@/lib/LanguageContext';
import useLivePrices from '@/components/market/useLivePrices';

const STORAGE_KEY = 'ka_price_alerts';

function loadAlerts() {
  try { return JSON.parse(appStorage.get(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveAlerts(alerts) {
  appStorage.set(STORAGE_KEY, JSON.stringify(alerts));
}

const COPY = {
  id: { title: 'Peringatan Harga', subtitle: 'Notifikasi saat harga mencapai target', add: 'Tambah',
    empty: 'Belum ada peringatan harga', emptyBody: 'Tekan Tambah untuk membuat peringatan pertama.',
    guide: 'Cara kerja peringatan', local: 'Tersimpan aman di perangkat ini', permission: 'Mengikuti izin notifikasi browser',
    info: 'Bersifat informatif, bukan rekomendasi investasi.', live: 'Pemantauan harga live', triggered: 'Target tercapai', current: 'Harga sekarang' },
  en: { title: 'Price Alerts', subtitle: 'Notifications when prices reach your target', add: 'Add',
    empty: 'No price alerts yet', emptyBody: 'Press Add to create your first alert.',
    guide: 'How alerts work', local: 'Stored securely on this device', permission: 'Uses your browser notification permission',
    info: 'For information only, not investment advice.', live: 'Live price monitoring', triggered: 'Target reached', current: 'Current price' },
};

const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'LINK'];

export default function Alerts() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [alerts, setAlerts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ coin: 'BTC', condition: 'above', price: '' });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const { prices, connected } = useLivePrices();

  useEffect(() => {
    setAlerts(loadAlerts());
    setPushEnabled('Notification' in window && Notification.permission === 'granted');
  }, []);

  useEffect(() => {
    if (!alerts.length || !Object.keys(prices).length) return;
    let changed = false;
    const next = alerts.map((alert) => {
      const current = Number(prices[alert.coin]?.price);
      if (!alert.active || !Number.isFinite(current)) return alert;
      const reached = alert.condition === 'above' ? current >= alert.price : current <= alert.price;
      if (!reached) return alert;

      changed = true;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${alert.coin} · ${text.triggered}`, {
          body: `${text.current}: ${current.toLocaleString('en-US', { maximumFractionDigits: 6 })}`,
          icon: '/icons/kriptoaman-192.png',
          tag: `ka-price-alert-${alert.id}`,
        });
      }
      return { ...alert, active: false, triggeredAt: new Date().toISOString(), triggeredPrice: current };
    });
    if (changed) {
      setAlerts(next);
      saveAlerts(next);
    }
  }, [alerts, prices, text.current, text.triggered]);

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
    <div
      className="min-h-screen bg-gradient-to-b from-[#06101d] via-[#081426] to-[#06101d] text-white"
      style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{text.title}</h1>
            <p className="text-slate-400 text-sm">{text.subtitle}</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex min-h-11 shrink-0 items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> {text.add}
          </button>
        </div>

        {/* Push notification toggle */}
        <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${pushEnabled ? 'bg-green-500/10 border-green-500/25' : 'bg-slate-800/50 border-slate-700/40'}`}>
          <div className="flex min-w-0 items-center gap-3">
            {pushEnabled ? <Bell className="w-5 h-5 shrink-0 text-green-400" /> : <BellOff className="w-5 h-5 shrink-0 text-slate-400" />}
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold">Push Notification</p>
              <p className="text-slate-400 text-xs leading-relaxed">{pushEnabled ? (language === 'en' ? 'Enabled — browser notifications allowed' : 'Aktif — notifikasi browser diizinkan') : (language === 'en' ? 'Disabled — tap to enable' : 'Nonaktif — klik untuk mengaktifkan')}</p>
            </div>
          </div>
          {!pushEnabled && (
            <button onClick={requestPush} className="min-h-11 shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-semibold">
              Aktifkan
            </button>
          )}
          {pushEnabled && <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />}
        </div>
        <div role="status" className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${connected ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-amber-500/20 bg-amber-500/5 text-amber-300'}`}>
          <span>{text.live}</span>
          <span className="font-semibold">{connected ? (language === 'en' ? 'Connected' : 'Terhubung') : (language === 'en' ? 'Fallback active' : 'Fallback aktif')}</span>
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
                className="flex-1 min-h-11 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-sm font-semibold transition-colors">
                Simpan Alert
              </button>
              <button onClick={() => setShowAdd(false)}
                className="min-h-11 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 text-sm transition-colors">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Alert list */}
        {alerts.length === 0 && !showAdd && (
          <div className="rounded-2xl border border-sky-500/15 bg-slate-900/45 px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10">
              <Bell className="w-7 h-7 text-sky-400" />
            </div>
            <p className="text-white font-semibold">{text.empty}</p>
            <p className="mt-1 text-slate-400 text-sm">{text.emptyBody}</p>
          </div>
        )}

        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${a.active ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-900/30 border-slate-800/30 opacity-50'}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${a.condition === 'above' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {a.condition === 'above' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-white text-sm font-semibold">{a.coin} {a.condition === 'above' ? '↑' : '↓'} ${a.price.toLocaleString()}</p>
                  <p className="truncate text-slate-500 text-[11px]">{a.triggeredAt ? text.triggered : a.active ? (language === 'en' ? 'Active' : 'Aktif') : (language === 'en' ? 'Paused' : 'Nonaktif')} · {new Date(a.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID')}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => toggleAlert(a.id)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-700 transition-colors" aria-label={a.active ? (language === 'en' ? 'Pause alert' : 'Jeda peringatan') : (language === 'en' ? 'Enable alert' : 'Aktifkan peringatan')}>
                  {a.active ? <Bell className="w-4 h-4 text-indigo-400" /> : <BellOff className="w-4 h-4 text-slate-500" />}
                </button>
                <button onClick={() => deleteAlert(a.id)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-red-500/15 transition-colors" aria-label={language === 'en' ? 'Delete alert' : 'Hapus peringatan'}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <section className="grid gap-3 sm:grid-cols-2" aria-labelledby="alert-guide">
          <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4">
            <h2 id="alert-guide" className="text-sm font-bold text-white">{text.guide}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{text.local}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
            <h2 className="text-sm font-bold text-white">Browser &amp; PWA</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{text.permission}</p>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
          <p className="text-yellow-200 text-sm leading-relaxed"><AlertTriangle className="w-3.5 h-3.5 inline mr-1" />{text.info}</p>
        </div>

      </div>
    </div>
  );
}