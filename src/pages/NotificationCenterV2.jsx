import React, { useMemo, useState } from 'react';
import { Bell, CheckCircle2, CircleDot, Network, ShieldCheck, WalletCards, Activity, AlertTriangle } from 'lucide-react';
import { appStorage } from '@/components/utils/appStorage';
import { useLanguage } from '@/lib/LanguageContext';
import Alerts from './Alerts.jsx';

const ALERTS_KEY = 'ka_price_alerts';
const READ_KEY = 'ka_notification_read_v1';

function readJson(key, fallback) {
  try { return JSON.parse(appStorage.get(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

export default function NotificationCenterV2() {
  const { language } = useLanguage();
  const [readIds, setReadIds] = useState(() => readJson(READ_KEY, []));
  const priceAlerts = readJson(ALERTS_KEY, []);

  const events = useMemo(() => priceAlerts
    .filter((alert) => alert.triggeredAt)
    .map((alert) => ({
      id: `price-${alert.id}`,
      type: 'price',
      severity: 'info',
      title: `${alert.coin} ${language === 'en' ? 'price target reached' : 'mencapai target harga'}`,
      body: `${language === 'en' ? 'Triggered price' : 'Harga terpicu'}: ${Number(alert.triggeredPrice || alert.price).toLocaleString('en-US', { maximumFractionDigits: 6 })}`,
      at: alert.triggeredAt,
    }))
    .sort((a, b) => new Date(b.at) - new Date(a.at)), [language, priceAlerts]);

  const categories = [
    { icon: Bell, label: language === 'en' ? 'Price' : 'Harga', status: language === 'en' ? 'Connected' : 'Terhubung', tone: 'text-sky-300' },
    { icon: ShieldCheck, label: language === 'en' ? 'Security' : 'Keamanan', status: language === 'en' ? 'Source pending' : 'Sumber belum terhubung', tone: 'text-emerald-300' },
    { icon: Network, label: 'KAM Network', status: language === 'en' ? 'Source pending' : 'Sumber belum terhubung', tone: 'text-violet-300' },
    { icon: WalletCards, label: language === 'en' ? 'Portfolio' : 'Portofolio', status: language === 'en' ? 'Source pending' : 'Sumber belum terhubung', tone: 'text-cyan-300' },
    { icon: Activity, label: language === 'en' ? 'System' : 'Sistem', status: language === 'en' ? 'Source pending' : 'Sumber belum terhubung', tone: 'text-amber-300' },
  ];

  const markRead = (id) => {
    const next = readIds.includes(id) ? readIds : [...readIds, id];
    setReadIds(next);
    appStorage.set(READ_KEY, JSON.stringify(next));
  };

  const unread = events.filter((event) => !readIds.includes(event.id)).length;

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-400/15 bg-[#071321]/95 p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-sky-300"><Bell className="h-4 w-4" /> KRIPTOAMAN NOTIFICATION CENTER</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-2xl font-black sm:text-3xl">{language === 'en' ? 'Notification Intelligence' : 'Intelijen Notifikasi'}</h1><p className="mt-1 max-w-2xl text-sm text-slate-400">{language === 'en' ? 'A source-aware inbox for price, security, network, portfolio, and system events.' : 'Inbox berbasis sumber untuk peristiwa harga, keamanan, jaringan, portofolio, dan sistem.'}</p></div>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black text-sky-200">{unread} {language === 'en' ? 'UNREAD' : 'BELUM DIBACA'}</span>
          </div>
        </section>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map(({ icon: Icon, label, status, tone }, index) => <div key={label} className="ka-surface p-4"><Icon className={`h-4 w-4 ${tone}`} /><p className="mt-2 text-xs font-black">{label}</p><p className={`mt-1 text-[10px] ${index === 0 ? 'text-emerald-300' : 'text-slate-500'}`}>{status}</p></div>)}
        </section>

        <section className="ka-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">EVENT INBOX</p><h2 className="mt-1 text-lg font-black">{language === 'en' ? 'Recent verified events' : 'Peristiwa terverifikasi terbaru'}</h2></div><CircleDot className="h-5 w-5 text-sky-300" /></div>
          <div className="mt-4 space-y-2">
            {events.length ? events.slice(0, 10).map((event) => {
              const isRead = readIds.includes(event.id);
              return <button key={event.id} type="button" onClick={() => markRead(event.id)} className={`flex min-h-16 w-full items-start gap-3 rounded-2xl border p-3 text-left ${isRead ? 'border-white/[0.05] bg-white/[0.02]' : 'border-sky-400/15 bg-sky-400/[0.05]'}`}><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/10"><Bell className="h-4 w-4 text-sky-300" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">{event.title}</span><span className="mt-1 block text-xs text-slate-500">{event.body}</span><span className="mt-1 block text-[10px] text-slate-600">{new Date(event.at).toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}</span></span>{isRead ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <span className="mt-1 h-2 w-2 rounded-full bg-sky-300" />}</button>;
            }) : <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">{language === 'en' ? 'No verified notification events yet.' : 'Belum ada peristiwa notifikasi terverifikasi.'}</div>}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/5 p-3 text-[10px] leading-5 text-amber-200"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{language === 'en' ? 'Only connected sources generate inbox events. Pending categories are displayed as unavailable rather than fabricated.' : 'Hanya sumber yang benar-benar terhubung yang menghasilkan event inbox. Kategori yang belum terhubung ditampilkan sebagai tidak tersedia, bukan dibuat-buat.'}</div>
        </section>
      </div>
      <Alerts />
    </div>
  );
}
