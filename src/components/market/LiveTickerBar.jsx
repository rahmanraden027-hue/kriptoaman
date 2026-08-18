import React, { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';

const TICKER_ASSETS = [
  { id: 'BTC', symbol: 'BTC/USD', binance: 'btcusdt', color: '#F7931A' },
  { id: 'ETH', symbol: 'ETH/USD', binance: 'ethusdt', color: '#627EEA' },
  { id: 'SOL', symbol: 'SOL/USD', binance: 'solusdt', color: '#9945FF' },
  { id: 'BNB', symbol: 'BNB/USD', binance: 'bnbusdt', color: '#F0B90B' },
  { id: 'XRP', symbol: 'XRP/USD', binance: 'xrpusdt', color: '#00AAE4' },
  { id: 'ADA', symbol: 'ADA/USD', binance: 'adausdt', color: '#0033AD' },
  { id: 'DOGE', symbol: 'DOGE/USD', binance: 'dogeusdt', color: '#C2A633' },
  { id: 'AVAX', symbol: 'AVAX/USD', binance: 'avaxusdt', color: '#E84142' },
  { id: 'DOT', symbol: 'DOT/USD', binance: 'dotusdt', color: '#E6007A' },
  { id: 'MATIC', symbol: 'MATIC/USD', binance: 'maticusdt', color: '#8247E5' },
  { id: 'LINK', symbol: 'LINK/USD', binance: 'linkusdt', color: '#375BD2' },
  { id: 'UNI', symbol: 'UNI/USD', binance: 'uniusdt', color: '#FF007A' },
  { id: 'ATOM', symbol: 'ATOM/USD', binance: 'atomusdt', color: '#6F7390' },
  { id: 'LTC', symbol: 'LTC/USD', binance: 'ltcusdt', color: '#A0A0A0' },
  { id: 'ARB', symbol: 'ARB/USD', binance: 'arbusdt', color: '#28A0F0' },
  { id: 'OP', symbol: 'OP/USD', binance: 'opusdt', color: '#FF0420' },
  { id: 'SUI', symbol: 'SUI/USD', binance: 'suiusdt', color: '#4DA2FF' },
  { id: 'APT', symbol: 'APT/USD', binance: 'aptusdt', color: '#00D4B4' },
  { id: 'NEAR', symbol: 'NEAR/USD', binance: 'nearusdt', color: '#00C08B' },
  { id: 'TRX', symbol: 'TRX/USD', binance: 'trxusdt', color: '#FF0013' },
];

function formatTickerPrice(price) {
  if (!Number.isFinite(price)) return '—';
  if (price >= 10000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 100) return '$' + price.toFixed(2);
  if (price >= 1) return '$' + price.toFixed(3);
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(6);
}

function formatUpdateTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function LiveTickerBar() {
  const [prices, setPrices] = useState(() => {
    const initial = {};
    TICKER_ASSETS.forEach(asset => {
      initial[asset.id] = { price: null, change24h: null, tick: null, updatedAt: null };
    });
    return initial;
  });
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const staleRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    function scheduleReconnect(connect) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = setTimeout(connect, 5000);
    }

    function connect() {
      if (!mountedRef.current) return;

      clearTimeout(reconnectRef.current);
      clearTimeout(staleRef.current);

      const streams = TICKER_ASSETS.map(asset => `${asset.binance}@ticker`).join('/');
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;

      const armStaleWatch = () => {
        clearTimeout(staleRef.current);
        staleRef.current = setTimeout(() => {
          if (mountedRef.current && wsRef.current === ws) ws.close();
        }, 20000);
      };

      ws.onopen = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        setConnected(true);
        armStaleWatch();
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          const data = message?.data;
          if (!data?.s) return;

          const asset = TICKER_ASSETS.find(item => item.binance === data.s.toLowerCase());
          if (!asset) return;

          const price = Number.parseFloat(data.c);
          const change24h = Number.parseFloat(data.P);
          if (!Number.isFinite(price) || !Number.isFinite(change24h)) return;

          const now = Date.now();
          setLastUpdated(now);
          armStaleWatch();
          setPrices(previous => {
            const previousPrice = previous[asset.id]?.price;
            return {
              ...previous,
              [asset.id]: {
                price,
                change24h,
                tick: Number.isFinite(previousPrice)
                  ? price > previousPrice
                    ? 'up'
                    : price < previousPrice
                      ? 'down'
                      : null
                  : null,
                updatedAt: now,
              },
            };
          });
        } catch {
          // Ignore malformed upstream messages. Never synthesize market data.
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        clearTimeout(staleRef.current);
        setConnected(false);
        scheduleReconnect(connect);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      clearTimeout(staleRef.current);
      wsRef.current?.close();
    };
  }, []);

  const items = [...TICKER_ASSETS, ...TICKER_ASSETS];
  const statusText = connected ? 'LIVE' : lastUpdated ? 'SYNC' : 'CONNECT';
  const updateTime = formatUpdateTime(lastUpdated);
  const statusTitle = connected
    ? `Live market data${updateTime ? ` · updated ${updateTime}` : ''}`
    : lastUpdated
      ? `Connection interrupted · last real update ${updateTime}`
      : 'Connecting to live market data';

  return (
    <div className="relative h-8 w-full overflow-hidden border-b border-slate-800/60 bg-slate-950/90">
      <div
        className="absolute left-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5 bg-slate-950/95 pr-2 text-[8px] font-bold tracking-wide"
        title={statusTitle}
        aria-label={statusTitle}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
        <Zap className="h-2.5 w-2.5 text-slate-500" />
        <span className={connected ? 'text-green-300' : 'text-yellow-300'}>{statusText}</span>
        {updateTime && <span className="hidden text-slate-500 sm:inline">{updateTime}</span>}
      </div>

      <div className="ticker-scroll flex h-full items-center gap-6 whitespace-nowrap pl-20 sm:pl-28">
        {items.map((asset, index) => {
          const data = prices[asset.id];
          const hasRealData = Number.isFinite(data?.price) && Number.isFinite(data?.change24h);
          const change = hasRealData ? data.change24h : null;
          const isUp = hasRealData ? change >= 0 : null;

          return (
            <div key={`${asset.id}-${index}`} className="flex shrink-0 items-center gap-1.5 text-xs">
              <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: asset.color }} />
              <span className="font-medium text-slate-400">{asset.symbol}</span>
              <span className={`font-bold transition-colors duration-300 ${
                data?.tick === 'up'
                  ? 'text-green-300'
                  : data?.tick === 'down'
                    ? 'text-red-300'
                    : hasRealData
                      ? 'text-white'
                      : 'text-slate-500'
              }`}>
                {formatTickerPrice(data?.price)}
              </span>
              {hasRealData ? (
                <span className={`text-[10px] font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-slate-600">WAIT</span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .ticker-scroll { animation: ticker-move 60s linear infinite; }
        .ticker-scroll:hover { animation-play-state: paused; }
        @keyframes ticker-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
