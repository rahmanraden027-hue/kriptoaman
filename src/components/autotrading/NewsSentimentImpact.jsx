import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewsSentimentImpact({ pair, symbol, openTrades = [] }) {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSentimentAnalysis = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze current market sentiment for ${symbol} (${pair}). Based on recent news, technical indicators, and market conditions:
        1. Overall sentiment score (scale: -100 bullish to +100 bearish)
        2. Key sentiment drivers (up to 3 factors)
        3. Impact on open positions (bullish/bearish/neutral)
        4. Risk factors
        5. Recommendation impact
        Return as JSON: { sentimentScore: number, sentiment: "strongly_bullish"|"bullish"|"neutral"|"bearish"|"strongly_bearish", drivers: [string], positionImpact: "positive"|"negative"|"neutral", riskFactors: [string], recommendation: string }`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sentimentScore: { type: "number" },
            sentiment: { type: "string" },
            drivers: { type: "array", items: { type: "string" } },
            positionImpact: { type: "string" },
            riskFactors: { type: "array", items: { type: "string" } },
            recommendation: { type: "string" }
          }
        }
      });

      setSentiment(response);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Sentiment analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentAnalysis();
    const interval = setInterval(fetchSentimentAnalysis, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [pair, symbol]);

  if (!sentiment && !loading) return null;

  const getSentimentColor = (score) => {
    if (score <= -50) return { bg: 'bg-green-500/20', text: 'text-green-400', label: '🟢 Strongly Bullish' };
    if (score <= -25) return { bg: 'bg-green-500/10', text: 'text-green-300', label: '📈 Bullish' };
    if (score <= 25) return { bg: 'bg-slate-500/10', text: 'text-slate-400', label: '➡️ Neutral' };
    if (score <= 50) return { bg: 'bg-red-500/10', text: 'text-orange-400', label: '📉 Bearish' };
    return { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴 Strongly Bearish' };
  };

  const getImpactColor = (impact) => {
    if (impact === 'positive') return { bg: 'bg-green-500/10', text: 'text-green-400', icon: TrendingUp };
    if (impact === 'negative') return { bg: 'bg-red-500/10', text: 'text-red-400', icon: TrendingDown };
    return { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: AlertCircle };
  };

  const colors = sentiment ? getSentimentColor(sentiment.sentimentScore) : null;
  const impactColors = sentiment ? getImpactColor(sentiment.positionImpact) : null;
  const ImpactIcon = impactColors?.icon;

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">News Sentiment Impact</h4>
          <Button
            onClick={fetchSentimentAnalysis}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </Button>
        </div>

        {lastUpdated && (
          <p className="text-xs text-slate-500">
            Updated: {lastUpdated.toLocaleTimeString('id-ID')}
          </p>
        )}

        {loading && !sentiment && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
            <span className="text-xs text-slate-400">Analyzing sentiment...</span>
          </div>
        )}

        {sentiment && (
          <div className="space-y-3">
            {/* Overall Sentiment */}
            <div className={`rounded-lg p-3 border border-slate-700/40 ${colors.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Overall Sentiment</p>
                <p className={`text-sm font-bold ${colors.text}`}>{colors.label}</p>
              </div>
              <div className="w-full bg-slate-900/40 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    sentiment.sentimentScore <= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.abs(sentiment.sentimentScore) * 1.5}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Score: {sentiment.sentimentScore}</p>
            </div>

            {/* Impact on Open Positions */}
            {openTrades.length > 0 && (
              <div className={`rounded-lg p-3 border border-slate-700/40 ${impactColors.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ImpactIcon className={`w-4 h-4 ${impactColors.text}`} />
                  <p className={`text-xs font-semibold ${impactColors.text}`}>
                    Impact: {sentiment.positionImpact.charAt(0).toUpperCase() + sentiment.positionImpact.slice(1)}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {sentiment.positionImpact === 'positive' && 'News is favorable for your open positions'}
                  {sentiment.positionImpact === 'negative' && 'News presents risks to your open positions'}
                  {sentiment.positionImpact === 'neutral' && 'News has mixed implications for positions'}
                </p>
              </div>
            )}

            {/* Key Drivers */}
            {sentiment.drivers && sentiment.drivers.length > 0 && (
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
                <p className="text-xs font-semibold text-slate-300 mb-2">Key Sentiment Drivers:</p>
                <div className="space-y-1">
                  {sentiment.drivers.map((driver, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 text-xs mt-0.5">•</span>
                      <p className="text-xs text-slate-400">{driver}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {sentiment.riskFactors && sentiment.riskFactors.length > 0 && (
              <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                <p className="text-xs font-semibold text-orange-300 mb-2">⚠️ Risk Factors:</p>
                <div className="space-y-1">
                  {sentiment.riskFactors.map((risk, idx) => (
                    <p key={idx} className="text-xs text-orange-400">{risk}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {sentiment.recommendation && (
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <p className="text-xs font-semibold text-blue-300 mb-1">💡 Recommendation:</p>
                <p className="text-xs text-blue-300">{sentiment.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}