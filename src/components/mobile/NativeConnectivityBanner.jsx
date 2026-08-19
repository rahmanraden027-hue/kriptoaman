import React, { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { WifiOff } from 'lucide-react';

const NativeUtility = registerPlugin('KriptoAmanNative');

export default function NativeConnectivityBanner() {
  const native = Capacitor.isNativePlatform();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!native) return undefined;

    let active = true;
    let timer;

    const readStatus = async () => {
      try {
        const status = await NativeUtility.getDeviceStatus();
        if (active) setOffline(!status?.connected);
      } catch {
        if (active) setOffline(!navigator.onLine);
      }
    };

    const onOffline = () => setOffline(true);
    const onOnline = () => {
      setOffline(false);
      readStatus();
    };

    readStatus();
    timer = window.setInterval(readStatus, 15000);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [native]);

  if (!native || !offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-3 right-3 z-[70] flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-[#16120a]/95 px-3 py-2.5 text-[11px] font-semibold text-amber-100 shadow-[0_14px_38px_rgba(0,0,0,.38)] backdrop-blur-xl"
      style={{ bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
      <span>Mode offline. Data live akan disinkronkan kembali saat koneksi tersedia.</span>
    </div>
  );
}
