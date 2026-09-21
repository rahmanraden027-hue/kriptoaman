import { useCallback, useEffect, useState } from 'react';
import { fetchZevaryqNetworkStatus } from '@/services/zevaryqNetwork';

export default function useZevaryqNetworkStatus() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' });
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, phase: 'loading', error: '' }));
    try {
      const data = await fetchZevaryqNetworkStatus();
      setState({ phase: data.rpc === 'error' ? 'offline' : data.error ? 'degraded' : 'success', data, error: data.error });
    } catch (error) {
      setState({ phase: error?.name === 'AbortError' ? 'timeout' : 'offline', data: null, error: error?.message || 'Network request failed' });
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { ...state, refresh };
}
