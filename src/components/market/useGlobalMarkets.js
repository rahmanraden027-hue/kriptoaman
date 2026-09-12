import { useEffect, useMemo, useState } from 'react';

const CACHE_KEY = 'ka_global_markets_v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.payload) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = payload => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), payload }));
  } catch {
    // Cache failure must not break the market experience.
  }
};

export default function useGlobalMarkets() {
  const cached = useMemo(() => readCache(), []);
  const [data, setData] = useState(cached?.payload || null);
  const [loading, setLoading] = useState(!cached?.payload);
  const [error, setError] = useState(null);
  const [usingCache, setUsingCache] = useState(Boolean(cached?.payload));

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(!data);
      try {
        const response = await fetch('/api/global-markets', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.instruments?.length) {
          throw new Error(payload?.code || 'GLOBAL_MARKETS_UNAVAILABLE');
        }
        setData(payload);
        setError(null);
        setUsingCache(false);
        writeCache(payload);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setError(err);
        const fallback = readCache();
        if (fallback?.payload) {
          setData(fallback.payload);
          setUsingCache(true);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cacheAgeMs = cached?.savedAt ? Date.now() - cached.savedAt : null;
  const cacheFresh = cacheAgeMs != null && cacheAgeMs <= CACHE_TTL_MS;

  return {
    data,
    instruments: data?.instruments || [],
    loading,
    error,
    usingCache,
    cacheFresh,
  };
}
