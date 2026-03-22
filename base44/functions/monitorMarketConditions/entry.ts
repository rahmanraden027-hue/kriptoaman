import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pair, assetClass, currentPrice, priceHistory } = await req.json();

    if (!pair || !currentPrice || !priceHistory || priceHistory.length < 2) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Calculate volatility (standard deviation of returns)
    const returns = [];
    for (let i = 1; i < priceHistory.length; i++) {
      returns.push((priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1]);
    }
    
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    // Detect trend
    const recent = priceHistory.slice(-10);
    const older = priceHistory.slice(-20, -10);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    let trend = 'sideways';
    if (recentAvg > olderAvg * 1.02) trend = 'uptrend';
    else if (recentAvg < olderAvg * 0.98) trend = 'downtrend';

    // Trend strength (0-100)
    const trendStrength = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;

    // Support & Resistance
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const supportLevel = minPrice + (maxPrice - minPrice) * 0.3;
    const resistanceLevel = maxPrice - (maxPrice - minPrice) * 0.3;

    // Volatility trend
    const volatilityRecent = returns.slice(-5).map(r => Math.abs(r));
    const volatilityOlder = returns.slice(-10, -5).map(r => Math.abs(r));
    const volRecentAvg = volatilityRecent.reduce((a, b) => a + b, 0) / volatilityRecent.length;
    const volOlderAvg = volatilityOlder.reduce((a, b) => a + b, 0) / volatilityOlder.length;
    
    let volatilityTrend = 'stable';
    if (volRecentAvg > volOlderAvg * 1.1) volatilityTrend = 'increasing';
    else if (volRecentAvg < volOlderAvg * 0.9) volatilityTrend = 'decreasing';

    // Risk assessment
    let riskLevel = 'low';
    if (volatility > 5) riskLevel = 'high';
    else if (volatility > 2) riskLevel = 'medium';

    // Detect anomalies
    const alerts = [];
    if (volatility > 5 && volatilityTrend === 'increasing') {
      alerts.push({
        type: 'volatility_spike',
        message: `Volatility spike detected: ${volatility.toFixed(2)}%`,
        timestamp: new Date().toISOString(),
      });
    }

    if (trendStrength > 50 && trend !== 'sideways') {
      alerts.push({
        type: 'trend_reversal',
        message: `Strong ${trend} detected with ${trendStrength.toFixed(0)}% strength`,
        timestamp: new Date().toISOString(),
      });
    }

    // Save market condition
    const marketCondition = await base44.asServiceRole.entities.MarketCondition.create({
      pair,
      assetClass,
      volatility: parseFloat(volatility.toFixed(2)),
      volatilityTrend,
      trend,
      trendStrength: parseFloat(trendStrength.toFixed(2)),
      supportLevel: parseFloat(supportLevel.toFixed(2)),
      resistanceLevel: parseFloat(resistanceLevel.toFixed(2)),
      lastPrice: currentPrice,
      riskLevel,
      alerts,
    });

    return Response.json({
      success: true,
      marketCondition,
      analysis: {
        volatility: parseFloat(volatility.toFixed(2)),
        trend,
        trendStrength: parseFloat(trendStrength.toFixed(2)),
        riskLevel,
        hasAnomalies: alerts.length > 0,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});