import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function usePWAInitializer() {
  const [swReady, setSwReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return undefined;

    let reg;
    let updateInterval;
    let reloading = false;

    const checkForUpdate = async () => {
      try {
        if (reg) await reg.update();
      } catch (err) {
        console.warn('Service Worker update check failed:', err);
      }
    };

    const registerWorker = async () => {
      try {
        reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        setSwReady(true);
        console.log('Service Worker registered:', reg);

        // Always check immediately when the app starts. This is important for
        // installed Android PWAs that may otherwise continue using an old UI bundle.
        await reg.update();

        updateInterval = window.setInterval(checkForUpdate, 5 * 60 * 1000);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              setUpdateAvailable(true);
              base44.analytics.track({
                eventName: 'pwa_update_available',
                properties: { timestamp: Date.now() },
              }).catch(() => {});
            }
          });
        });
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    };

    // If the component mounts after window.load has already fired, register
    // immediately instead of waiting for an event that will never fire again.
    if (document.readyState === 'complete') {
      registerWorker();
    } else {
      window.addEventListener('load', registerWorker, { once: true });
    }

    const onFocus = () => checkForUpdate();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      console.log('New Service Worker activated; refreshing UI');
      window.location.reload();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.removeEventListener('load', registerWorker);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (updateInterval) window.clearInterval(updateInterval);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    // Never request notification permission automatically on startup. Browsers
    // increasingly require notification permission to follow a clear user action,
    // and an unsolicited prompt degrades first-run/install experience.
    if (Notification.permission !== 'granted') return;

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    if (!vapidPublicKey) return;

    navigator.serviceWorker.ready
      .then(registration => registration.pushManager.getSubscription().then(sub => {
        if (!sub) return subscribeToPushNotifications(registration, vapidPublicKey);
        return undefined;
      }))
      .catch(err => {
        console.warn('Push subscription readiness check failed:', err);
      });
  }, []);

  return { swReady, updateAvailable };
}

async function subscribeToPushNotifications(swReg, vapidPublicKey) {
  try {
    const subscription = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    console.log('Subscribed to push notifications');
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function PWAUpdateNotification() {
  const { updateAvailable } = usePWAInitializer();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 bg-blue-600 text-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Versi baru tersedia!</p>
          <p className="text-sm text-blue-100">Aplikasi akan diperbarui saat halaman dimuat ulang</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="ml-4 bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50"
        >
          Perbarui
        </button>
      </div>
    </div>
  );
}
