/**
 * useRealtimePrices — real-time price hook via Binance WebSocket + CoinGecko fallback
 * Returns: { BTC: { price, change24h }, ETH: { ... }, ... }
 */
import { useState, useEffect, useRef } from 'react';
import { getPrices } from './multiCoinApi';

// Binance symbol -> internal coin ID
const BINANCE_SYMBOL_MAP = {
  btcusdt:   'BTC',
  ethusdt:   'ETH',
  bnbusdt:   'BNB',
  solusdt:   'SOL',
  dogeusdt:  'DOGE',
  maticusdt: 'MATIC',
  ltcusdt:   'LTC',
  avaxusdt:  'AVAX',
  ftmusdt:   'FTM',
  arbusdt:   'ARB_TOKEN',
  opusdt:    'OP_TOKEN',
  xrpusdt:   'XRP',
  adausdt:   'ADA',
  dotusdt:   'DOT',
  trxusdt:   'TRX',
  atomusdt:  'ATOM',
  linkusdt:  'LINK',
  uniusdt:   'UNI',
  nearusdt:  'NEAR',
  aptusdt:   'APT',
  suiusdt:   'SUI',
};

// Coins that use another coin's price (L2s)
const PRICE_ALIASES = { BASE: 'ETH', ARB: 'ARB_TOKEN', OP: 'OP_TOKEN' };

const STREAMS = Object.keys(BINANCE_SYMBOL_MAP).map(s => `${s}@ticker`).join('/');
const WS_URL = `wss://stream.binance.com:9443/stream?streams=${STREAMS}`;

export default function useRealtimePrices() {
  const [prices, setPrices] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  // Initial load from CoinGecko (REST)
  useEffect(() => {
    getPrices().then(initial => {
      if (mountedRef.current) setPrices(initial);
    });
    return () => { mountedRef.current = false; };
  }, []);

  // WebSocket stream from Binance
  useEffect(() => {
    function connect() {
      if (!mountedRef.current) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => { if (mountedRef.current) setWsConnected(true); };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (!msg?.data) return;
          const d = msg.data;
          const symbol = d.s?.toLowerCase();
          const coinId = BINANCE_SYMBOL_MAP[symbol];
          if (!coinId) return;
          const price = parseFloat(d.c);
          const change24h = parseFloat(d.P);
          if (isNaN(price)) return;
          setPrices(prev => {
            const prevPrice = prev[coinId]?.price;
            const next = {
              ...prev,
              [coinId]: {
                price,
                change24h,
                tick: prevPrice ? (price > prevPrice ? 'up' : price < prevPrice ? 'down' : null) : null,
                high24h: parseFloat(d.h),
                low24h: parseFloat(d.l),
                volume24h: parseFloat(d.v),
              },
            };
            // Propagate aliases
            Object.entries(PRICE_ALIASES).forEach(([id, src]) => {
              if (next[src]) next[id] = { ...next[src] };
            });
            return next;
          });
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          setWsConnected(false);
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return { prices, wsConnected };
}