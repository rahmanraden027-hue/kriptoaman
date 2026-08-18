import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Radio, ShieldCheck, Radar } from 'lucide-react';
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
    <div className="ka-bg min-h-screen text-white" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/15 bg-[#071423]/85 p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(56,189,248,.16),transparent_28%),radial-gradient(circle_at_10%_100%,rgba(139,92,246,.12),transparent_30%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sky-300"><Radar className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[0.2em]">KRIPTOAMAN ALERT INTELLIGENCE</span></div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{text.title}</h1>
              <p className="mt-1 text-sm text-slate-400">{text.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold ${connected ? 'text-emerald-300' : 'text-amber-300'}`}><Radio className="h-3 w-3" />{connected ? (language === 'en' ? 'LIVE FEED' : 'FEED LIVE') : (language === 'en' ? 'FALLBACK' : 'CADANGAN')}</span>
              <button onClick={() => setShowAdd(!showAdd)} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-sky-400/25 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"><Plus className="h-4 w-4" />{text.add}</button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="ka-surface p-4 lg:col-span-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${pushEnabled ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-slate-700/40 bg-slate-900/50'}`}>
                  {pushEnabled ? <Bell className="h-5 w-5 text-emerald-300" /> : <BellOff className="h-5 w-5 text-slate-400" />}
                </div>
                <div className="min-w-0"><p className="text-sm font-semibold">Push Notification</p><p className="text-xs leading-relaxed text-slate-400">{pushEnabled ? (language === 'en' ? 'Enabled — browser notifications allowed' : 'Aktif — notifikasi browser diizinkan') : (language === 'en' ? 'Disabled — tap to enable' : 'Nonaktif — klik untuk mengaktifkan')}</p></div>
              </div>
              {!pushEnabled ? <button onClick={requestPush} className="min-h-11 rounded-xl border border-violet-500/25 bg-violet-500/15 px-3 text-xs font-semibold text-violet-200">Aktifkan</button> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            </div>
          </section>
          <section className="ka-surface p-4 lg:col-span-4">
            <div className="flex items-center gap-2 text-cyan-300"><ShieldCheck className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[0.18em]">MONITOR STATUS</span></div>
            <p className="mt-3 text-lg font-extrabold">{connected ? (language === 'en' ? 'Connected' : 'Terhubung') : (language === 'en' ? 'Fallback active' : 'Fallback aktif')}</p>
            <p className="mt-1 text-xs text-slate-500">{text.live}</p>
          </section>
        </div>

        {pushStatus && <p className="text-center text-xs text-indigo-300">{pushStatus}</p>}

        {showAdd && (
          <div className="ka-surface p-5 space-y-3">
            <p className="font-semibold text-white">Buat Alert Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-slate-400">Koin</label><select value={form.coin} onChange={e => setForm(f => ({ ...f, coin: e.target.value }))} className="w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white">{COINS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="mb-1 block text-xs text-slate-400">Kondisi</label><select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white"><option value="above">Di atas ($)</option><option value="below">Di bawah ($)</option></select></div>
            </div>
            <div><label className="mb-1 block text-xs text-slate-400">Target Harga (USD)</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Contoh: 50000" className="w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white" /></div>
            <div className="flex gap-2"><button onClick={addAlert} className="min-h-11 flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">Simpan Alert</button><button onClick={() => setShowAdd(false)} className="min-h-11 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300">Batal</button></div>
          </div>
        )}

        {alerts.length === 0 && !showAdd && (
          <div className="ka-surface px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-sky-500/20 bg-sky-500/10 shadow-[0_0_40px_rgba(56,189,248,.12)]"><Bell className="h-7 w-7 text-sky-300" /></div>
            <p className="font-semibold text-white">{text.empty}</p><p className="mt-1 text-sm text-slate-400">{text.emptyBody}</p>
          </div>
        )}

        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`ka-surface flex items-center justify-between gap-3 p-4 transition ${a.active ? '' : 'opacity-50'}`}>
              <div className="flex min-w-0 items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.condition === 'above' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>{a.condition === 'above' ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{a.coin} {a.condition === 'above' ? '↑' : '↓'} ${a.price.toLocaleString()}</p><p className="truncate text-[11px] text-slate-500">{a.triggeredAt ? text.triggered : a.active ? (language === 'en' ? 'Active' : 'Aktif') : (language === 'en' ? 'Paused' : 'Nonaktif')} · {new Date(a.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID')}</p></div></div>
              <div className="flex shrink-0 items-center gap-1"><button onClick={() => toggleAlert(a.id)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-800">{a.active ? <Bell className="h-4 w-4 text-sky-300" /> : <BellOff className="h-4 w-4 text-slate-500" />}</button><button onClick={() => deleteAlert(a.id)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-red-500/10"><Trash2 className="h-4 w-4 text-red-400" /></button></div>
            </div>
          ))}
        </div>

        <section className="grid gap-3 sm:grid-cols-2" aria-labelledby="alert-guide"><div className="ka-surface p-4"><h2 id="alert-guide" className="text-sm font-bold">{text.guide}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text.local}</p></div><div className="ka-surface p-4"><h2 className="text-sm font-bold">Browser &amp; PWA</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text.permission}</p></div></section>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-3"><p className="text-sm leading-relaxed text-yellow-200"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />{text.info}</p></div>
      </div>
    </div>
  );
}
