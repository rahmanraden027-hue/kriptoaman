import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tradeId, exitPrice } = await req.json();

    // Fetch the trade
    const trade = await base44.entities.LivePaperTrade.read(tradeId);
    if (!trade) {
      return Response.json({ error: 'Trade not found' }, { status: 404 });
    }

    if (trade.status !== 'open') {
      return Response.json({ error: 'Trade is not open' }, { status: 400 });
    }

    // Calculate realized P/L
    const realizedPL = (exitPrice - trade.entryPrice) * trade.quantity;
    const realizedPLPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;

    // Update trade
    const closedTrade = await base44.entities.LivePaperTrade.update(tradeId, {
      status: 'closed',
      exitPrice,
      exitTime: new Date().toISOString(),
      realizedPL: parseFloat(realizedPL.toFixed(2)),
      currentPrice: exitPrice,
      unrealizedPL: 0,
      unrealizedPLPercent: 0
    });

    // Send notification
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Live Trade Closed - ${trade.pair}`,
      body: `Your live paper trade has been closed:\n\nPair: ${trade.pair}\nEntry: ${trade.entryPrice}\nExit: ${exitPrice}\nP/L: $${realizedPL.toFixed(2)} (${realizedPLPercent.toFixed(2)}%)`
    });

    return Response.json({
      success: true,
      trade: closedTrade
    });
  } catch (error) {
    console.error('Trade closure error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});