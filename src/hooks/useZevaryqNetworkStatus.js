import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchZevaryqNetworkStatus } from '@/services/zevaryqNetwork';

export const ZEVARYQ_REFRESH_MS = Object.freeze({
  STREAM: 12_000,
  FALLBACK: 30_000,
  DEGRADED: 60_000,
});

export function getZevaryqRefreshDelay(data, phase = 'success') {
  if (phase === 'offline' || phase === 'timeout' || phase === 'degraded') {
    return ZEVARYQ_REFRESH_MS.DEGRADED;
  }
  const streamState = data?.sources?.tokenIntelligence?.streamState;
  if (streamState === 'connected') return ZEVARYQ_REFRESH_MS.STREAM;
  if (streamState === 'fallback' || data?.rpc === 'connected') return ZEVARYQ_REFRESH_MS.FALLBACK;
  return ZEVARYQ_REFRESH_MS.DEGRADED;
}

export default function useZevaryqNetworkStatus() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' });
  const inFlight = useRef(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    if (!silent) setState((current) => ({ ...current, phase: 'loading', error: '' }));

    try {
      const data = await fetchZevaryqNetworkStatus();
      if (!mountedRef.current) return data;
      setState({
        phase: data.rpc === 'error' ? 'offline' : data.error ? 'degraded' : 'success',
        data,
        error: data.error,
      });
      return data;
    } catch (error) {
      const message = error?.message || 'Network request failed';
      if (mountedRef.current) {
        setState((current) => silent && current.data
          ? { ...current, phase: 'degraded', error: message }
          : { phase: error?.name === 'AbortError' ? 'timeout' : 'offline', data: null, error: message });
      }
      return null;
    } finally {
      inFlight.current = false;
    }
  }, []);

  const refresh = useCallback(() => load({ silent: false }), [load]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const schedule = (data, phase = 'success') => {
      clearTimer();
      if (cancelled || document.visibilityState === 'hidden') return;
      timerRef.current = window.setTimeout(async () => {
        const next = await load({ silent: true });
        if (!cancelled) schedule(next || data, next ? (next.error ? 'degraded' : 'success') : 'degraded');
      }, getZevaryqRefreshDelay(data, phase));
    };

    const start = async () => {
      const data = await load({ silent: false });
      if (!cancelled) schedule(data, data?.error ? 'degraded' : data ? 'success' : 'offline');
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearTimer();
        return;
      }
      load({ silent: true }).then((data) => {
        if (!cancelled) schedule(data, data?.error ? 'degraded' : data ? 'success' : 'offline');
      });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    start();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [load]);

  return { ...state, refresh };
}
