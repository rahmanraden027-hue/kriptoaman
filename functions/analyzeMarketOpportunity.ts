import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategyId } = await req.json();

    // Fetch strategy details
    const strategy = await base44.entities.AutoTradingStrategy.filter({
      id: strategyId
    });

    if (!strategy || strategy.length === 0) {
      return Response.json({ error: 'Strategy not found' }, { status: 404 });
    }

    const strat = strategy[0];
    const [fromToken, toToken] = strat.pair.split('/');

    // Use AI to analyze market conditions
    const analysisPrompt = `
      Analyze market opportunity for ${strat.pair} on ${strat.chain}.
      
      Strategy Type: ${strat.strategyType}
      Template: ${strat.templateName || 'custom'}
      Entry Condition: ${strat.entryCondition}
      
      Provide analysis in JSON format:
      {
        "shouldTrade": boolean,
        "confidence": number (0-100),
        "reason": string,
        "entryPrice": number,
        "currentPrice": number,
        "volatility": number,
        "atr": number,
        "suggestedSL": number,
        "suggestedTP": number,
        "riskReward": number
      }
      
      Consider:
      1. Current market trend and volatility
      2. Entry condition match
      3. Risk/reward ratio
      4. ATR-based stop loss and take profit
    `;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          shouldTrade: { type: 'boolean' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
          entryPrice: { type: 'number' },
          currentPrice: { type: 'number' },
          volatility: { type: 'number' },
          atr: { type: 'number' },
          suggestedSL: { type: 'number' },
          suggestedTP: { type: 'number' },
          riskReward: { type: 'number' }
        }
      }
    });

    // Calculate dynamic SL/TP based on ATR if enabled
    let stopLoss = analysis.suggestedSL;
    let takeProfit = analysis.suggestedTP;

    if (strat.riskManagement?.useATR && analysis.atr) {
      const slMultiplier = strat.riskManagement.atrMultiplier || 2;
      const tpMultiplier = strat.riskManagement.tpMultiplier || 3;

      stopLoss = analysis.entryPrice - (analysis.atr * slMultiplier);
      takeProfit = analysis.entryPrice + (analysis.atr * tpMultiplier);
    }

    // Update strategy with latest analysis
    await base44.entities.AutoTradingStrategy.update(strategyId, {
      lastAnalyzedAt: new Date().toISOString()
    });

    return Response.json({
      opportunity: {
        ...analysis,
        stopLoss,
        takeProfit,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});