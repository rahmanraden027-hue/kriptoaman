import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

// All assets to display in the ticker
const TICKER_ASSETS = [
  { id: 'BTC',  symbol: 'BTC/USD',  binance: 'btcusdt',  color: '#F7931A' },
  { id: 'ETH',  symbol: 'ETH/USD',  binance: 'ethusdt',  color: '#627EEA' },
  { id: 'SOL',  symbol: 'SOL/USD',  binance: 'solusdt',  color: '#9945FF' },
  { id: 'BNB',  symbol: 'BNB/USD',  binance: 'bnbusdt',  color: '#F0B90B' },
  { id: 'XRP',  symbol: 'XRP/USD',  binance: 'xrpusdt',  color: '#00AAE4' },
  { id: 'ADA',  symbol: 'ADA/USD',  binance: 'adausdt',  color: '#0033AD' },
  { id: 'DOGE', symbol: 'DOGE/USD', binance: 'dogeusdt', color: '#C2A633' },
  { id: 'AVAX', symbol: 'AVAX/USD', binance: 'avaxusdt', color: '#E84142' },
  { id: 'DOT',  symbol: 'DOT/USD',  binance: 'dotusdt',  color: '#E6007A' },
  { id: 'MATIC',symbol: 'MATIC/USD',binance: 'maticusdt',color: '#8247E5' },
  { id: 'LINK', symbol: 'LINK/USD', binance: 'linkusdt', color: '#375BD2' },
  { id: 'UNI',  symbol: 'UNI/USD',  binance: 'uniusdt',  color: '#FF007A' },
  { id: 'ATOM', symbol: 'ATOM/USD', binance: 'atomusdt', color: '#6F7390' },
  { id: 'LTC',  symbol: 'LTC/USD',  binance: 'ltcusdt',  color: '#A0A0A0' },
  { id: 'ARB',  symbol: 'ARB/USD',  binance: 'arbusdt',  color: '#28A0F0' },
  { id: 'OP',   symbol: 'OP/USD',   binance: 'opusdt',   color: '#FF0420' },
  { id: 'SUI',  symbol: 'SUI/USD',  binance: 'suiusdt',  color: '#4DA2FF' },
  { id: 'APT',  symbol: 'APT/USD',  binance: 'aptusdt',  color: '#00D4B4' },
  { id: 'NEAR', symbol: 'NEAR/USD', binance: 'nearusdt', color: '#00C08B' },
  { id: 'TRX',  symbol: 'TRX/USD',  binance: 'trxusdt',  color: '#FF0013' },
];

// Base prices for initial display before WS connects
const BASE_PRICES = {
  BTC: 95200, ETH: 3420, SOL: 172, BNB: 582, XRP: 0.57, ADA: 0.48,
  DOGE: 0.124, AVAX: 38.5, DOT: 7.8, MATIC: 0.46, LINK: 14.8,
  UNI: 8.4, ATOM: 8.9, LTC: 86, ARB: 1.12, OP: 1.85,
  SUI: 3.8, APT: 12.5, NEAR: 5.2, TRX: 0.124,
};

function formatTickerPrice(price) {
  if (!price) return '—';
  if (price >= 10000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 100) return '$' + price.toFixed(2);
  if (price >= 1) return '$' + price.toFixed(3);
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(6);
}

export default function LiveTickerBar() {
  const [prices, setPrices] = useState(() => {
    const init = {};
    TICKER_ASSETS.forEach(a => {
      init[a.id] = { price: BASE_PRICES[a.id] || 1, change24h: (Math.random() - 0.45) * 6, tick: null };
    });
    return init;
  });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;
      const streams = TICKER_ASSETS.map(a => `${a.binance}@ticker`).join('/');
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;

      ws.onopen = () => { if (mountedRef.current) setConnected(true); };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const d = msg?.data;
          if (!d?.s) return;
          const asset = TICKER_ASSETS.find(a => a.binance === d.s.toLowerCase());
          if (!asset) return;
          const price = parseFloat(d.c);
          const change24h = parseFloat(d.P);
          if (isNaN(price)) return;
          setPrices(prev => {
            const prevPrice = prev[asset.id]?.price;
            return {
              ...prev,
              [asset.id]: {
                price,
                change24h,
                tick: prevPrice ? (price > prevPrice ? 'up' : price < prevPrice ? 'down' : null) : null,
              },
            };
          });
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          setConnected(false);
          reconnectRef.current = setTimeout(connect, 5000);
        }
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  // Fallback: simulate price updates if WS fails
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        TICKER_ASSETS.forEach(a => {
          const cur = prev[a.id]?.price || BASE_PRICES[a.id] || 1;
          const delta = (Math.random() - 0.5) * 0.004;
          const newPrice = cur * (1 + delta);
          next[a.id] = {
            price: newPrice,
            change24h: (prev[a.id]?.change24h || 0) + (Math.random() - 0.5) * 0.05,
            tick: delta > 0 ? 'up' : 'down',
          };
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [connected]);

  // Duplicate ticker items for seamless scroll
  const items = [...TICKER_ASSETS, ...TICKER_ASSETS];

  return (
    <div className="w-full bg-slate-950/90 border-b border-slate-800/60 overflow-hidden relative" style={{ height: 32 }}>
      {/* Status dot */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 bg-slate-950/90 pr-2">
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
        <Zap className="w-2.5 h-2.5 text-slate-500" />
      </div>

      {/* Scrolling ticker */}
      <div className="ticker-scroll flex items-center gap-6 pl-10 h-full whitespace-nowrap">
        {items.map((asset, idx) => {
          const data = prices[asset.id];
          const change = data?.change24h || 0;
          const isUp = change >= 0;
          return (
            <div key={idx} className="flex items-center gap-1.5 shrink-0 text-xs">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: asset.color }} />
              <span className="text-slate-400 font-medium">{asset.symbol}</span>
              <span className={`font-bold transition-colors duration-300 ${
                data?.tick === 'up' ? 'text-green-300' : data?.tick === 'down' ? 'text-red-300' : 'text-white'
              }`}>
                {formatTickerPrice(data?.price)}
              </span>
              <span className={`text-[10px] font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        .ticker-scroll {
          animation: ticker-move 60s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-move {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}