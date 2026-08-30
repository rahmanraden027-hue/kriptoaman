import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import Skeleton from './Skeleton';

const WATCHLIST = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];

function buildSnapshot(prices = {}) {
  return WATCHLIST.map(symbol => {
    const item = prices?.[symbol];
    if (!item || !Number.isFinite(Number(item.price))) return null;
    return {
      symbol,
      price: Number(item.price),
      change24h: Number.isFinite(Number(item.change24h)) ? Number(item.change24h) : null,
      high24h: Number.isFinite(Number(item.high24h)) ? Number(item.high24h) : null,
      low24h: Number.isFinite(Number(item.low24h)) ? Number(item.low24h) : null,
      volume24h: Number.isFinite(Number(item.volume24h)) ? Number(item.volume24h) : null,
    };
  }).filter(Boolean);
}

function deterministicInsight(snapshot, language) {
  if (!snapshot.length) {
    return {
      title: language === 'en' ? 'Waiting for verified market data' : 'Menunggu data pasar terverifikasi',
      body: language === 'en'
        ? 'KriptoAman will generate market intelligence after a verified price snapshot is available.'
        : 'KriptoAman akan menghasilkan market intelligence setelah snapshot harga terverifikasi tersedia.',
      sentiment: 'neutral',
      confidence: 'data-pending',
    };
  }

  const changes = snapshot.map(x => x.change24h).filter(Number.isFinite);
  const average = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const positive = changes.filter(v => v > 0).length;
  const negative = changes.filter(v => v < 0).length;
  const sentiment = average > 1 ? 'positive' : average < -1 ? 'negative' : 'neutral';
  const breadth = positive > negative ? 'positive' : negative > positive ? 'negative' : 'mixed';

  return language === 'en'
    ? {
        title: `Market breadth is ${breadth}`,
        body: `${snapshot.length} major assets are in the verified snapshot. Average 24h change is ${average.toFixed(2)}%, with ${positive} advancing and ${negative} declining.`,
        sentiment,
        confidence: 'rules-based',
      }
    : {
        title: `Breadth pasar ${breadth === 'positive' ? 'positif' : breadth === 'negative' ? 'negatif' : 'campuran'}`,
        body: `${snapshot.length} aset utama tersedia dalam snapshot terverifikasi. Rata-rata perubahan 24 jam ${average.toFixed(2)}%, dengan ${positive} menguat dan ${negative} melemah.`,
        sentiment,
        confidence: 'rules-based',
      };
}

export default function AIInsightCard({ prices = {}, language = 'id' }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [sourceMode, setSourceMode] = useState('waiting');

  const snapshot = useMemo(() => buildSnapshot(prices), [prices]);
  const hasMarketData = snapshot.some(item => item.symbol === 'BTC') && snapshot.some(item => item.symbol === 'ETH');

  const load = useCallback(async () => {
    if (!hasMarketData) {
      setInsight(deterministicInsight(snapshot, language));
      setSourceMode('waiting');
      return;
    }

    setLoading(true);
    const fallback = deterministicInsight(snapshot, language);

    try {
      const localeInstruction = language === 'en' ? 'Write in English.' : 'Tulis dalam Bahasa Indonesia.';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are KriptoAman Market Intelligence. Use ONLY the verified JSON market snapshot below. Do not claim access to news, order books, dominance, sentiment indexes, on-chain data, or any information not present in the snapshot. ${localeInstruction} Produce a concise descriptive summary, not investment advice. Never give buy/sell instructions, targets, forecasts, or guaranteed outcomes. Classify sentiment only as positive, neutral, or negative.\n\nVERIFIED_SNAPSHOT=${JSON.stringify(snapshot)}`,
        response_json_schema: {
          type: 'object',
          required: ['title', 'body', 'sentiment'],
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
          },
        },
      });

      setInsight({ ...res, confidence: 'ai-grounded' });
      setSourceMode('ai-grounded');
    } catch {
      setInsight(fallback);
      setSourceMode('rules-based');
    } finally {
      setUpdatedAt(Date.now());
      setLoading(false);
    }
  }, [hasMarketData, language, snapshot]);

  useEffect(() => {
    if (hasMarketData && sourceMode === 'waiting' && !loading) {
      load();
      return;
    }
    if (!hasMarketData && !insight) setInsight(deterministicInsight(snapshot, language));
  }, [hasMarketData, insight, language, load, loading, snapshot, sourceMode]);

  const sentiment = insight?.sentiment || 'neutral';
  const sentimentTone = sentiment === 'positive'
    ? 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10'
    : sentiment === 'negative'
      ? 'text-rose-300 border-rose-400/20 bg-rose-400/10'
      : 'text-amber-200 border-amber-400/20 bg-amber-400/10';

  const copy = language === 'en'
    ? {
        eyebrow: 'AI MARKET INTELLIGENCE',
        title: 'Verified Market Brief',
        refresh: 'Refresh market intelligence',
        grounded: 'Grounded in live snapshot',
        rules: 'Verified fallback',
        waiting: 'Waiting for live data',
        disclaimer: 'Descriptive analytics only · Not investment advice',
      }
    : {
        eyebrow: 'AI MARKET INTELLIGENCE',
        title: 'Verified Market Brief',
        refresh: 'Perbarui market intelligence',
        grounded: 'Berbasis snapshot live',
        rules: 'Fallback terverifikasi',
        waiting: 'Menunggu data live',
        disclaimer: 'Analitik deskriptif · Bukan rekomendasi investasi',
      };

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-sky-400/15 bg-[#07111d]/95 p-4 shadow-[0_24px_70px_-36px_rgba(14,165,233,.75)] ka-fade-up" style={{ animationDelay: '360ms' }}>
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.16em] text-sky-300">
            <Sparkles className="h-3.5 w-3.5" /> {copy.eyebrow}
          </p>
          <h3 className="mt-1 text-sm font-extrabold text-white">{copy.title}</h3>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading || !hasMarketData}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-400 transition hover:border-sky-400/25 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={copy.refresh}
          title={copy.refresh}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="relative mt-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-16 w-full" /></div>
      ) : (
        <div className="relative mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${sentimentTone}`}>{sentiment}</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400">
              {sourceMode === 'ai-grounded' ? <ShieldCheck className="h-3 w-3 text-emerald-300" /> : <Activity className="h-3 w-3 text-sky-300" />}
              {sourceMode === 'ai-grounded' ? copy.grounded : sourceMode === 'rules-based' ? copy.rules : copy.waiting}
            </span>
          </div>

          <p className="mt-3 text-sm font-extrabold leading-5 text-white">{insight?.title}</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">{insight?.body}</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {snapshot.slice(0, 4).map(item => (
              <div key={item.symbol} className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-slate-300">{item.symbol}</span>
                  <span className={`text-[10px] font-bold ${item.change24h > 0 ? 'text-emerald-300' : item.change24h < 0 ? 'text-rose-300' : 'text-slate-400'}`}>
                    {Number.isFinite(item.change24h) ? `${item.change24h >= 0 ? '+' : ''}${item.change24h.toFixed(2)}%` : '—'}
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] font-semibold text-white">${item.price.toLocaleString('en-US', { maximumFractionDigits: item.price >= 1 ? 2 : 6 })}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 border-t border-white/[0.07] pt-2 text-[10px] leading-4 text-slate-500">
            {copy.disclaimer}{updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
