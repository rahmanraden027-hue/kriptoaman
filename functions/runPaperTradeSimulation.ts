import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategyId, startingCapital, simulationDays, simulationName } = await req.json();

    // Fetch strategy
    const strategy = await base44.entities.AutoTradingStrategy.read(strategyId);
    if (!strategy) {
      return Response.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Fetch historical price data using LLM (asset-class aware)
    const assetClassName = {
      crypto: 'cryptocurrency',
      forex: 'forex pair',
      indices: 'stock index',
      commodities: 'commodity'
    }[strategy.assetClass] || 'trading pair';

    const marketData = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate realistic historical OHLCV (Open, High, Low, Close, Volume) data for ${strategy.pair} (${assetClassName}) over the last ${simulationDays} days. 
      Return as JSON array with objects containing: { date: "YYYY-MM-DD", open: number, high: number, low: number, close: number, volume: number }.
      Use realistic price movements and volatility appropriate for ${strategy.assetClass} markets.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                open: { type: "number" },
                high: { type: "number" },
                low: { type: "number" },
                close: { type: "number" },
                volume: { type: "number" }
              }
            }
          }
        }
      }
    });

    const historicalData = marketData.data || [];

    // Parse strategy conditions
    const entryCondition = JSON.parse(strategy.entryCondition || '{}');
    const riskMgmt = strategy.riskManagement || {};

    // Simulate trading
    const trades = [];
    let balance = startingCapital;
    let equity = startingCapital;
    let equityData = [{ date: historicalData[0]?.date, balance, equity }];
    let position = null;

    for (let i = 0; i < historicalData.length; i++) {
      const candle = historicalData[i];
      const prevCandle = i > 0 ? historicalData[i - 1] : null;
      const nextCandle = i < historicalData.length - 1 ? historicalData[i + 1] : null;

      // Entry signal based on template
      let shouldEntry = false;
      if (entryCondition.template === 'rsi') {
        // Simulated RSI logic: entry if price crosses above previous close
        shouldEntry = !position && prevCandle && candle.close > prevCandle.close;
      } else if (entryCondition.template === 'macd') {
        shouldEntry = !position && Math.random() > 0.7; // 30% probability
      } else if (entryCondition.template === 'bollinger') {
        shouldEntry = !position && candle.close > candle.high * 0.95;
      }

      // Entry
      if (shouldEntry && balance > 0) {
        const tradeSize = riskMgmt.tradeSize || 100;
        const quantity = tradeSize / candle.close;
        
        position = {
          entryPrice: candle.close,
          quantity,
          entryTime: candle.date,
          entryBalance: balance
        };
      }

      // Exit signal
      if (position && nextCandle) {
        const atrMultiplier = riskMgmt.atrMultiplier || 2;
        const tpMultiplier = riskMgmt.tpMultiplier || 3;
        const stopLoss = position.entryPrice * (1 - atrMultiplier * 0.02);
        const takeProfit = position.entryPrice * (1 + tpMultiplier * 0.02);

        let shouldExit = false;
        let exitPrice = null;

        // Stop loss hit
        if (candle.low <= stopLoss) {
          shouldExit = true;
          exitPrice = stopLoss;
        }
        // Take profit hit
        else if (candle.high >= takeProfit) {
          shouldExit = true;
          exitPrice = takeProfit;
        }
        // Exit by time (every 20 candles)
        else if (trades.length % 20 === 0 && trades.length > 0) {
          shouldExit = true;
          exitPrice = candle.close;
        }

        if (shouldExit && exitPrice) {
          const profitLoss = (exitPrice - position.entryPrice) * position.quantity;
          const profitLossPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
          
          balance += profitLoss;
          equity = balance;

          trades.push({
            entryPrice: position.entryPrice,
            exitPrice,
            quantity: position.quantity.toFixed(4),
            profitLoss: parseFloat(profitLoss.toFixed(2)),
            profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
            entryTime: position.entryTime,
            exitTime: candle.date,
            type: profitLoss >= 0 ? 'win' : 'loss'
          });

          position = null;
        }
      }

      // Record equity
      equityData.push({
        date: candle.date,
        balance: parseFloat(balance.toFixed(2)),
        equity: parseFloat(equity.toFixed(2))
      });
    }

    // Close remaining position
    if (position && historicalData.length > 0) {
      const lastCandle = historicalData[historicalData.length - 1];
      const profitLoss = (lastCandle.close - position.entryPrice) * position.quantity;
      const profitLossPercent = ((lastCandle.close - position.entryPrice) / position.entryPrice) * 100;
      
      balance += profitLoss;
      
      trades.push({
        entryPrice: position.entryPrice,
        exitPrice: lastCandle.close,
        quantity: position.quantity.toFixed(4),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        entryTime: position.entryTime,
        exitTime: lastCandle.date,
        type: profitLoss >= 0 ? 'win' : 'loss'
      });
    }

    // Calculate statistics
    const winningTrades = trades.filter(t => t.type === 'win').length;
    const losingTrades = trades.filter(t => t.type === 'loss').length;
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalPLPercent = ((balance - startingCapital) / startingCapital) * 100;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
    
    const wins = trades.filter(t => t.profitLoss > 0).map(t => t.profitLoss);
    const losses = trades.filter(t => t.profitLoss < 0).map(t => Math.abs(t.profitLoss));
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 1 : 0);

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = startingCapital;
    for (const eq of equityData) {
      if (eq.equity > peak) peak = eq.equity;
      const drawdown = ((peak - eq.equity) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Sharpe Ratio (simplified)
    const returns = equityData.slice(1).map((eq, i) => {
      const prev = equityData[i];
      return (eq.equity - prev.equity) / prev.equity;
    });
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
      : 0;
    const sharpeRatio = stdDev > 0 ? (avgReturn * 252) / stdDev : 0;

    // Create simulation record
    const paperTrade = await base44.entities.PaperTrade.create({
      strategyId,
      strategyName: strategy.name,
      simulationName: simulationName || `${strategy.name} - ${new Date().toLocaleDateString('id-ID')}`,
      startingCapital,
      simulationDays,
      status: 'completed',
      trades,
      statistics: {
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        winRate: parseFloat(winRate.toFixed(2)),
        totalPL: parseFloat(totalPL.toFixed(2)),
        totalPLPercent: parseFloat(totalPLPercent.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        maxDrawdownPercent: parseFloat(maxDrawdown.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
        finalBalance: parseFloat(balance.toFixed(2))
      },
      equityData: equityData.slice(0, Math.min(equityData.length, 200)), // Limit data points
      completedAt: new Date().toISOString()
    });

    return Response.json({
      success: true,
      simulation: paperTrade
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});