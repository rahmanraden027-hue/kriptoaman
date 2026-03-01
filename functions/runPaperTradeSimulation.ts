import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { strategyId, startingCapital, simulationDays, simulationName, advancedOptions = {} } = await req.json();

    const strategy = await base44.entities.AutoTradingStrategy.read(strategyId);
    if (!strategy) return Response.json({ error: 'Strategy not found' }, { status: 404 });

    const assetClassName = { crypto: 'cryptocurrency', forex: 'forex pair', indices: 'stock index', commodities: 'commodity' }[strategy.assetClass] || 'trading pair';

    // Generate historical OHLCV data
    const marketData = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate realistic historical OHLCV data for ${strategy.pair} (${assetClassName}) over the last ${simulationDays} days.
      Return as JSON array with: { date: "YYYY-MM-DD", open: number, high: number, low: number, close: number, volume: number }.
      Use realistic volatility for ${strategy.assetClass} markets.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          data: { type: "array", items: { type: "object", properties: { date:{type:"string"}, open:{type:"number"}, high:{type:"number"}, low:{type:"number"}, close:{type:"number"}, volume:{type:"number"} } } }
        }
      }
    });
    const historicalData = marketData.data || [];

    // Extract advanced options
    const slippagePercent = (advancedOptions.slippage || 0.1) / 100;
    const commissionPercent = (advancedOptions.commission || 0.05) / 100;
    const fixedCommission = (advancedOptions.fixedCommission || 0) / 100;
    const fillRate = (advancedOptions.fillRate || 100) / 100; // % of limit orders that fill
    const spread = (advancedOptions.spread || 0) / 100; // bid-ask spread
    const walkForward = advancedOptions.walkForward || { enabled: false };
    const monteCarlo = advancedOptions.monteCarlo || { enabled: false, simulations: 500 };
    const marketRegime = advancedOptions.marketRegime || 'mixed';
    const economicCondition = advancedOptions.economicCondition || 'normal';
    const entryCondition = JSON.parse(strategy.entryCondition || '{}');
    const riskMgmt = strategy.riskManagement || {};

    // Apply market regime modifier to candle
    const applyRegime = (candle, regime) => {
      const c = { ...candle };
      const range = c.high - c.low;
      if (regime === 'bullish') { c.close += c.close * 0.007; c.high += c.high * 0.005; }
      else if (regime === 'bearish') { c.close -= c.close * 0.007; c.low -= c.low * 0.005; }
      else if (regime === 'sideways') { c.close = c.low + range * 0.5; c.high = c.open + range * 0.3; c.low = c.open - range * 0.3; }
      else if (regime === 'volatile') { c.high += range * 0.3; c.low -= range * 0.3; c.close = c.open + (Math.random() > 0.5 ? 1 : -1) * range * 0.4; }
      return c;
    };

    // Apply economic condition modifier
    const applyEconomicCondition = (candle, condition) => {
      const c = { ...candle };
      if (condition === 'recession') { c.close -= c.close * 0.003; c.volume *= 0.7; }
      else if (regime === 'expansion') { c.close += c.close * 0.002; c.volume *= 1.3; }
      else if (condition === 'crisis') { c.close -= c.close * 0.015; c.high -= c.high * 0.005; c.low -= c.low * 0.02; }
      else if (condition === 'recovery') { c.close += c.close * 0.005; c.volume *= 1.1; }
      return c;
    };

    const calcTotalFee = (price, quantity) => {
      const varFee = price * quantity * commissionPercent;
      const fixed = fixedCommission;
      const spreadCost = price * quantity * spread;
      return varFee + fixed + spreadCost;
    };

    // Core simulation runner
    const runSimulation = (data, capital) => {
      const trades = [];
      let balance = capital;
      let equityData = [{ date: data[0]?.date || '0', balance, equity: balance }];
      let position = null;

      for (let i = 0; i < data.length; i++) {
        let candle = marketRegime !== 'mixed' ? applyRegime({ ...data[i] }, marketRegime) : { ...data[i] };
        candle = economicCondition !== 'normal' ? applyEconomicCondition(candle, economicCondition) : candle;
        const prevCandle = i > 0 ? data[i - 1] : null;

        // Entry signal
        let shouldEntry = false;
        if (!position && prevCandle) {
          if (entryCondition.template === 'rsi') {
            shouldEntry = candle.close > prevCandle.close && candle.volume > prevCandle.volume;
          } else if (entryCondition.template === 'macd') {
            shouldEntry = candle.close > candle.open && prevCandle.close < prevCandle.open;
          } else if (entryCondition.template === 'bollinger') {
            shouldEntry = candle.close > candle.high * 0.95 && candle.close > prevCandle.close;
          } else {
            shouldEntry = candle.close > prevCandle.close && (Math.random() > 0.6);
          }
        }

        // Limit order fill rate check
        if (shouldEntry && Math.random() > fillRate) shouldEntry = false;

        if (shouldEntry && balance > 0) {
          const tradeSize = Math.min(riskMgmt.tradeSize || 100, balance);
          const entryPrice = candle.close * (1 + slippagePercent);
          const quantity = tradeSize / entryPrice;
          const entryFee = calcTotalFee(entryPrice, quantity);
          balance -= entryFee;
          position = { entryPrice, quantity, entryTime: candle.date, entryFee };
        }

        if (position) {
          const atrMultiplier = riskMgmt.atrMultiplier || 2;
          const tpMultiplier = riskMgmt.tpMultiplier || 3;
          const stopLoss = position.entryPrice * (1 - atrMultiplier * 0.02);
          const takeProfit = position.entryPrice * (1 + tpMultiplier * 0.02);

          let shouldExit = false;
          let exitPrice = null;
          let exitReason = '';

          if (candle.low <= stopLoss) {
            shouldExit = true; exitPrice = stopLoss * (1 - slippagePercent); exitReason = 'stop_loss';
          } else if (candle.high >= takeProfit) {
            shouldExit = true; exitPrice = takeProfit * (1 - slippagePercent); exitReason = 'take_profit';
          } else if (i === data.length - 1) {
            shouldExit = true; exitPrice = candle.close * (1 - slippagePercent); exitReason = 'end_of_data';
          }

          if (shouldExit && exitPrice) {
            const exitFee = calcTotalFee(exitPrice, position.quantity);
            const grossPL = (exitPrice - position.entryPrice) * position.quantity;
            const profitLoss = grossPL - exitFee - position.entryFee;
            const profitLossPercent = (profitLoss / (position.entryPrice * position.quantity)) * 100;
            balance += (exitPrice * position.quantity) - exitFee;
            equityData.push({ date: candle.date, balance: parseFloat(balance.toFixed(2)), equity: parseFloat(balance.toFixed(2)) });

            trades.push({
              entryPrice: position.entryPrice,
              exitPrice,
              quantity: position.quantity.toFixed(6),
              profitLoss: parseFloat(profitLoss.toFixed(2)),
              profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
              entryTime: position.entryTime,
              exitTime: candle.date,
              exitReason,
              type: profitLoss >= 0 ? 'win' : 'loss'
            });
            position = null;
          } else {
            const unrealizedPL = (candle.close - position.entryPrice) * position.quantity;
            equityData.push({ date: candle.date, balance: parseFloat(balance.toFixed(2)), equity: parseFloat((balance + unrealizedPL).toFixed(2)) });
          }
        } else {
          equityData.push({ date: candle.date, balance: parseFloat(balance.toFixed(2)), equity: parseFloat(balance.toFixed(2)) });
        }
      }
      return { trades, finalBalance: balance, equityData };
    };

    // Compute statistics from trades
    const computeStats = (trades, startCap, finalBalance, equityData) => {
      const winning = trades.filter(t => t.type === 'win');
      const losing = trades.filter(t => t.type === 'loss');
      const totalPL = trades.reduce((s, t) => s + t.profitLoss, 0);
      const totalPLPercent = ((finalBalance - startCap) / startCap) * 100;
      const winRate = trades.length > 0 ? (winning.length / trades.length) * 100 : 0;
      const avgWin = winning.length > 0 ? winning.reduce((s, t) => s + t.profitLoss, 0) / winning.length : 0;
      const avgLoss = losing.length > 0 ? Math.abs(losing.reduce((s, t) => s + t.profitLoss, 0) / losing.length) : 0;
      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : 0);

      let maxDrawdown = 0, peak = startCap;
      for (const eq of equityData) {
        if (eq.equity > peak) peak = eq.equity;
        const dd = ((peak - eq.equity) / peak) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }

      const returns = equityData.slice(1).map((eq, i) => (eq.equity - equityData[i].equity) / (equityData[i].equity || 1));
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const stdDev = returns.length > 0 ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length) : 0;
      const sharpeRatio = stdDev > 0 ? (avgReturn * Math.sqrt(252)) / stdDev : 0;

      // Sortino (downside deviation only)
      const downside = returns.filter(r => r < 0);
      const downsideDev = downside.length > 0 ? Math.sqrt(downside.reduce((s, r) => s + r * r, 0) / downside.length) : 0;
      const sortinoRatio = downsideDev > 0 ? (avgReturn * Math.sqrt(252)) / downsideDev : 0;

      // Calmar Ratio
      const annualReturn = totalPLPercent * (365 / equityData.length);
      const calmarRatio = maxDrawdown > 0 ? annualReturn / maxDrawdown : 0;

      // Consecutive wins/losses
      let maxConsecutiveWins = 0, maxConsecutiveLosses = 0, cur = 0;
      for (const t of trades) {
        if (t.type === 'win') { cur = cur > 0 ? cur + 1 : 1; maxConsecutiveWins = Math.max(maxConsecutiveWins, cur); }
        else { cur = cur < 0 ? cur - 1 : -1; maxConsecutiveLosses = Math.max(maxConsecutiveLosses, Math.abs(cur)); }
      }

      return {
        totalTrades: trades.length,
        winningTrades: winning.length,
        losingTrades: losing.length,
        winRate: parseFloat(winRate.toFixed(2)),
        totalPL: parseFloat(totalPL.toFixed(2)),
        totalPLPercent: parseFloat(totalPLPercent.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        maxDrawdownPercent: parseFloat(maxDrawdown.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        profitFactor: parseFloat(Math.min(profitFactor, 99).toFixed(2)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
        sortinoRatio: parseFloat(sortinoRatio.toFixed(4)),
        calmarRatio: parseFloat(calmarRatio.toFixed(4)),
        finalBalance: parseFloat(finalBalance.toFixed(2)),
        maxConsecutiveWins,
        maxConsecutiveLosses,
        avgHoldingPeriod: trades.length > 0 ? Math.round(equityData.length / trades.length) : 0,
      };
    };

    // Run base simulation
    const { trades, finalBalance, equityData } = runSimulation(historicalData, startingCapital);
    const statistics = computeStats(trades, startingCapital, finalBalance, equityData);

    // Walk-Forward Optimization
    let walkForwardResults = null;
    if (walkForward.enabled && historicalData.length > 0) {
      const windowSize = walkForward.periodDays || 7;
      const inSampleRatio = walkForward.inSampleRatio || 0.7; // 70% in-sample, 30% out-of-sample
      const totalWindows = Math.floor(historicalData.length / windowSize);
      const windows = [];

      for (let w = 0; w < totalWindows - 1; w++) {
        const windowData = historicalData.slice(w * windowSize, (w + 2) * windowSize);
        const splitIdx = Math.floor(windowData.length * inSampleRatio);
        const inSampleData = windowData.slice(0, splitIdx);
        const outSampleData = windowData.slice(splitIdx);

        if (inSampleData.length < 3 || outSampleData.length < 2) continue;

        const inResult = runSimulation(inSampleData, startingCapital);
        const outResult = runSimulation(outSampleData, startingCapital);
        const inStats = computeStats(inResult.trades, startingCapital, inResult.finalBalance, inResult.equityData);
        const outStats = computeStats(outResult.trades, startingCapital, outResult.finalBalance, outResult.equityData);

        windows.push({
          window: w + 1,
          period: `${inSampleData[0]?.date} → ${outSampleData[outSampleData.length - 1]?.date}`,
          inSample: { trades: inStats.totalTrades, winRate: inStats.winRate, return: inStats.totalPLPercent, sharpe: inStats.sharpeRatio },
          outSample: { trades: outStats.totalTrades, winRate: outStats.winRate, return: outStats.totalPLPercent, sharpe: outStats.sharpeRatio },
          efficiency: inStats.totalPLPercent > 0 ? (outStats.totalPLPercent / inStats.totalPLPercent) * 100 : 0,
        });
      }

      const passedWindows = windows.filter(w => w.outSample.return > 0);
      walkForwardResults = {
        windows,
        totalWindows: windows.length,
        passedWindows: passedWindows.length,
        consistencyScore: windows.length > 0 ? (passedWindows.length / windows.length) * 100 : 0,
        avgOutSampleReturn: windows.length > 0 ? windows.reduce((s, w) => s + w.outSample.return, 0) / windows.length : 0,
        avgEfficiency: windows.length > 0 ? windows.reduce((s, w) => s + w.efficiency, 0) / windows.length : 0,
      };
    }

    // Monte Carlo Simulation (enhanced)
    let monteCarloStats = null;
    if (monteCarlo.enabled && trades.length > 1) {
      const numSims = Math.min(monteCarlo.simulations || 500, 2000);
      const mcResults = [];
      let ruinCount = 0;
      const ruinThreshold = startingCapital * 0.5; // Ruin = losing 50% of capital

      for (let sim = 0; sim < numSims; sim++) {
        // Resample trade returns (bootstrap)
        let simBalance = startingCapital;
        const plValues = trades.map(t => t.profitLoss);
        const simTrades = [];
        for (let t = 0; t < trades.length; t++) {
          const randomTrade = plValues[Math.floor(Math.random() * plValues.length)];
          simBalance += randomTrade;
          simTrades.push(simBalance);
          if (simBalance <= ruinThreshold) { ruinCount++; break; }
        }
        mcResults.push({ finalBalance: simBalance, path: simTrades });
      }

      const balances = mcResults.map(r => r.finalBalance).sort((a, b) => a - b);
      const allReturns = balances.map(b => ((b - startingCapital) / startingCapital) * 100);

      // Drawdown distribution across MC paths
      const maxDrawdowns = mcResults.map(r => {
        let peak = startingCapital, maxDD = 0;
        for (const eq of r.path) {
          if (eq > peak) peak = eq;
          const dd = ((peak - eq) / peak) * 100;
          if (dd > maxDD) maxDD = dd;
        }
        return maxDD;
      }).sort((a, b) => a - b);

      monteCarloStats = {
        simulations: numSims,
        avgFinalBalance: parseFloat((balances.reduce((a, b) => a + b, 0) / balances.length).toFixed(2)),
        medianFinalBalance: parseFloat(balances[Math.floor(balances.length / 2)].toFixed(2)),
        percentile5: parseFloat(balances[Math.floor(balances.length * 0.05)].toFixed(2)),
        percentile25: parseFloat(balances[Math.floor(balances.length * 0.25)].toFixed(2)),
        percentile75: parseFloat(balances[Math.floor(balances.length * 0.75)].toFixed(2)),
        percentile95: parseFloat(balances[Math.floor(balances.length * 0.95)].toFixed(2)),
        worstCase: parseFloat(balances[0].toFixed(2)),
        bestCase: parseFloat(balances[balances.length - 1].toFixed(2)),
        probabilityOfRuin: parseFloat(((ruinCount / numSims) * 100).toFixed(2)),
        probabilityOfProfit: parseFloat(((balances.filter(b => b > startingCapital).length / numSims) * 100).toFixed(2)),
        avgMaxDrawdown: parseFloat((maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length).toFixed(2)),
        worstDrawdown: parseFloat(maxDrawdowns[maxDrawdowns.length - 1].toFixed(2)),
        returnDistribution: [5, 10, 25, 50, 75, 90, 95].map(p => ({
          percentile: p,
          return: parseFloat(allReturns[Math.floor(allReturns.length * p / 100)]?.toFixed(2) || 0),
          balance: parseFloat(balances[Math.floor(balances.length * p / 100)]?.toFixed(2) || 0),
        })),
      };
    }

    // Save simulation record
    const paperTrade = await base44.entities.PaperTrade.create({
      strategyId,
      strategyName: strategy.name,
      simulationName: simulationName || `${strategy.name} - ${new Date().toLocaleDateString()}`,
      startingCapital,
      simulationDays,
      status: 'completed',
      trades,
      statistics,
      equityData: equityData.slice(0, 300),
      monteCarloStats,
      walkForwardResults,
      advancedOptions: { slippage: slippagePercent, commission: commissionPercent, fixedCommission, fillRate, spread, walkForward, monteCarlo, marketRegime, economicCondition },
      completedAt: new Date().toISOString()
    });

    return Response.json({ success: true, simulation: paperTrade });
  } catch (error) {
    console.error('Simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});