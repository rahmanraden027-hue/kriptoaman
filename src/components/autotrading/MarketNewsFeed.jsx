import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarketNewsFeed({ pair, symbol }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Find and summarize the 5 most recent market news articles relevant to ${symbol} and the ${pair} trading pair. 
        Include news about: price movements, technical analysis, market sentiment, regulatory updates, and major events affecting ${symbol}.
        Return as JSON array with objects: { title: string, summary: string, sentiment: "bullish|bearish|neutral", relevance: "high|medium|low", timestamp: "YYYY-MM-DD HH:mm" }`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                  relevance: { type: "string", enum: ["high", "medium", "low"] },
                  timestamp: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response.articles) {
        setNews(response.articles);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError('Failed to fetch market news');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [pair, symbol]);

  const sentimentColor = {
    bullish: 'text-green-400',
    bearish: 'text-red-400',
    neutral: 'text-slate-400'
  };

  const relevanceColor = {
    high: 'bg-red-500/20 text-red-300',
    medium: 'bg-yellow-500/20 text-yellow-300',
    low: 'bg-slate-500/20 text-slate-300'
  };

  const sentimentIcon = {
    bullish: <TrendingUp className="w-4 h-4 text-green-400" />,
    bearish: <TrendingDown className="w-4 h-4 text-red-400" />,
    neutral: null
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Market News - {symbol}</h4>
          <Button
            onClick={fetchNews}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {lastUpdated && (
          <p className="text-xs text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString('id-ID')}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
            <span className="text-xs text-slate-400">Fetching latest news...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500">No recent news found</p>
          </div>
        )}

        {!loading && news.length > 0 && (
          <div className="space-y-3">
            {news.map((article, idx) => (
              <div key={idx} className="border border-slate-700/40 rounded-lg p-3 space-y-2 hover:border-slate-600/40 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-100 leading-tight mb-1 break-words">
                      {article.title}
                    </p>
                    <p className="text-xs text-slate-400 leading-snug">
                      {article.summary.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {sentimentIcon[article.sentiment]}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${relevanceColor[article.relevance]}`}>
                    {article.relevance === 'high' ? '⚡ High Impact' : article.relevance === 'medium' ? 'Medium' : 'Low'}
                  </span>
                  <span className={`text-xs font-medium ${sentimentColor[article.sentiment]}`}>
                    {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {article.timestamp}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}