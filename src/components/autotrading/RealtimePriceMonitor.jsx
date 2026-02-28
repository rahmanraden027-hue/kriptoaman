import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export default function RealtimePriceMonitor({ pair, assetClass, onPriceUpdate }) {
  const [price, setPrice] = useState(null);
  const [bid, setBid] = useState(null);
  const [ask, setAsk] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);
  const [volume24h, setVolume24h] = useState(null);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState([]);
  const [high24h, setHigh24h] = useState(null);
  const [low24h, setLow24h] = useState(null);

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
          setVolume24h(message.volume24h || message.volume);
          setHigh24h(message.high24h || message.high);
          setLow24h(message.low24h || message.low);

          if (lastPrice) {
            const change = ((currentPrice - lastPrice) / lastPrice) * 100;
            setPriceChange(change);
          }
          setLastPrice(currentPrice);
          setLoading(false);

          if (onPriceUpdate) {
            onPriceUpdate(currentPrice);
          }
        } else if (message.type === 'orderBook') {
          setOrderBook({
            bids: message.bids || [],
            asks: message.asks || []
          });
        } else if (message.type === 'recentTrades') {
          setRecentTrades((message.trades || []).slice(0, 5));
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
    <div className="space-y-4">
      {/* Main Price Section */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
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
          <div className="text-right space-y-2">
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

        {/* 24h Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/40">
          <div className="text-center">
            <p className="text-slate-500 text-xs mb-1">24h High</p>
            <p className="text-white font-semibold">${high24h?.toFixed(2) || 'N/A'}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs mb-1">24h Volume</p>
            <p className="text-white font-semibold">${(volume24h || 0).toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs mb-1">24h Low</p>
            <p className="text-white font-semibold">${low24h?.toFixed(2) || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/40 text-xs text-slate-400">
          <p>Pair: {pair} | Asset: {assetClass}</p>
          <p>Updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Order Book & Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order Book */}
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Order Book</h3>
          </div>
          
          {orderBook.asks.length > 0 ? (
            <div className="space-y-3">
              {/* Asks (Sellers) */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Asks (Selling)</p>
                <div className="space-y-1">
                  {orderBook.asks.slice(0, 3).map((ask, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-red-400">${ask.price?.toFixed(2) || 'N/A'}</span>
                      <span className="text-slate-400">{ask.quantity?.toFixed(4) || '0'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-700/40 pt-2" />

              {/* Bids (Buyers) */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Bids (Buying)</p>
                <div className="space-y-1">
                  {orderBook.bids.slice(0, 3).map((bid, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-green-400">${bid.price?.toFixed(2) || 'N/A'}</span>
                      <span className="text-slate-400">{bid.quantity?.toFixed(4) || '0'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No order book data</p>
          )}
        </div>

        {/* Recent Trades */}
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Recent Trades</h3>
          
          {recentTrades.length > 0 ? (
            <div className="space-y-2">
              {recentTrades.map((trade, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-700/40 pb-2">
                  <div>
                    <p className={`font-semibold ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.side === 'buy' ? '▲' : '▼'} ${trade.price?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-slate-500 text-xs">{trade.quantity?.toFixed(4) || '0'}</p>
                  </div>
                  <span className="text-slate-500 text-xs">
                    {trade.time ? new Date(trade.time).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No recent trades</p>
          )}
        </div>
      </div>
    </div>
  );
}