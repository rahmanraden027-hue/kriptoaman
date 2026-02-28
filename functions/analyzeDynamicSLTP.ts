import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fetch real-time market data
async function getMarketData(symbol, pair) {
  try {
    const response = await fetch('http://localhost:3000/api/functions/getRealtimeMarketData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, pair }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

// Calculate dynamic stop-loss based on ATR and support
function calculateDynamicStopLoss(entryPrice, atr, support, riskPercent = 2) {
  const atrStopLoss = entryPrice - (atr * 2); // 2x ATR below entry
  const supportStopLoss = support * 0.99; // 1% below support
  
  // Use the higher of the two (closer to entry = tighter risk)
  const stopLoss = Math.max(atrStopLoss, supportStopLoss);
  
  // Ensure stop loss respects risk percentage
  const maxRisk = entryPrice * (riskPercent / 100);
  return Math.min(stopLoss, entryPrice - maxRisk);
}

// Calculate dynamic take-profit based on ATR and resistance
function calculateDynamicTakeProfit(entryPrice, atr, resistance, tpMultiplier = 3) {
  const atrTakeProfit = entryPrice + (atr * tpMultiplier); // 3x ATR above entry
  const resistanceTakeProfit = resistance * 1.01; // 1% above resistance
  
  // Use the lower of the two (closer to entry = more realistic)
  const takeProfit = Math.min(atrTakeProfit, resistanceTakeProfit);
  
  return takeProfit;
}

// Calculate position sizing based on risk
function calculatePositionSize(entryPrice, stopLoss, accountBalance, riskPercent = 2) {
  const riskAmount = accountBalance * (riskPercent / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  
  if (riskPerUnit === 0) return 0;
  
  return riskAmount / riskPerUnit;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, pair, entryPrice, accountBalance, riskManagement } = await req.json();

    if (!symbol || !pair || !entryPrice) {
      return Response.json(
        { error: 'symbol, pair, and entryPrice required' },
        { status: 400 }
      );
    }

    // Get real-time market data
    const marketData = await getMarketData(symbol, pair);
    
    if (!marketData || !marketData.indicators) {
      return Response.json(
        { error: 'Could not fetch market data' },
        { status: 500 }
      );
    }

    const indicators = marketData.indicators;
    const riskPercent = riskManagement?.maxRiskPercent || 2;
    const atrMultiplier = riskManagement?.atrMultiplier || 2;
    const tpMultiplier = riskManagement?.tpMultiplier || 3;

    // Calculate dynamic SL/TP
    const stopLoss = calculateDynamicStopLoss(
      entryPrice,
      indicators.atr,
      indicators.support,
      riskPercent
    );

    const takeProfit = calculateDynamicTakeProfit(
      entryPrice,
      indicators.atr,
      indicators.resistance,
      tpMultiplier
    );

    const positionSize = calculatePositionSize(
      entryPrice,
      stopLoss,
      accountBalance || 10000,
      riskPercent
    );

    const riskReward = (takeProfit - entryPrice) / (entryPrice - stopLoss);

    return Response.json({
      entryPrice,
      stopLoss: stopLoss.toFixed(2),
      takeProfit: takeProfit.toFixed(2),
      positionSize: positionSize.toFixed(4),
      riskReward: riskReward.toFixed(2),
      marketConditions: {
        currentPrice: marketData.currentPrice,
        trend: indicators.trend,
        rsi: indicators.rsi?.toFixed(1),
        atr: indicators.atr?.toFixed(2),
        support: indicators.support?.toFixed(2),
        resistance: indicators.resistance?.toFixed(2),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});