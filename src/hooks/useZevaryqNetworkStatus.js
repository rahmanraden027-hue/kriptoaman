import { useCallback, useEffect, useState } from 'react';
import { fetchZevaryqNetworkStatus } from '@/services/zevaryqNetwork';

const AUTO_REFRESH_MS = 60_000;

export default function useZevaryqNetworkStatus() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' });

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setState((current) => ({ ...current, phase: 'loading', error: '' }));
    try {
      const data = await fetchZevaryqNetworkStatus();
      setState({
        phase: data.rpc === 'error' ? 'offline' : data.error ? 'degraded' : 'success',
        data,
        error: data.error,
      });
    } catch (error) {
      const message = error?.message || 'Network request failed';
      setState((current) => silent && current.data
        ? { ...current, phase: 'degraded', error: message }
        : { phase: error?.name === 'AbortError' ? 'timeout' : 'offline', data: null, error: message });
    }
  }, []);

  const refresh = useCallback(() => load({ silent: false }), [load]);

  useEffect(() => {
    load({ silent: false });
    const timer = window.setInterval(() => load({ silent: true }), AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return { ...state, refresh };
}
