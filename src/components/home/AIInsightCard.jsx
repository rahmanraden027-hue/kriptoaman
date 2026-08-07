import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, RefreshCw } from 'lucide-react';
import Skeleton from './Skeleton';

const FALLBACK = {
  title: 'Pasar stabil, pantau likuiditas',
  body: 'Dominasi BTC dan indeks Fear & Greed menunjukkan sentimen netral. Perhatikan volume 24 jam untuk konfirmasi arah. Selalu kelola risiko dengan stop-loss.',
  sentiment: 'neutral',
  tag: 'Insight Otomatis',
};

export default function AIInsightCard() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: 'Berikan insight singkat (maks 60 kata) tentang kondisi pasar kripto saat ini dalam Bahasa Indonesia. Fokus pada BTC, ETH, dan sentimen umum. Format JSON {title, body, sentiment}.',
        response_json_schema: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' }, sentiment: { type: 'string' } } },
      });
      setInsight({ ...res, tag: 'AI Insight' });
    } catch {
      setInsight(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sentiment = insight?.sentiment || 'neutral';
  const sColor = sentiment === 'bullish' ? 'text-ka-emerald' : sentiment === 'bearish' ? 'text-[#e74c3c]' : 'text-yellow-400';

  return (
    <div className="ka-surface p-4 ka-fade-up relative overflow-hidden" style={{ animationDelay: '360ms' }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-ka-emerald/10 blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between mb-3 relative">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-ka-emerald" /> AI Market Insight
        </h3>
        <button onClick={load} className="ka-muted hover:text-ka-emerald transition tap-reset" aria-label="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading ? (
        <div className="space-y-2 relative"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-14 w-full" /></div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1.5 relative">
            <span className="text-[10px] font-bold ka-chip px-2 py-0.5 text-ka-emerald">{insight?.tag || 'AI Insight'}</span>
            <span className={`text-[10px] font-bold capitalize ${sColor}`}>{sentiment}</span>
          </div>
          <p className="text-white text-sm font-bold mb-1 relative">{insight?.title}</p>
          <p className="ka-muted text-xs leading-relaxed relative">{insight?.body}</p>
        </>
      )}
    </div>
  );
}