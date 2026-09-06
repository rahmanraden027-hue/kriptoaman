import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { RefreshCw, CandlestickChart, LineChart, TrendingUp, TrendingDown, X } from 'lucide-react';
import { getHistoricalSeries } from '@/components/market/marketDataService';
import { getReadOnlyMarketPrices } from '@/lib/readOnlyMarketPrices';

const TIMEFRAMES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const mapCandles = (candles) => candles.map((candle) => ({
  time: Math.floor(Number(candle.openTime) / 1000),
  open: Number(candle.open),
  high: Number(candle.high),
  low: Number(candle.low),
  close: Number(candle.close),
})).filter((row) =>
  Number.isFinite(row.time) &&
  Number.isFinite(row.open) &&
  Number.isFinite(row.high) &&
  Number.isFinite(row.low) &&
  Number.isFinite(row.close),
);

const mapLine = (candles) => candles.map((candle) => ({
  time: Math.floor(Number(candle.openTime) / 1000),
  value: Number(candle.close),
})).filter((row) => Number.isFinite(row.time) && Number.isFinite(row.value));

export default function AdvancedPriceChart({ coinId = 'BTC', coinName = 'Bitcoin', onClose }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [chartType, setChartType] = useState('candlestick');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceInfo, setPriceInfo] = useState({ price: null, change24h: null, freshness: null, capturedAt: null });
  const [historyInfo, setHistoryInfo] = useState({ source: null, cached: false, gaps: 0, capturedAt: null });
  const [crosshairPrice, setCrosshairPrice] = useState(null);

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
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
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

    if (seriesRef.current) {
      try { chartRef.current.removeSeries(seriesRef.current); } catch {}
      seriesRef.current = null;
    }

    try {
      const symbol = String(coinId || '').toUpperCase();
      const [history, marketPrices] = await Promise.all([
        getHistoricalSeries(symbol, timeframe.days),
        getReadOnlyMarketPrices(),
      ]);

      const current = marketPrices?.[symbol] || null;
      setPriceInfo({
        price: Number.isFinite(Number(current?.price)) ? Number(current.price) : null,
        change24h: Number.isFinite(Number(current?.change24h)) ? Number(current.change24h) : null,
        freshness: current?.freshness || null,
        capturedAt: Number(current?.capturedAt) || null,
      });

      const candles = Array.isArray(history?.candles) ? history.candles : [];
      setHistoryInfo({
        source: history?.source || null,
        cached: Boolean(history?.cached),
        gaps: Array.isArray(history?.gaps) ? history.gaps.length : 0,
        capturedAt: Number(history?.capturedAt) || null,
      });

      if (candles.length < 2) {
        throw new Error('Riwayat tersimpan belum tersedia untuk aset/periode ini');
      }

      if (chartType === 'candlestick') {
        const ohlcData = mapCandles(candles);
        if (ohlcData.length < 2) throw new Error('Data candlestick tersimpan belum mencukupi');
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
        const lineData = mapLine(candles);
        if (lineData.length < 2) throw new Error('Data line tersimpan belum mencukupi');
        const referenceChange = Number(current?.change24h);
        const isUp = Number.isFinite(referenceChange)
          ? referenceChange >= 0
          : lineData[lineData.length - 1].value >= lineData[0].value;
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
      setError(e?.message || 'Riwayat chart belum tersedia');
    } finally {
      setLoading(false);
    }
  }, [coinId, timeframe, chartType]);

  useEffect(() => { loadData(); }, [loadData]);

  const isUp = (priceInfo.change24h || 0) >= 0;
  const displayPrice = crosshairPrice ?? priceInfo.price;
  const priceIsArchived = priceInfo.freshness === 'archived' || priceInfo.freshness === 'stale';
  const historyIsCached = historyInfo.cached || historyInfo.source === 'browser-last-known-good';

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base">{coinId}/USD</span>
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
              {priceIsArchived && <span className="text-[9px] text-amber-300">harga snapshot</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" aria-label="Refresh chart">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" aria-label="Close chart">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80">
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              onClick={() => setTimeframe(tf)}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                timeframe.label === tf.label ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

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

      {(historyIsCached || historyInfo.gaps > 0) && (
        <div className="px-4 py-2 text-[10px] text-amber-300 bg-amber-500/5 border-t border-amber-500/10" role="status">
          {historyIsCached ? 'Menampilkan riwayat terakhir yang tersimpan.' : 'Riwayat tersedia sebagian.'}
          {historyInfo.gaps > 0 ? ` ${historyInfo.gaps} rentang data tidak tersedia dan tidak diisi secara sintetis.` : ''}
        </div>
      )}

      <div className="relative" style={{ height: 320 }}>
        <div ref={chartContainerRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 z-10">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-amber-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between gap-3">
        <span className="text-slate-600 text-[10px]">Scroll/pinch untuk zoom · Drag untuk pan</span>
        <span className="text-slate-600 text-[10px] text-right">Data historis: KriptoAman persisted store · tidak untuk eksekusi transaksi</span>
      </div>
    </div>
  );
}
