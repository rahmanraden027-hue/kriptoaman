/**
 * useLivePrices — Global singleton WebSocket hook
 * Connects to Binance WebSocket stream 24/7, auto-reconnects on disconnect.
 * Uses KriptoAman /api/market-hot as the centralized initial/fallback source so
 * browser clients do not expose provider API keys or fan out fallback traffic
 * directly to multiple public providers.
 * Returns: { prices: { BTC: { price, change24h, high24h, low24h, volume24h, tick } }, connected }
 */
import { useState, useEffect, useRef } from 'react';

const ASSETS = [
  { sym: 'btcusdt',   id: 'BTC'  },
  { sym: 'ethusdt',   id: 'ETH'  },
  { sym: 'bnbusdt',   id: 'BNB'  },
  { sym: 'solusdt',   id: 'SOL'  },
  { sym: 'xrpusdt',   id: 'XRP'  },
  { sym: 'adausdt',   id: 'ADA'  },
  { sym: 'dogeusdt',  id: 'DOGE' },
  { sym: 'trxusdt',   id: 'TRX'  },
  { sym: 'avaxusdt',  id: 'AVAX' },
  { sym: 'dotusdt',   id: 'DOT'  },
  { sym: 'linkusdt',  id: 'LINK' },
  { sym: 'polusdt',   id: 'MATIC' },
  { sym: 'ltcusdt',   id: 'LTC'  },
  { sym: 'uniusdt',   id: 'UNI'  },
  { sym: 'shibusdt',  id: 'SHIB' },
  { sym: 'pepeusdt',  id: 'PEPE' },
  { sym: 'atomusdt',  id: 'ATOM' },
  { sym: 'nearusdt',  id: 'NEAR' },
  { sym: 'arbusdt',   id: 'ARB'  },
  { sym: 'opusdt',    id: 'OP'   },
  { sym: 'suiusdt',   id: 'SUI'  },
  { sym: 'aptusdt',   id: 'APT'  },
];

const SYM_MAP = {};
ASSETS.forEach(a => { SYM_MAP[a.sym] = a.id; });

const STREAMS = ASSETS.map(a => `${a.sym}@ticker`).join('/');
const WS_URL = `wss://stream.binance.com:9443/stream?streams=${STREAMS}`;
const HOT_MARKET_ENDPOINT = '/api/market-hot';
const HOT_POLL_INTERVAL_MS = 15_000;
const HOT_REQUEST_TIMEOUT_MS = 7_000;
const LIVE_CACHE_KEY = 'ka_live_prices_v1';
const RECONNECT_DELAY_MS = 5000;
const STALE_AFTER_MS = 30000;
const WATCHDOG_INTERVAL_MS = 10000;

const loadLiveCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(LIVE_CACHE_KEY) || 'null');
    return cached?.prices && typeof cached.prices === 'object' ? cached.prices : {};
  } catch {
    return {};
  }
};

const normalizeHotPayload = (payload) => {
  if (!Array.isArray(payload?.data)) return {};
  const next = {};
  payload.data.forEach((item) => {
    const symbol = String(item?.symbol || '').toUpperCase();
    const price = Number(item?.price);
    if (!symbol || !Number.isFinite(price)) return;
    next[symbol === 'POL' ? 'MATIC' : symbol] = {
      price,
      change24h: Number.isFinite(Number(item.change24h)) ? Number(item.change24h) : null,
      volume24h: Number.isFinite(Number(item.volume24h)) ? Number(item.volume24h) : null,
      high24h: Number.isFinite(Number(item.high24h)) ? Number(item.high24h) : null,
      low24h: Number.isFinite(Number(item.low24h)) ? Number(item.low24h) : null,
    };
  });
  return next;
};

async function fetchHotSnapshot() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HOT_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(HOT_MARKET_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Hot market HTTP ${response.status}`);
    const payload = await response.json();
    const normalized = normalizeHotPayload(payload);
    if (!normalized.BTC || !normalized.ETH) throw new Error('Hot market missing core assets');
    return normalized;
  } finally {
    clearTimeout(timeout);
  }
}

// IDR rate cache
let cachedIDR = 16200;
let lastIDRFetch = 0;

async function fetchIDRRate() {
  const now = Date.now();
  if (now - lastIDRFetch < 5 * 60 * 1000) return cachedIDR; // cache 5 min
  try {
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const d = await r.json();
    if (d.rates?.IDR) { cachedIDR = d.rates.IDR; lastIDRFetch = now; }
  } catch { /* use cached */ }
  return cachedIDR;
}

export default function useLivePrices() {
  const [prices, setPrices] = useState(loadLiveCache);
  const [connected, setConnected] = useState(false);
  const [idrRate, setIdrRate] = useState(16200);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);
  const lastPersistRef = useRef(0);
  const lastMessageRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (Object.keys(prices).length === 0 || now - lastPersistRef.current < 30000) return;
    try {
      localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({ savedAt: now, idrRate, prices }));
      lastPersistRef.current = now;
    } catch {
      // Storage restrictions must not interrupt live pricing.
    }
  }, [prices, idrRate]);

  // Fetch IDR rate on mount and every 5 min
  useEffect(() => {
    fetchIDRRate().then(r => { if (mountedRef.current) setIdrRate(r); });
    const idrInterval = setInterval(() => {
      fetchIDRRate().then(r => { if (mountedRef.current) setIdrRate(r); });
    }, 5 * 60 * 1000);
    return () => clearInterval(idrInterval);
  }, []);

  // Initial server-controlled price snapshot. This removes client-side provider
  // API keys and gives the app a verified fallback before WebSocket data arrives.
  useEffect(() => {
    let cancelled = false;

    fetchHotSnapshot()
      .then((initial) => {
        if (!cancelled && mountedRef.current && Object.keys(initial).length > 0) {
          setPrices(prev => ({ ...prev, ...initial }));
        }
      })
      .catch(() => {
        import('@/api/base44Client').then(({ base44 }) => {
          base44.entities.CachedPrice.list().then(cached => {
            if (cancelled || !mountedRef.current || !cached?.length) return;

            const initial = {};
            cached.forEach(c => {
              initial[c.symbol] = {
                price: c.price,
                change24h: c.change24h,
                volume24h: c.volume24h,
                high24h: c.high24h,
                low24h: c.low24h,
              };

              if (c.idrRate) {
                cachedIDR = c.idrRate;
                setIdrRate(c.idrRate);
              }
            });

            setPrices(prev => ({ ...prev, ...initial }));
          }).catch(() => {});
        }).catch(() => {});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // When WebSocket is unavailable, poll the edge-cached KriptoAman hot feed.
  // At scale this keeps fallback traffic on KriptoAman edge/cache instead of
  // multiplying public-provider requests from every browser session.
  useEffect(() => {
    if (connected) return undefined;
    const poll = () => {
      fetchHotSnapshot()
        .then((next) => {
          if (mountedRef.current && Object.keys(next).length > 0) {
            setPrices(prev => ({ ...prev, ...next }));
          }
        })
        .catch(() => {});
    };
    const interval = setInterval(poll, HOT_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [connected]);

  // Binance WebSocket — persistent live connection with stale-data watchdog.
  useEffect(() => {
    mountedRef.current = true;

    function scheduleReconnect() {
      clearTimeout(reconnectRef.current);
      if (!mountedRef.current) return;
      reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    }

    function connect() {
      if (!mountedRef.current) return;
      clearTimeout(reconnectRef.current);

      const current = wsRef.current;
      if (current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      lastMessageRef.current = 0;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        lastMessageRef.current = Date.now();
      };

      ws.onmessage = (e) => {
        lastMessageRef.current = Date.now();
        try {
          const msg = JSON.parse(e.data);
          const d = msg?.data;
          if (!d?.s) return;
          const id = SYM_MAP[d.s.toLowerCase()];
          if (!id) return;
          const price = parseFloat(d.c);
          if (isNaN(price)) return;

          setPrices(prev => ({
            ...prev,
            [id]: {
              price,
              change24h: parseFloat(d.P),
              high24h: parseFloat(d.h),
              low24h: parseFloat(d.l),
              volume24h: parseFloat(d.v),
              tick: prev[id]?.price ? (price > prev[id].price ? 'up' : price < prev[id].price ? 'down' : null) : null,
            },
          }));
        } catch {
          // Ignore malformed messages; the watchdog still tracks socket activity.
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (!mountedRef.current) return;
        setConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
      };
    }

    const reconnectIfNeeded = () => {
      if (!mountedRef.current) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED) connect();
    };

    connect();

    // Browser WebSocket handles protocol ping/pong internally. Detect stale data instead.
    const watchdogInterval = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !lastMessageRef.current) return;
      if (Date.now() - lastMessageRef.current > STALE_AFTER_MS) {
        setConnected(false);
        ws.close();
      }
    }, WATCHDOG_INTERVAL_MS);

    window.addEventListener('online', reconnectIfNeeded);
    window.addEventListener('focus', reconnectIfNeeded);
    document.addEventListener('visibilitychange', reconnectIfNeeded);

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      clearInterval(watchdogInterval);
      window.removeEventListener('online', reconnectIfNeeded);
      window.removeEventListener('focus', reconnectIfNeeded);
      document.removeEventListener('visibilitychange', reconnectIfNeeded);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  if (!prices.USDT) {
    prices.USDT = {
      price: 1,
      change24h: 0,
      high24h: 1,
      low24h: 1,
      volume24h: 0,
      tick: 'same',
    };
  }

  if (!prices.USDC) {
    prices.USDC = {
      price: 1,
      change24h: 0,
      high24h: 1,
      low24h: 1,
      volume24h: 0,
      tick: 'same',
    };
  }

  return { prices, connected, idrRate };
}
