import { useEffect, useMemo, useState } from 'react';

const CACHE_KEY = 'ka_global_markets_v1';
const CACHE_TTL_MS = 60 * 60 * 1000;
const REQUEST_DEDUPE_MS = 15 * 1000;

let sharedRequest = null;
let sharedPayload = null;
let sharedFetchedAt = 0;

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

const fetchSharedGlobalMarkets = async () => {
  if (sharedPayload && (Date.now() - sharedFetchedAt) < REQUEST_DEDUPE_MS) return sharedPayload;
  if (sharedRequest) return sharedRequest;

  sharedRequest = fetch('/api/global-markets', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  }).then(async response => {
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.instruments?.length) {
      throw new Error(payload?.code || 'GLOBAL_MARKETS_UNAVAILABLE');
    }
    sharedPayload = payload;
    sharedFetchedAt = Date.now();
    writeCache(payload);
    return payload;
  }).finally(() => {
    sharedRequest = null;
  });

  return sharedRequest;
};

export default function useGlobalMarkets() {
  const cached = useMemo(() => readCache(), []);
  const [data, setData] = useState(cached?.payload || null);
  const [loading, setLoading] = useState(!cached?.payload);
  const [error, setError] = useState(null);
  const [usingCache, setUsingCache] = useState(Boolean(cached?.payload));

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(current => current || !data);
      try {
        const payload = await fetchSharedGlobalMarkets();
        if (!active) return;
        setData(payload);
        setError(null);
        setUsingCache(false);
      } catch (err) {
        if (!active) return;
        setError(err);
        const fallback = readCache();
        if (fallback?.payload) {
          setData(fallback.payload);
          setUsingCache(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentCache = readCache();
  const cacheAgeMs = currentCache?.savedAt ? Date.now() - currentCache.savedAt : null;
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
