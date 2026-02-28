import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      strategyId,
      pair,
      assetClass,
      entryPrice,
      quantity,
      stopLoss,
      takeProfit,
      executionMode
    } = await req.json();

    // Fetch strategy for context
    const strategy = await base44.entities.AutoTradingStrategy.read(strategyId);
    if (!strategy) {
      return Response.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Create live trade record
    const liveTrade = await base44.entities.LivePaperTrade.create({
      strategyId,
      strategyName: strategy.name,
      pair,
      assetClass,
      entryPrice,
      currentPrice: entryPrice,
      quantity,
      stopLoss,
      takeProfit,
      status: 'open',
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
      executionMode,
      entryTime: new Date().toISOString(),
      notes: `${executionMode} execution`
    });

    // Send notification email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Live Trade Opened - ${pair}`,
      body: `A new live paper trade has been opened:\n\nPair: ${pair}\nEntry: ${entryPrice}\nSize: ${quantity}\nSL: ${stopLoss}\nTP: ${takeProfit}\n\nExecution: ${executionMode}`
    });

    return Response.json({
      success: true,
      trade: liveTrade
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});