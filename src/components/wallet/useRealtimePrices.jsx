/**
 * useRealtimePrices — real-time price hook via Binance WebSocket
 * Subscribes to all supported coins and returns a price map:
 * { BTC: { price, change24h }, ETH: { ... }, ... }
 *
 * Falls back to CoinGecko REST once on mount for initial values,
 * then Binance streams keep prices up-to-date.
 */
import { useState, useEffect, useRef } from 'react';
import { getPrices } from './multiCoinApi';

// Binance symbol -> internal coin ID
const BINANCE_SYMBOL_MAP = {
  btcusdt:  'BTC',
  ethusdt:  'ETH',
  bnbusdt:  'BNB',
  solusdt:  'SOL',
  dogeusdt: 'DOGE',
  maticusdt:'MATIC',
  ltcusdt:  'LTC',
  avaxusdt: 'AVAX',
  ftmusdt:  'FTM',
  arbusdt:  'ARB',
  opusdt:   'OP',
};

// Coins that use another coin's price (L2s)
const PRICE_ALIASES = { BASE: 'ETH' };

const STREAMS = Object.keys(BINANCE_SYMBOL_MAP).map(s => `${s}@ticker`).join('/');
const WS_URL = `wss://stream.binance.com:9443/stream?streams=${STREAMS}`;

export default function useRealtimePrices() {
  const [prices, setPrices] = useState({});
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

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (!msg?.data) return;
          const d = msg.data;
          const symbol = d.s?.toLowerCase();
          const coinId = BINANCE_SYMBOL_MAP[symbol];
          if (!coinId) return;

          const price = parseFloat(d.c);      // last price
          const change24h = parseFloat(d.P);  // price change %

          if (isNaN(price)) return;

          setPrices(prev => {
            const next = { ...prev, [coinId]: { price, change24h } };
            // Propagate aliases (e.g. BASE uses ETH price)
            Object.entries(PRICE_ALIASES).forEach(([id, src]) => {
              if (next[src]) next[id] = next[src];
            });
            return next;
          });
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          // Reconnect after 5s
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

  return prices;
}