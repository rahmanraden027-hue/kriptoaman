import React, { useMemo, useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Radio, Radar, Target, Activity } from 'lucide-react';
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
  id: {
    title: 'Peringatan Harga', subtitle: 'Notifikasi saat harga mencapai target', add: 'Tambah',
    empty: 'Belum ada peringatan harga', emptyBody: 'Tekan Tambah untuk membuat peringatan pertama.',
    guide: 'Cara kerja peringatan', local: 'Peringatan disimpan secara lokal di penyimpanan aplikasi pada perangkat ini.',
    permission: 'Notifikasi hanya dikirim jika izin browser atau PWA tersedia dan diberikan oleh pengguna.',
    info: 'Bersifat informatif, bukan rekomendasi investasi. Harga dapat berasal dari data live atau snapshot terakhir yang tersedia.',
    triggered: 'Target tercapai', current: 'Harga sekarang',
    liveFeed: 'FEED LIVE', alternateData: 'DATA TERSEDIA', liveDetail: 'WebSocket harga sedang terhubung', alternateDetail: 'Menampilkan data pasar terakhir yang tersedia',
    push: 'Notifikasi', enabled: 'Diizinkan oleh perangkat', disabled: 'Belum diizinkan', enable: 'Aktifkan',
    unsupported: 'Perangkat atau browser ini tidak mendukung notifikasi.', granted: 'Izin notifikasi diberikan.', denied: 'Izin notifikasi tidak diberikan.', notificationBody: 'Peringatan harga siap digunakan.',
    monitor: 'STATUS DATA', connected: 'Koneksi live tersedia', snapshot: 'Snapshot / sumber alternatif', monitoring: 'Sumber harga untuk evaluasi target',
    newAlert: 'Buat Peringatan Baru', coin: 'Koin', condition: 'Kondisi', above: 'Di atas ($)', below: 'Di bawah ($)', target: 'Target Harga (USD)', example: 'Contoh: 50000', save: 'Simpan', cancel: 'Batal',
    active: 'Aktif', paused: 'Dijeda', toggleOn: 'Aktifkan peringatan', toggleOff: 'Jeda peringatan', remove: 'Hapus peringatan',
    intelligence: 'ALERT INTELLIGENCE', activeCount: 'Alert Aktif', triggeredCount: 'Sudah Terpicu', nearest: 'Target Terdekat', distance: 'Jarak ke Target', unavailable: 'Harga belum tersedia',
  },
  en: {
    title: 'Price Alerts', subtitle: 'Notifications when prices reach your target', add: 'Add',
    empty: 'No price alerts yet', emptyBody: 'Press Add to create your first alert.',
    guide: 'How alerts work', local: 'Alerts are stored locally in this app’s storage on this device.',
    permission: 'Notifications are only sent when browser or PWA permission is available and granted by the user.',
    info: 'For information only, not investment advice. Prices may come from a live feed or the latest available snapshot.',
    triggered: 'Target reached', current: 'Current price',
    liveFeed: 'LIVE FEED', alternateData: 'DATA AVAILABLE', liveDetail: 'Price WebSocket is currently connected', alternateDetail: 'Showing the latest market data available',
    push: 'Notifications', enabled: 'Allowed by this device', disabled: 'Not yet allowed', enable: 'Enable',
    unsupported: 'This device or browser does not support notifications.', granted: 'Notification permission granted.', denied: 'Notification permission was not granted.', notificationBody: 'Price alerts are ready to use.',
    monitor: 'DATA STATUS', connected: 'Live connection available', snapshot: 'Snapshot / alternate source', monitoring: 'Price source used to evaluate targets',
    newAlert: 'Create New Alert', coin: 'Coin', condition: 'Condition', above: 'Above ($)', below: 'Below ($)', target: 'Target Price (USD)', example: 'Example: 50000', save: 'Save', cancel: 'Cancel',
    active: 'Active', paused: 'Paused', toggleOn: 'Enable alert', toggleOff: 'Pause alert', remove: 'Delete alert',
    intelligence: 'ALERT INTELLIGENCE', activeCount: 'Active Alerts', triggeredCount: 'Triggered', nearest: 'Nearest Target', distance: 'Distance to Target', unavailable: 'Price unavailable',
  },
};

const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'LINK'];

function getDistancePercent(alert, prices) {
  const current = Number(prices?.[alert.coin]?.price);
  const target = Number(alert.price);
  if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(target) || target <= 0) return null;
  return Math.abs(((target - current) / current) * 100);
}

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

  const alertIntel = useMemo(() => {
    const active = alerts.filter((alert) => alert.active);
    const triggered = alerts.filter((alert) => Boolean(alert.triggeredAt));
    const ranked = active
      .map((alert) => ({ alert, distance: getDistancePercent(alert, prices) }))
      .filter((item) => Number.isFinite(item.distance))
      .sort((a, b) => a.distance - b.distance);
    return { active: active.length, triggered: triggered.length, nearest: ranked[0] || null };
  }, [alerts, prices]);

  const requestPush = async () => {
    if (!('Notification' in window)) { setPushStatus(text.unsupported); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setPushEnabled(true); setPushStatus(text.granted); new Notification('KriptoAman', { body: text.notificationBody });
    } else setPushStatus(text.denied);
    setTimeout(() => setPushStatus(''), 3000);
  };

  const addAlert = () => {
    const target = Number.parseFloat(form.price);
    if (!Number.isFinite(target) || target <= 0) return;
    const newAlert = { id: Date.now(), ...form, price: target, active: true, createdAt: new Date().toISOString() };
    const updated = [newAlert, ...alerts]; setAlerts(updated); saveAlerts(updated);
    setForm({ coin: 'BTC', condition: 'above', price: '' }); setShowAdd(false);
  };

  const toggleAlert = (id) => { const updated = alerts.map(a => a.id === id ? { ...a, active: !a.active } : a); setAlerts(updated); saveAlerts(updated); };
  const deleteAlert = (id) => { const updated = alerts.filter(a => a.id !== id); setAlerts(updated); saveAlerts(updated); };

  return (
    <div className="ka-bg min-h-screen text-white" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/15 bg-[#071423]/85 p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-6" aria-labelledby="alerts-title">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(56,189,248,.16),transparent_28%),radial-gradient(circle_at_10%_100%,rgba(139,92,246,.12),transparent_30%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="mb-2 flex items-center gap-2 text-sky-300"><Radar className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[0.2em]">KRIPTOAMAN ALERT INTELLIGENCE</span></div><h1 id="alerts-title" className="text-2xl font-extrabold sm:text-3xl">{text.title}</h1><p className="mt-1 text-sm text-slate-400">{text.subtitle}</p></div>
            <div className="flex items-center gap-2"><span className={`ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold ${connected ? 'text-emerald-300' : 'text-slate-300'}`} title={connected ? text.liveDetail : text.alternateDetail}><Radio className="h-3 w-3" />{connected ? text.liveFeed : text.alternateData}</span><button type="button" onClick={() => setShowAdd(!showAdd)} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-sky-400/25 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-200"><Plus className="h-4 w-4" />{text.add}</button></div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label={text.intelligence}>
          <div className="ka-surface p-4"><Activity className="h-4 w-4 text-sky-300" /><p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{text.activeCount}</p><p className="mt-1 text-2xl font-black">{alertIntel.active}</p></div>
          <div className="ka-surface p-4"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{text.triggeredCount}</p><p className="mt-1 text-2xl font-black">{alertIntel.triggered}</p></div>
          <div className="ka-surface p-4"><Target className="h-4 w-4 text-violet-300" /><p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{text.nearest}</p><p className="mt-1 text-sm font-black">{alertIntel.nearest ? `${alertIntel.nearest.alert.coin} · ${alertIntel.nearest.distance.toFixed(2)}%` : '—'}</p></div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="ka-surface p-4 lg:col-span-8"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${pushEnabled ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-slate-700/40 bg-slate-900/50'}`}>{pushEnabled ? <Bell className="h-5 w-5 text-emerald-300" /> : <BellOff className="h-5 w-5 text-slate-400" />}</div><div className="min-w-0"><p className="text-sm font-semibold">{text.push}</p><p className="text-xs leading-relaxed text-slate-400">{pushEnabled ? text.enabled : text.disabled}</p></div></div>{!pushEnabled ? <button type="button" onClick={requestPush} className="min-h-11 rounded-xl border border-violet-500/25 bg-violet-500/15 px-3 text-xs font-semibold text-violet-200">{text.enable}</button> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}</div></section>
          <section className="ka-surface p-4 lg:col-span-4"><div className="flex items-center gap-2 text-cyan-300"><Radio className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[0.18em]">{text.monitor}</span></div><p className="mt-3 text-lg font-extrabold">{connected ? text.connected : text.snapshot}</p><p className="mt-1 text-xs text-slate-500">{text.monitoring}</p></section>
        </div>

        {pushStatus && <p role="status" aria-live="polite" className="text-center text-xs text-indigo-300">{pushStatus}</p>}

        {showAdd && <div className="ka-surface space-y-3 p-5"><p className="font-semibold text-white">{text.newAlert}</p><div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs text-slate-400">{text.coin}</label><select value={form.coin} onChange={e => setForm(f => ({ ...f, coin: e.target.value }))} className="min-h-11 w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white">{COINS.map(c => <option key={c}>{c}</option>)}</select></div><div><label className="mb-1 block text-xs text-slate-400">{text.condition}</label><select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="min-h-11 w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white"><option value="above">{text.above}</option><option value="below">{text.below}</option></select></div></div><div><label className="mb-1 block text-xs text-slate-400">{text.target}</label><input type="number" min="0" step="any" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder={text.example} className="min-h-11 w-full rounded-xl border border-sky-400/15 bg-slate-950/60 px-3 py-2 text-sm text-white" /></div><div className="flex gap-2"><button type="button" onClick={addAlert} className="min-h-11 flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white">{text.save}</button><button type="button" onClick={() => setShowAdd(false)} className="min-h-11 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300">{text.cancel}</button></div></div>}

        {alerts.length === 0 && !showAdd && <div className="ka-surface px-6 py-12 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-sky-500/20 bg-sky-500/10"><Bell className="h-7 w-7 text-sky-300" /></div><p className="font-semibold text-white">{text.empty}</p><p className="mt-1 text-sm text-slate-400">{text.emptyBody}</p></div>}

        <div className="space-y-2">
          {alerts.map(a => {
            const current = Number(prices?.[a.coin]?.price);
            const distance = getDistancePercent(a, prices);
            return <div key={a.id} className={`ka-surface flex items-center justify-between gap-3 p-4 transition ${a.active ? '' : 'opacity-60'}`}><div className="flex min-w-0 items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.condition === 'above' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>{a.condition === 'above' ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{a.coin} {a.condition === 'above' ? '↑' : '↓'} ${Number(a.price).toLocaleString()}</p><p className="truncate text-[11px] text-slate-500">{a.triggeredAt ? text.triggered : a.active ? text.active : text.paused} · {new Date(a.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID')}</p>{a.active && <p className="mt-1 text-[10px] text-sky-300">{Number.isFinite(current) ? `${text.current}: $${current.toLocaleString('en-US', { maximumFractionDigits: 6 })} · ${text.distance}: ${distance?.toFixed(2)}%` : text.unavailable}</p>}</div></div><div className="flex shrink-0 items-center gap-1"><button type="button" aria-label={a.active ? text.toggleOff : text.toggleOn} onClick={() => toggleAlert(a.id)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-800">{a.active ? <Bell className="h-4 w-4 text-sky-300" /> : <BellOff className="h-4 w-4 text-slate-500" />}</button><button type="button" aria-label={text.remove} onClick={() => deleteAlert(a.id)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-red-500/10"><Trash2 className="h-4 w-4 text-red-400" /></button></div></div>;
          })}
        </div>

        <section className="grid gap-3 sm:grid-cols-2" aria-labelledby="alert-guide"><div className="ka-surface p-4"><h2 id="alert-guide" className="text-sm font-bold">{text.guide}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text.local}</p></div><div className="ka-surface p-4"><h2 className="text-sm font-bold">Browser &amp; PWA</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text.permission}</p></div></section>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-3"><p className="text-sm leading-relaxed text-yellow-200"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />{text.info}</p></div>
      </div>
    </div>
  );
}
