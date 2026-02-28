import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Mock price data - dalam praktik, integrasikan dengan API harga real
const MOCK_PRICES = {
  ETH: 3400,
  BNB: 580,
  USDT: 1,
  USDC: 1,
  WBTC: 95000,
  POL: 0.45,
  MATIC: 0.45,
  UNI: 8.2,
  LINK: 14.5,
};

function getRandomPrice(basePrice) {
  const variance = basePrice * 0.02; // 2% variance
  return basePrice + (Math.random() - 0.5) * variance;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all pending orders
    const pendingOrders = await base44.asServiceRole.entities.DEXOrder.filter(
      { status: 'pending' }
    );

    console.log(`[Monitor] Checking ${pendingOrders.length} pending orders...`);

    const results = {
      checked: 0,
      triggered: 0,
      failed: 0,
      errors: [],
    };

    for (const order of pendingOrders) {
      results.checked++;
      const currentPrice = getRandomPrice(MOCK_PRICES[order.fromTokenSymbol] || 1);
      const shouldExecute = checkTriggerCondition(order, currentPrice);

      if (shouldExecute) {
        console.log(`[Monitor] Order ${order.id} triggered at ${currentPrice}`);

        // Invoke executeDEXOrder function
        try {
          const execResult = await base44.asServiceRole.functions.invoke(
            'executeDEXOrder',
            {
              orderId: order.id,
              executionPrice: currentPrice,
              userId: user.email,
            }
          );

          if (execResult.data?.success) {
            results.triggered++;
          } else {
            results.failed++;
            results.errors.push({
              orderId: order.id,
              error: execResult.data?.error || 'Unknown error',
            });
          }
        } catch (err) {
          results.failed++;
          results.errors.push({
            orderId: order.id,
            error: err.message,
          });
        }
      }
    }

    console.log('[Monitor] Results:', results);
    return Response.json(results);
  } catch (error) {
    console.error('[Monitor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function checkTriggerCondition(order, currentPrice) {
  if (order.orderType === 'stop-loss') {
    return currentPrice <= order.triggerPrice;
  } else if (order.orderType === 'take-profit') {
    return currentPrice >= order.triggerPrice;
  }
  return false;
}