import { useEffect, useState } from 'react';

const CACHE_KEY = 'ka_global_intelligence_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

const readCache = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
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
    // Intelligence cache is optional.
  }
};

const fetchJson = async (url, signal) => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
};

export default function useGlobalMarketIntelligence() {
  const cached = readCache();
  const [state, setState] = useState(() => cached?.payload || {
    intelligence: null,
    history: null,
    calendar: null,
  });
  const [loading, setLoading] = useState(!cached?.payload);
  const [updatedAt, setUpdatedAt] = useState(cached?.savedAt || null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      const [intelligenceResult, historyResult, calendarResult] = await Promise.allSettled([
        fetchJson('/api/global-market-intelligence', controller.signal),
        fetchJson('/api/global-markets-history?symbol=XAU%2FUSD&interval=1h&outputsize=96', controller.signal),
        fetchJson('/api/economic-calendar', controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const intelligence = intelligenceResult.status === 'fulfilled' ? intelligenceResult.value : null;
      const history = historyResult.status === 'fulfilled' ? historyResult.value : null;
      const calendar = calendarResult.status === 'fulfilled' ? calendarResult.value : null;

      const next = {
        intelligence: intelligence?.ok ? intelligence.payload : null,
        history: history?.ok ? history.payload : null,
        calendar: calendar?.ok ? calendar.payload : null,
        availability: {
          intelligence: intelligence?.payload?.code || (intelligence?.ok ? 'available' : 'unavailable'),
          history: history?.payload?.code || (history?.ok ? 'available' : 'unavailable'),
          calendar: calendar?.payload?.code || (calendar?.ok ? 'available' : 'unavailable'),
        },
      };

      if (next.intelligence || next.history || next.calendar) {
        setState(next);
        setUpdatedAt(Date.now());
        writeCache(next);
      } else {
        const fallback = readCache();
        if (fallback?.payload && (Date.now() - fallback.savedAt) <= CACHE_TTL_MS) {
          setState(fallback.payload);
          setUpdatedAt(fallback.savedAt);
        } else {
          setState(next);
        }
      }
      setLoading(false);
    };

    load();
    const timer = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return { ...state, loading, updatedAt };
}
