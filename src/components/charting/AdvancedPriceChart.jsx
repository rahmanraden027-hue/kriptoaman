import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { RefreshCw, CandlestickChart, LineChart, TrendingUp, TrendingDown, X } from 'lucide-react';
import { getCurrentMarketPrice, getHistoricalData, getMarketChart } from '../market/marketDataService';

const TIMEFRAMES = [
  { label: '1H', days: 1, storageInterval: '1h' },
  { label: '24H', days: 1, storageInterval: '1h' },
  { label: '7D', days: 7, storageInterval: '1h' },
  { label: '1M', days: 30, storageInterval: '4h' },
  { label: '1Y', days: 365, storageInterval: '1d' },
];

async function fetchOHLC(coinId, timeframe) {
  const rows = await getHistoricalData(coinId, timeframe.days, timeframe.storageInterval);
  return rows.map(row => ({
    time: Math.floor(row.timestamp / 1000),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
  }));
}

async function fetchLine(coinId, timeframe) {
  const rows = await getMarketChart(coinId, timeframe.days, timeframe.storageInterval);
  return rows.map(row => ({ time: Math.floor(row.timestamp / 1000), value: row.price }));
}

async function fetchCurrentPrice(coinId) {
  return getCurrentMarketPrice(coinId);
}

export default function AdvancedPriceChart({ coinId = 'BTC', coinName = 'Bitcoin', onClose }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]); // 7D default
  const [chartType, setChartType] = useState('candlestick'); // 'candlestick' | 'line'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceInfo, setPriceInfo] = useState({ price: null, change24h: null });
  const [crosshairPrice, setCrosshairPrice] = useState(null);

  // Init chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
        horzLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    chart.subscribeCrosshairMove((param) => {
      if (param.point && param.seriesData?.size > 0) {
        const data = [...param.seriesData.values()][0];
        setCrosshairPrice(data?.close ?? data?.value ?? null);
      } else {
        setCrosshairPrice(null);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!chartRef.current) return;
    setLoading(true);
    setError(null);

    // Remove old series
    if (seriesRef.current) {
      try { chartRef.current.removeSeries(seriesRef.current); } catch {}
      seriesRef.current = null;
    }

    try {
      const [priceData] = await Promise.all([fetchCurrentPrice(coinId)]);
      setPriceInfo(priceData);

      if (chartType === 'candlestick') {
        const ohlcData = await fetchOHLC(coinId, timeframe);
        const series = chartRef.current.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        });
        series.setData(ohlcData);
        seriesRef.current = series;
      } else {
        const lineData = await fetchLine(coinId, timeframe);
        const isUp = (priceData.change24h || 0) >= 0;
        const series = chartRef.current.addAreaSeries({
          lineColor: isUp ? '#22c55e' : '#ef4444',
          topColor: isUp ? '#22c55e33' : '#ef444433',
          bottomColor: 'transparent',
          lineWidth: 2,
          priceLineVisible: true,
        });
        series.setData(lineData);
        seriesRef.current = series;
      }

      chartRef.current.timeScale().fitContent();
    } catch (e) {
      setError('Gagal memuat data chart');
    } finally {
      setLoading(false);
    }
  }, [coinId, timeframe, chartType]);

  useEffect(() => { loadData(); }, [loadData]);

  const isUp = (priceInfo.change24h || 0) >= 0;
  const displayPrice = crosshairPrice ?? priceInfo.price;

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base">{coinId}/USDT</span>
              <span className="text-slate-400 text-xs">{coinName}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {displayPrice != null && (
                <span className="text-white text-lg font-black">
                  ${displayPrice >= 1 ? displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : displayPrice.toFixed(6)}
                </span>
              )}
              {priceInfo.change24h != null && (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isUp ? '+' : ''}{priceInfo.change24h.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80">
        {/* Timeframes */}
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              onClick={() => setTimeframe(tf)}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                timeframe.label === tf.label
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart type toggle */}
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
          <button
            onClick={() => setChartType('candlestick')}
            className={`p-1.5 rounded-md transition-all ${chartType === 'candlestick' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            title="Candlestick"
          >
            <CandlestickChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            title="Line"
          >
            <LineChart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height: 320 }}>
        <div ref={chartContainerRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 z-10">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between">
        <span className="text-slate-600 text-[10px]">Scroll/pinch untuk zoom · Drag untuk pan</span>
        <span className="text-slate-600 text-[10px]">Data: KriptoAman persisted history</span>
      </div>
    </div>
  );
}