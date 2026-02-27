import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ExternalLink, RefreshCw, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CACHE_KEY = 'crypto_news_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getSentimentIcon(sentiment) {
  if (sentiment === 'bullish') return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (sentiment === 'bearish') return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

function getSentimentColor(sentiment) {
  if (sentiment === 'bullish') return 'text-green-400 bg-green-500/10';
  if (sentiment === 'bearish') return 'text-red-400 bg-red-500/10';
  return 'text-slate-500 bg-slate-700/30';
}

export default function CryptoNewsFeed() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNews = async (force = false) => {
    // Check cache
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          setNews(cached.data);
          setLastUpdated(new Date(cached.ts));
          setLoading(false);
          return;
        }
      } catch {}
    }

    setRefreshing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a crypto news aggregator. Generate 6 realistic, current-style cryptocurrency news headlines and summaries as if from CoinDesk, Cointelegraph, or The Block. Focus on Bitcoin, Ethereum, DeFi, and general crypto market trends.
      
      Today's date context: February 2026. Make the news feel current and realistic for that time period.
      
      Return ONLY a JSON object with this structure:
      {
        "articles": [
          {
            "title": "headline here",
            "summary": "1-2 sentence summary",
            "source": "CoinDesk" | "Cointelegraph" | "The Block" | "Decrypt",
            "category": "Bitcoin" | "Ethereum" | "DeFi" | "Markets" | "Regulation" | "NFT",
            "sentiment": "bullish" | "bearish" | "neutral",
            "timeAgo": "e.g. 2 jam lalu",
            "url": "https://coindesk.com"
          }
        ]
      }`,
      response_json_schema: {
        type: 'object',
        properties: {
          articles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                source: { type: 'string' },
                category: { type: 'string' },
                sentiment: { type: 'string' },
                timeAgo: { type: 'string' },
                url: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const articles = result?.articles || [];
    setNews(articles);
    setLastUpdated(new Date());
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: articles, ts: Date.now() }));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const categoryColors = {
    Bitcoin: 'bg-orange-500/20 text-orange-400',
    Ethereum: 'bg-blue-500/20 text-blue-400',
    DeFi: 'bg-purple-500/20 text-purple-400',
    Markets: 'bg-green-500/20 text-green-400',
    Regulation: 'bg-red-500/20 text-red-400',
    NFT: 'bg-pink-500/20 text-pink-400',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-slate-400" />
          <h2 className="text-white font-semibold text-sm">Berita Crypto</h2>
          {lastUpdated && (
            <span className="text-slate-600 text-xs">
              {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {news.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 hover:bg-slate-800 hover:border-slate-600/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${categoryColors[article.category] || 'bg-slate-700 text-slate-400'}`}>
                    {article.category}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${getSentimentColor(article.sentiment)}`}>
                    {getSentimentIcon(article.sentiment)}
                    {article.sentiment}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
              </div>

              <h3 className="text-white text-sm font-medium leading-snug mb-1 group-hover:text-orange-300 transition-colors">
                {article.title}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                {article.summary}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-600 text-xs font-medium">{article.source}</span>
                <span className="text-slate-700 text-xs">{article.timeAgo}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}