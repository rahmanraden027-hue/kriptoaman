import React, { useCallback, useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useLanguage } from '@/lib/LanguageContext';
import {
  BatteryCharging,
  CheckCircle2,
  Gauge,
  RefreshCw,
  Share2,
  Smartphone,
  Vibrate,
  Wifi,
  WifiOff,
} from 'lucide-react';

const NativeUtility = registerPlugin('KriptoAmanNative');

const COPY = {
  id: {
    network: 'Jaringan',
    cellular: 'Seluler',
    offline: 'Offline',
    errorRead: 'Status perangkat belum dapat dibaca.',
    errorShare: 'Fitur berbagi belum tersedia pada perangkat ini.',
    shareTitle: 'Bagikan KriptoAman',
    shareText: 'KriptoAman — intelijen pasar, pemantauan aset digital, keamanan akun, dan pemantauan alamat publik. https://kriptoaman.com',
    subtitle: 'Status perangkat dan utilitas native KriptoAman.',
    connection: 'Koneksi',
    battery: 'Baterai',
    appVersion: 'Versi App',
    device: 'Perangkat Android',
    refresh: 'Segarkan',
    share: 'Bagikan',
  },
  en: {
    network: 'Network',
    cellular: 'Cellular',
    offline: 'Offline',
    errorRead: 'Device status is currently unavailable.',
    errorShare: 'Sharing is not available on this device yet.',
    shareTitle: 'Share KriptoAman',
    shareText: 'KriptoAman — market intelligence, digital asset monitoring, account security, and public-address monitoring. https://kriptoaman.com',
    subtitle: 'Device status and KriptoAman native utilities.',
    connection: 'Connection',
    battery: 'Battery',
    appVersion: 'App Version',
    device: 'Android device',
    refresh: 'Refresh',
    share: 'Share',
  },
};

function transportLabel(value, text) {
  const labels = {
    wifi: 'Wi‑Fi',
    cellular: text.cellular,
    ethernet: 'Ethernet',
    vpn: 'VPN',
    other: text.network,
    offline: text.offline,
  };
  return labels[value] || text.network;
}

export default function NativeMobileUtility() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const native = Capacitor.isNativePlatform();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!native) return;
    setLoading(true);
    setError('');
    try {
      const next = await NativeUtility.getDeviceStatus();
      setStatus(next);
    } catch {
      setError(text.errorRead);
    } finally {
      setLoading(false);
    }
  }, [native, text.errorRead]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!native) return null;

  const connected = Boolean(status?.connected);
  const battery = Number.isFinite(Number(status?.batteryLevel)) && Number(status?.batteryLevel) >= 0
    ? `${status.batteryLevel}%`
    : '—';

  const haptic = async () => {
    try { await NativeUtility.haptic(); } catch { /* optional hardware feature */ }
  };

  const share = async () => {
    try {
      await NativeUtility.shareText({
        title: text.shareTitle,
        text: text.shareText,
      });
    } catch {
      setError(text.errorShare);
    }
  };

  return (
    <section className="ka-command-panel overflow-hidden p-4 sm:p-5" aria-label="Mobile Utility Center">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <Smartphone className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          </div>
          <div>
            <p className="ka-command-kicker">ANDROID NATIVE UTILITY</p>
            <h2 className="mt-1 text-sm font-black text-white">Mobile Utility Center</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{text.subtitle}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[8px] font-black text-emerald-300">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> NATIVE
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/35 p-3">
          <div className="flex items-center gap-2 text-slate-500">
            {connected ? <Wifi className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <WifiOff className="h-4 w-4 text-amber-300" aria-hidden="true" />}
            <span className="text-[9px] font-bold uppercase tracking-wide">{text.connection}</span>
          </div>
          <p className={`mt-2 text-sm font-black ${connected ? 'text-emerald-300' : 'text-amber-300'}`}>
            {connected ? transportLabel(status?.transport, text) : text.offline}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/35 p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <BatteryCharging className="h-4 w-4 text-sky-300" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-wide">{text.battery}</span>
          </div>
          <p className="mt-2 text-sm font-black text-white">{battery}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/35 p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Gauge className="h-4 w-4 text-violet-300" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-wide">Android</span>
          </div>
          <p className="mt-2 truncate text-sm font-black text-white">{status?.androidVersion || '—'} · API {status?.sdkInt || '—'}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/35 p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Smartphone className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-wide">{text.appVersion}</span>
          </div>
          <p className="mt-2 text-sm font-black text-white">{status?.appVersion || '—'} ({status?.versionCode || '—'})</p>
        </div>
      </div>

      <p className="mt-3 truncate text-[10px] text-slate-500">
        {[status?.manufacturer, status?.model].filter(Boolean).join(' ') || text.device}
      </p>

      {error && <p role="alert" className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-[10px] text-amber-200">{error}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={refresh} disabled={loading} className="tap-reset flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/8 px-2 text-[10px] font-bold text-sky-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> {text.refresh}
        </button>
        <button type="button" onClick={haptic} className="tap-reset flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-500/8 px-2 text-[10px] font-bold text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70">
          <Vibrate className="h-3.5 w-3.5" aria-hidden="true" /> Haptic
        </button>
        <button type="button" onClick={share} className="tap-reset flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-2 text-[10px] font-bold text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> {text.share}
        </button>
      </div>
    </section>
  );
}
