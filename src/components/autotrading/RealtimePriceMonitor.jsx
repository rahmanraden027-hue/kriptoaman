import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export default function RealtimePriceMonitor({ pair, assetClass, onPriceUpdate }) {
  const [price, setPrice] = useState(null);
  const [bid, setBid] = useState(null);
  const [ask, setAsk] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    // Establish WebSocket connection
    const wsUrl = window.location.protocol === 'https:' 
      ? `wss://${window.location.host}/functions/twelveDataWebSocket`
      : `ws://${window.location.host}/functions/twelveDataWebSocket`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to price feed');
      socket.send(JSON.stringify({
        action: 'subscribe',
        symbol: pair
      }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'priceUpdate') {
          const currentPrice = message.price || message.bid || 0;
          setPrice(currentPrice);
          setBid(message.bid);
          setAsk(message.ask);

          if (lastPrice) {
            const change = ((currentPrice - lastPrice) / lastPrice) * 100;
            setPriceChange(change);
          }
          setLastPrice(currentPrice);
          setLoading(false);

          if (onPriceUpdate) {
            onPriceUpdate(currentPrice);
          }
        }
      } catch (error) {
        console.error('Price update error:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLoading(false);
    };

    socket.onclose = () => {
      console.log('Price feed disconnected');
    };

    setWs(socket);

    return () => {
      if (socket) {
        socket.send(JSON.stringify({
          action: 'unsubscribe',
          symbol: pair
        }));
        socket.close();
      }
    };
  }, [pair, onPriceUpdate, lastPrice]);

  if (loading) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">Live Price</p>
          <div className="flex items-end gap-3 mt-2">
            <p className="text-4xl font-bold text-white">${price?.toFixed(2)}</p>
            <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg font-semibold">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="space-y-2">
            {bid !== null && (
              <div>
                <p className="text-slate-400 text-xs">Bid</p>
                <p className="text-green-400 font-semibold">${bid.toFixed(2)}</p>
              </div>
            )}
            {ask !== null && (
              <div>
                <p className="text-slate-400 text-xs">Ask</p>
                <p className="text-red-400 font-semibold">${ask.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/40 text-xs text-slate-400">
        <p>Pair: {pair} | Asset: {assetClass}</p>
        <p>Updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}