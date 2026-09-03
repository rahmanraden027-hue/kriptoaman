import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import {
  buildIntelligenceMetrics,
  buildIntelligenceSnapshot,
  deterministicIntelligence,
} from '@/lib/aiIntelligence';
import Skeleton from './Skeleton';

const AI_CACHE_KEY = 'ka_ai_market_intelligence_v3';
const AI_CACHE_TTL_MS = 5 * 60 * 1000;
const NETWORK_CONTEXT_TTL_MS = 60 * 1000;

function snapshotFingerprint(snapshot, language, networkContext) {
  return JSON.stringify({
    language,
    network: networkContext?.verified
      ? [networkContext.online, networkContext.total, networkContext.kamOperational]
      : null,
    values: snapshot.map((item) => [
      item.symbol,
      Math.round(item.price * 10000) / 10000,
      Number.isFinite(item.change24h) ? Math.round(item.change24h * 100) / 100 : null,
    ]),
  });
}

function readAICache(fingerprint) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(AI_CACHE_KEY) || 'null');
    if (!cached?.savedAt || cached.fingerprint !== fingerprint || !cached.insight) return null;
    if (Date.now() - Number(cached.savedAt) > AI_CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeAICache(fingerprint, insight) {
  try {
    sessionStorage.setItem(AI_CACHE_KEY, JSON.stringify({
      fingerprint,
      savedAt: Date.now(),
      insight,
    }));
  } catch {
    // Storage restrictions must never block market intelligence.
  }
}

export default function AIInsightCard({ prices = {}, language = 'id' }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [sourceMode, setSourceMode] = useState('waiting');
  const [networkContext, setNetworkContext] = useState(null);

  const snapshot = useMemo(() => buildIntelligenceSnapshot(prices), [prices]);
  const metrics = useMemo(() => buildIntelligenceMetrics(snapshot), [snapshot]);
  const hasMarketData = snapshot.some((item) => item.symbol === 'BTC') && snapshot.some((item) => item.symbol === 'ETH');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadNetworkContext() {
      try {
        const [networkResponse, kamResponse] = await Promise.all([
          fetch('/api/network-health', { signal: controller.signal, headers: { Accept: 'application/json' } }),
          fetch('/api/kam/network-status', { signal: controller.signal, headers: { Accept: 'application/json' } }),
        ]);
        if (!networkResponse.ok || !kamResponse.ok) return;
        const [network, kam] = await Promise.all([networkResponse.json(), kamResponse.json()]);
        if (!active) return;
        const online = Number(network?.summary?.online || 0);
        const total = Number(network?.summary?.total || 0);
        setNetworkContext({
          verified: total > 0 && online >= Number(network?.summary?.minimum_active_target || 12),
          online,
          total,
          kamOperational: kam?.live === true && kam?.verified === true && Number(kam?.chainId) === 22028,
          checkedAt: Date.now(),
        });
      } catch {
        // Network context is optional. Market intelligence must keep working without it.
      }
    }

    loadNetworkContext();
    const timer = setInterval(loadNetworkContext, NETWORK_CONTEXT_TTL_MS);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  const load = useCallback(async ({ force = false } = {}) => {
    if (!hasMarketData) {
      setInsight(deterministicIntelligence(snapshot, language, networkContext));
      setSourceMode('waiting');
      return;
    }

    const fingerprint = snapshotFingerprint(snapshot, language, networkContext);
    if (!force) {
      const cached = readAICache(fingerprint);
      if (cached) {
        setInsight(cached.insight);
        setSourceMode('ai-cache');
        setUpdatedAt(Number(cached.savedAt));
        return;
      }
    }

    setLoading(true);
    const fallback = deterministicIntelligence(snapshot, language, networkContext);

    try {
      const localeInstruction = language === 'en' ? 'Write in English.' : 'Tulis dalam Bahasa Indonesia.';
      const verifiedMetrics = buildIntelligenceMetrics(snapshot);
      const verifiedNetwork = networkContext?.verified
        ? {
            online: networkContext.online,
            total: networkContext.total,
            kamOperational: networkContext.kamOperational,
          }
        : null;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are KriptoAman AI Intelligence. Use ONLY the verified JSON market snapshot, deterministic metrics, and optional verified network context below. Do not claim access to news, order books, dominance, sentiment indexes, forecasts, historical correlation, or information not supplied. ${localeInstruction} Produce concise descriptive intelligence, not investment advice. Never give buy/sell instructions, price targets, guaranteed outcomes, or personalized financial advice. Explain breadth, momentum, dispersion, risk band, anomaly flags and verified network health factually. Correlation must be described as unavailable when time-series history is not supplied.\n\nVERIFIED_SNAPSHOT=${JSON.stringify(snapshot)}\nVERIFIED_METRICS=${JSON.stringify(verifiedMetrics)}\nVERIFIED_NETWORK=${JSON.stringify(verifiedNetwork)}`,
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

      const grounded = {
        ...res,
        confidence: 'ai-grounded',
        metrics: verifiedMetrics,
        network: verifiedNetwork,
      };
      setInsight(grounded);
      setSourceMode('ai-grounded');
      writeAICache(fingerprint, grounded);
    } catch {
      setInsight(fallback);
      setSourceMode('rules-based');
    } finally {
      setUpdatedAt(Date.now());
      setLoading(false);
    }
  }, [hasMarketData, language, networkContext, snapshot]);

  useEffect(() => {
    if (hasMarketData && sourceMode === 'waiting' && !loading) {
      load();
      return;
    }
    if (!hasMarketData && !insight) setInsight(deterministicIntelligence(snapshot, language, networkContext));
  }, [hasMarketData, insight, language, load, loading, networkContext, snapshot, sourceMode]);

  const sentiment = insight?.sentiment || 'neutral';
  const sentimentTone = sentiment === 'positive'
    ? 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10'
    : sentiment === 'negative'
      ? 'text-rose-300 border-rose-400/20 bg-rose-400/10'
      : 'text-amber-200 border-amber-400/20 bg-amber-400/10';

  const copy = language === 'en'
    ? {
        eyebrow: 'KRIPTOAMAN AI INTELLIGENCE',
        title: 'Verified Market & Network Intelligence',
        refresh: 'Refresh intelligence',
        grounded: 'AI grounded in verified data',
        cached: 'Verified AI cache',
        rules: 'Verified deterministic fallback',
        waiting: 'Waiting for live data',
        breadth: 'Advancing',
        dispersion: 'Dispersion',
        risk: 'Risk radar',
        network: 'Networks',
        disclaimer: 'Descriptive analytics only · Not investment advice',
      }
    : {
        eyebrow: 'KRIPTOAMAN AI INTELLIGENCE',
        title: 'Verified Market & Network Intelligence',
        refresh: 'Perbarui intelligence',
        grounded: 'AI berbasis data terverifikasi',
        cached: 'Cache AI terverifikasi',
        rules: 'Fallback deterministik terverifikasi',
        waiting: 'Menunggu data live',
        breadth: 'Menguat',
        dispersion: 'Dispersi',
        risk: 'Risk radar',
        network: 'Jaringan',
        disclaimer: 'Analitik deskriptif · Bukan rekomendasi investasi',
      };

  const sourceLabel = sourceMode === 'ai-grounded'
    ? copy.grounded
    : sourceMode === 'ai-cache'
      ? copy.cached
      : sourceMode === 'rules-based'
        ? copy.rules
        : copy.waiting;

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
          onClick={() => load({ force: true })}
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
              {sourceMode === 'ai-grounded' || sourceMode === 'ai-cache' ? <ShieldCheck className="h-3 w-3 text-emerald-300" /> : <Activity className="h-3 w-3 text-sky-300" />}
              {sourceLabel}
            </span>
          </div>

          <p className="mt-3 text-sm font-extrabold leading-5 text-white">{insight?.title}</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">{insight?.body}</p>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
              <p className="text-[9px] font-bold text-slate-500">{copy.breadth}</p>
              <p className="mt-1 text-[11px] font-extrabold text-white">{metrics.positive}/{snapshot.length || 0}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
              <p className="text-[9px] font-bold text-slate-500">{copy.dispersion}</p>
              <p className="mt-1 text-[11px] font-extrabold text-white">{metrics.dispersion.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
              <p className="text-[9px] font-bold text-slate-500">{copy.risk}</p>
              <p className="mt-1 text-[11px] font-extrabold text-white">{metrics.riskScore}/100</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
              <p className="text-[9px] font-bold text-slate-500">{copy.network}</p>
              <p className="mt-1 text-[11px] font-extrabold text-white">{networkContext?.verified ? `${networkContext.online}/${networkContext.total}` : '—'}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {snapshot.slice(0, 4).map((item) => (
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
