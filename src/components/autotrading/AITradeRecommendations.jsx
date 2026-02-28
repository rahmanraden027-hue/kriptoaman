import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Zap, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AITradeRecommendations({ strategy, currentPrice, openTrades = [] }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const tradesSummary = openTrades.length > 0 
        ? `Current open trades: ${openTrades.length} trades with total unrealized P/L: $${openTrades.reduce((sum, t) => sum + (t.unrealizedPL || 0), 0).toFixed(2)}`
        : 'No open trades currently';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on ${strategy.pair} trading strategy "${strategy.name}" using ${strategy.templateName || 'custom'} template:
        Current price: $${currentPrice || 'N/A'}
        ${tradesSummary}
        
        Provide AI-powered trading recommendations:
        1. BUY/SELL/HOLD signal (with confidence 0-100)
        2. Suggested entry price (if applicable)
        3. Target take-profit level
        4. Stop-loss level
        5. Risk/reward ratio
        6. Rationale (max 2 sentences)
        7. Time frame for decision
        
        Return as JSON: { action: "buy"|"sell"|"hold", confidence: number, entryPrice: number, takeProfit: number, stopLoss: number, riskReward: string, rationale: string, timeframe: string, nextUpdate: string }`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            action: { type: "string" },
            confidence: { type: "number" },
            entryPrice: { type: "number" },
            takeProfit: { type: "number" },
            stopLoss: { type: "number" },
            riskReward: { type: "string" },
            rationale: { type: "string" },
            timeframe: { type: "string" },
            nextUpdate: { type: "string" }
          }
        }
      });

      setRecommendations(response);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [strategy.id, currentPrice]);

  if (!recommendations && !loading) return null;

  const getActionColor = (action) => {
    if (action === 'buy') return { bg: 'bg-green-500/20', text: 'text-green-400', label: '🟢 BUY' };
    if (action === 'sell') return { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴 SELL' };
    return { bg: 'bg-slate-500/10', text: 'text-slate-400', label: '⏸️ HOLD' };
  };

  const colors = recommendations ? getActionColor(recommendations.action) : null;

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">🤖 AI Trade Recommendations</h4>
          <Button
            onClick={fetchRecommendations}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
          </Button>
        </div>

        {lastUpdated && (
          <p className="text-xs text-slate-500">
            Updated: {lastUpdated.toLocaleTimeString('id-ID')}
          </p>
        )}

        {loading && !recommendations && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
            <span className="text-xs text-slate-400">Analyzing market for recommendations...</span>
          </div>
        )}

        {recommendations && (
          <div className="space-y-3">
            {/* Action Signal */}
            <div className={`rounded-lg p-4 border border-slate-700/40 ${colors.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-lg font-bold ${colors.text}`}>{colors.label}</p>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900/40 rounded-full px-3 py-1">
                    <p className={`text-sm font-semibold ${colors.text}`}>
                      {recommendations.confidence}% confidence
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-900/40 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    recommendations.action === 'buy' ? 'bg-green-500' : recommendations.action === 'sell' ? 'bg-red-500' : 'bg-slate-500'
                  }`}
                  style={{ width: `${recommendations.confidence}%` }}
                />
              </div>
            </div>

            {/* Price Targets */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40 text-center">
                <p className="text-xs text-slate-400 mb-1">Entry</p>
                <p className="text-sm font-bold text-blue-400">${recommendations.entryPrice?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40 text-center">
                <p className="text-xs text-slate-400 mb-1">Take Profit</p>
                <p className="text-sm font-bold text-green-400">${recommendations.takeProfit?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40 text-center">
                <p className="text-xs text-slate-400 mb-1">Stop Loss</p>
                <p className="text-sm font-bold text-red-400">${recommendations.stopLoss?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>

            {/* Risk/Reward */}
            <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
              <p className="text-xs text-slate-400 mb-1">Risk/Reward Ratio</p>
              <p className="text-sm font-bold text-purple-400">{recommendations.riskReward || 'N/A'}</p>
            </div>

            {/* Rationale */}
            {recommendations.rationale && (
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <p className="text-xs font-semibold text-blue-300 mb-1">📊 Analysis:</p>
                <p className="text-xs text-blue-300">{recommendations.rationale}</p>
              </div>
            )}

            {/* Time Frame */}
            <div className="flex items-center justify-between bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
              <div>
                <p className="text-xs text-slate-400">Time Frame</p>
                <p className="text-sm font-bold text-slate-300">{recommendations.timeframe || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Next Update</p>
                <p className="text-xs text-slate-300">{recommendations.nextUpdate || 'On demand'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}