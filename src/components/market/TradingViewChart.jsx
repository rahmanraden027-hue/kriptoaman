import React, { useEffect, useRef } from 'react';

/**
 * TradingViewChart — embeds TradingView's Advanced Chart widget for a given
 * trading symbol. Uses the official external-embedding script.
 * Props:
 *   symbol: string  (e.g. 'BTCUSDT') — rendered as BINANCE:{symbol}
 *   height: number  (px, default 420)
 */
export default function TradingViewChart({ symbol = 'BTCUSDT', height = 420 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval: '60',
      timezone: 'Asia/Jakarta',
      theme: 'dark',
      style: '1',
      locale: 'id_ID',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      withdateranges: true,
      backgroundColor: 'rgba(10, 12, 10, 1)',
      gridColor: 'rgba(42, 61, 52, 0.5)',
      support_host: false,
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={ref} style={{ height, width: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}