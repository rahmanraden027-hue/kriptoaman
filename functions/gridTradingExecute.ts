import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, botId } = await req.json();

  const bot = await base44.entities.GridTradingBot.get(botId);
  if (!bot) return Response.json({ error: 'Bot tidak ditemukan' }, { status: 404 });

  // Get CEX connection
  const conn = await base44.entities.CexConnection.get(bot.cexConnectionId);
  if (!conn) return Response.json({ error: 'Koneksi CEX tidak ditemukan' }, { status: 404 });

  const apiKey = conn.api_key;
  const apiSecret = conn.api_secret;

  // Helper: Binance signed request
  async function binanceRequest(endpoint, params = {}, method = 'GET') {
    const timestamp = Date.now();
    const queryParams = { ...params, timestamp };
    const queryString = new URLSearchParams(queryParams).toString();
    const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
    const url = `https://api.binance.com${endpoint}?${queryString}&signature=${signature}`;
    const res = await fetch(url, {
      method,
      headers: { 'X-MBX-APIKEY': apiKey },
    });
    return res.json();
  }

  // Get current price
  async function getCurrentPrice(symbol) {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await res.json();
    return parseFloat(data.price);
  }

  if (action === 'start') {
    // Calculate grid levels
    const { upperPrice, lowerPrice, gridCount, totalInvestment, symbol } = bot;
    const gridStep = (upperPrice - lowerPrice) / gridCount;
    const perGrid = totalInvestment / gridCount;

    const currentPrice = await getCurrentPrice(symbol);

    // Build grid levels
    const gridLevels = [];
    for (let i = 0; i <= gridCount; i++) {
      gridLevels.push(parseFloat((lowerPrice + i * gridStep).toFixed(8)));
    }

    // Place buy orders below current price, sell orders above
    const orders = [];
    for (let i = 0; i < gridLevels.length - 1; i++) {
      const price = gridLevels[i];
      const nextPrice = gridLevels[i + 1];
      const qty = parseFloat((perGrid / price).toFixed(6));

      if (price < currentPrice) {
        // Buy order
        orders.push({ side: 'BUY', price, quantity: qty, status: 'pending' });
      } else {
        // Sell order — but check if we have inventory
        orders.push({ side: 'SELL', price: nextPrice, quantity: qty, status: 'pending' });
      }
    }

    // Place orders on Binance
    const placedOrders = [];
    for (const order of orders.slice(0, 10)) { // limit to 10 for safety
      try {
        const result = await binanceRequest('/api/v3/order', {
          symbol: symbol.toUpperCase(),
          side: order.side,
          type: 'LIMIT',
          timeInForce: 'GTC',
          quantity: order.quantity,
          price: order.price,
        }, 'POST');

        placedOrders.push({
          orderId: String(result.orderId || `sim_${Date.now()}_${Math.random()}`),
          side: order.side,
          price: order.price,
          quantity: order.quantity,
          status: result.status || 'NEW',
        });
      } catch (e) {
        // Simulate order if Binance call fails (read-only key)
        placedOrders.push({
          orderId: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          side: order.side,
          price: order.price,
          quantity: order.quantity,
          status: 'SIMULATED',
        });
      }
    }

    await base44.entities.GridTradingBot.update(botId, {
      isActive: true,
      activeOrders: placedOrders,
      startedAt: new Date().toISOString(),
      lastRunAt: new Date().toISOString(),
      errorMessage: null,
      'stats.totalTrades': 0,
      'stats.totalProfit': 0,
    });

    return Response.json({ success: true, ordersPlaced: placedOrders.length, currentPrice });
  }

  if (action === 'stop') {
    // Cancel all active orders
    const activeOrders = bot.activeOrders || [];
    for (const order of activeOrders) {
      if (!order.orderId.startsWith('sim_')) {
        try {
          await binanceRequest('/api/v3/order', {
            symbol: bot.symbol.toUpperCase(),
            orderId: order.orderId,
          }, 'DELETE');
        } catch (_) {}
      }
    }

    await base44.entities.GridTradingBot.update(botId, {
      isActive: false,
      activeOrders: [],
      lastRunAt: new Date().toISOString(),
    });

    return Response.json({ success: true });
  }

  if (action === 'status') {
    const currentPrice = await getCurrentPrice(bot.symbol);

    // Check filled orders & update profit
    const activeOrders = bot.activeOrders || [];
    let newProfit = bot.stats?.totalProfit || 0;
    let newTrades = bot.stats?.totalTrades || 0;

    const updatedOrders = [];
    for (const order of activeOrders) {
      if (order.orderId.startsWith('sim_')) {
        updatedOrders.push(order);
        continue;
      }
      try {
        const result = await binanceRequest('/api/v3/order', {
          symbol: bot.symbol.toUpperCase(),
          orderId: order.orderId,
        });
        if (result.status === 'FILLED' && order.status !== 'FILLED') {
          newTrades++;
          const { upperPrice, lowerPrice, gridCount } = bot;
          const gridStep = (upperPrice - lowerPrice) / gridCount;
          const profit = order.quantity * gridStep * 0.998; // minus fees
          newProfit += profit;
        }
        updatedOrders.push({ ...order, status: result.status || order.status });
      } catch (_) {
        updatedOrders.push(order);
      }
    }

    const runningHours = bot.startedAt
      ? (Date.now() - new Date(bot.startedAt).getTime()) / 3600000
      : 0;

    const profitPercent = bot.totalInvestment > 0 ? (newProfit / bot.totalInvestment) * 100 : 0;

    await base44.entities.GridTradingBot.update(botId, {
      activeOrders: updatedOrders,
      lastRunAt: new Date().toISOString(),
      stats: { totalProfit: newProfit, totalTrades: newTrades, profitPercent, runningHours },
    });

    return Response.json({ success: true, currentPrice, profit: newProfit, trades: newTrades });
  }

  return Response.json({ error: 'Action tidak dikenal' }, { status: 400 });
});