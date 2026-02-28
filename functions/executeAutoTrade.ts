import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fetch real-time market data
async function getMarketData(symbol, pair) {
  try {
    const response = await fetch(`http://localhost:3000/api/functions/getRealtimeMarketData`, {
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

// Get dynamic SL/TP based on real-time data
async function getDynamicSLTP(symbol, pair, entryPrice, accountBalance, riskManagement) {
  try {
    const response = await fetch(`http://localhost:3000/api/functions/analyzeDynamicSLTP`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        pair,
        entryPrice,
        accountBalance,
        riskManagement,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error calculating dynamic SL/TP:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategyId, opportunity } = await req.json();

    // Fetch strategy
    const strategies = await base44.entities.AutoTradingStrategy.filter({
      id: strategyId
    });

    if (!strategies || strategies.length === 0) {
      return Response.json({ error: 'Strategy not found' }, { status: 404 });
    }

    const strategy = strategies[0];

    // Check confidence level
    if (opportunity.confidence < 60) {
      return Response.json({
        executed: false,
        reason: `Low confidence: ${opportunity.confidence}%`
      });
    }

    // Check if strategy is active
    if (!strategy.isActive) {
      return Response.json({
        executed: false,
        reason: 'Strategy is not active'
      });
    }

    const [fromToken, toToken] = strategy.pair.split('/');
    const tradeSize = strategy.riskManagement?.tradeSize || 100;
    const quantity = (tradeSize / opportunity.entryPrice).toFixed(8);

    // Get real-time market data and calculate dynamic SL/TP
    const slTP = await getDynamicSLTP(
      fromToken,
      strategy.pair,
      opportunity.entryPrice,
      tradeSize * 10, // Estimated account balance
      strategy.riskManagement
    );

    // Use dynamic SL/TP if available, otherwise fall back to opportunity values
    const finalStopLoss = slTP?.stopLoss ? parseFloat(slTP.stopLoss) : opportunity.stopLoss;
    const finalTakeProfit = slTP?.takeProfit ? parseFloat(slTP.takeProfit) : opportunity.takeProfit;

    // Create take-profit order
    const tpOrder = await base44.entities.DEXOrder.create({
      orderType: 'take-profit',
      chainId: 1, // Ethereum by default
      chainName: strategy.chain,
      fromTokenSymbol: fromToken,
      fromTokenAddress: '0x0000000000000000000000000000000000000000',
      toTokenSymbol: toToken,
      toTokenAddress: '0x0000000000000000000000000000000000000000',
      amount: quantity,
      triggerPrice: finalTakeProfit,
      status: 'pending',
      notes: `Auto-trade TP for strategy: ${strategy.name} (Dynamic: ${slTP ? 'Yes' : 'No'})`
    });

    // Create stop-loss order
    const slOrder = await base44.entities.DEXOrder.create({
      orderType: 'stop-loss',
      chainId: 1,
      chainName: strategy.chain,
      fromTokenSymbol: fromToken,
      fromTokenAddress: '0x0000000000000000000000000000000000000000',
      toTokenSymbol: toToken,
      toTokenAddress: '0x0000000000000000000000000000000000000000',
      amount: quantity,
      triggerPrice: finalStopLoss,
      status: 'pending',
      notes: `Auto-trade SL for strategy: ${strategy.name} (Dynamic: ${slTP ? 'Yes' : 'No'})`
    });

    // Create trade performance record
    const tradePerformance = await base44.entities.TradePerformance.create({
      dexOrderId: tpOrder.id,
      orderType: 'take-profit',
      chainName: strategy.chain,
      fromTokenSymbol: fromToken,
      toTokenSymbol: toToken,
      entryPrice: opportunity.entryPrice,
      exitPrice: opportunity.takeProfit,
      quantity: quantity,
      status: 'pending',
      executedDate: new Date().toISOString(),
      notes: `Auto-traded via strategy: ${strategy.name}`
    });

    // Send notification email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Auto-Trade Executed: ${strategy.name}`,
      body: `
        Your auto-trading strategy "${strategy.name}" has executed a trade.
        
        Pair: ${strategy.pair}
        Entry Price: $${opportunity.entryPrice.toFixed(4)}
        Stop Loss: $${finalStopLoss.toFixed(4)} (Dynamic: ${slTP ? 'Yes' : 'No'})
        Take Profit: $${finalTakeProfit.toFixed(4)} (Dynamic: ${slTP ? 'Yes' : 'No'})
        Risk/Reward: ${((finalTakeProfit - opportunity.entryPrice) / (opportunity.entryPrice - finalStopLoss)).toFixed(2)}
        Confidence: ${opportunity.confidence}%
        
        Market Conditions:
        - Trend: ${slTP?.marketConditions?.trend || 'N/A'}
        - RSI: ${slTP?.marketConditions?.rsi || 'N/A'}
        - ATR: ${slTP?.marketConditions?.atr || 'N/A'}
        - Support: $${slTP?.marketConditions?.support || 'N/A'}
        - Resistance: $${slTP?.marketConditions?.resistance || 'N/A'}
        
        Trade Size: ${quantity} ${fromToken}
      `
    });

    // Update strategy stats
    const currentStats = strategy.stats || {
      totalTrades: 0,
      winningTrades: 0,
      totalPL: 0,
      winRate: 0
    };

    await base44.entities.AutoTradingStrategy.update(strategyId, {
      stats: {
        ...currentStats,
        totalTrades: (currentStats.totalTrades || 0) + 1
      }
    });

    return Response.json({
      executed: true,
      tpOrderId: tpOrder.id,
      slOrderId: slOrder.id,
      tradePerformanceId: tradePerformance.id,
      quantity,
      entryPrice: opportunity.entryPrice,
      stopLoss: opportunity.stopLoss,
      takeProfit: opportunity.takeProfit
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});