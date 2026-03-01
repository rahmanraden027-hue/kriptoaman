import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function usePWAInitializer() {
  const [swReady, setSwReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          
          setSwReady(true);
          console.log('Service Worker registered:', reg);

          // Check for updates every hour
          setInterval(() => {
            reg.update();
          }, 60 * 60 * 1000);

          // Listen for new service worker
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                setUpdateAvailable(true);
                // Notify user
                base44.analytics.track({
                  eventName: 'pwa_update_available',
                  properties: { timestamp: Date.now() }
                });
              }
            });
          });
        } catch (err) {
          console.error('Service Worker registration failed:', err);
        }
      });

      // Listen for controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New Service Worker activated');
        window.location.reload();
      });
    }

    // Handle push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (!sub && Notification.permission === 'granted') {
            subscribeToPushNotifications(reg);
          }
        });
      });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        console.log('Notification permission denied');
      });
    }
  }, []);

  return { swReady, updateAvailable };
}

async function subscribeToPushNotifications(swReg) {
  try {
    const subscription = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
      ),
    });

    // Send subscription to server
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

// Hook untuk update notification
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