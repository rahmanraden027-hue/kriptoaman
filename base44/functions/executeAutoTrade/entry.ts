import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Eksekusi auto-trade berdasarkan opportunity dari analisis pasar.
 * Menggunakan data real Binance, bukan localhost.
 */

async function fetchCurrentPrice(symbol) {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`, {
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  return parseFloat(data.price);
}

async function fetchATR(symbol, period = 14) {
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=${period + 1}`, {
    signal: AbortSignal.timeout(8000),
  });
  const klines = await res.json();
  if (!klines || klines.length < 2) return null;

  let atrSum = 0;
  for (let i = 1; i < klines.length; i++) {
    const high = parseFloat(klines[i][2]);
    const low = parseFloat(klines[i][3]);
    const prevClose = parseFloat(klines[i - 1][4]);
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    atrSum += tr;
  }
  return atrSum / period;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { strategyId, opportunity } = await req.json();

    const strategies = await base44.entities.AutoTradingStrategy.filter({ id: strategyId });
    if (!strategies || strategies.length === 0) {
      return Response.json({ error: 'Strategy not found' }, { status: 404 });
    }
    const strategy = strategies[0];

    if (!strategy.isActive) {
      return Response.json({ executed: false, reason: 'Strategy is not active' });
    }
    if ((opportunity?.confidence || 0) < 60) {
      return Response.json({ executed: false, reason: `Low confidence: ${opportunity?.confidence}%` });
    }

    const [fromToken] = strategy.pair.split('/');
    const tradeSize = strategy.riskManagement?.tradeSize || 100;

    // Ambil harga real dari Binance
    let entryPrice = opportunity?.entryPrice;
    try {
      entryPrice = await fetchCurrentPrice(fromToken);
    } catch (e) {
      console.warn('[executeAutoTrade] Price fetch failed, using opportunity price:', e.message);
    }

    const quantity = (tradeSize / entryPrice).toFixed(8);

    // Hitung SL/TP dengan ATR dinamis
    let stopLoss = opportunity?.stopLoss;
    let takeProfit = opportunity?.takeProfit;

    try {
      const atr = await fetchATR(fromToken);
      if (atr && strategy.riskManagement?.useATR !== false) {
        const atrMult = strategy.riskManagement?.atrMultiplier || 2;
        const tpMult = strategy.riskManagement?.tpMultiplier || 3;
        stopLoss = parseFloat((entryPrice - atr * atrMult).toFixed(4));
        takeProfit = parseFloat((entryPrice + atr * tpMult).toFixed(4));
        console.log(`[executeAutoTrade] Dynamic SL/TP — ATR: ${atr.toFixed(4)}, SL: ${stopLoss}, TP: ${takeProfit}`);
      }
    } catch (e) {
      console.warn('[executeAutoTrade] ATR calc failed:', e.message);
    }

    // Buat TP order
    const tpOrder = await base44.entities.DEXOrder.create({
      orderType: 'take-profit',
      chainId: 1,
      chainName: strategy.chain || 'Ethereum',
      fromTokenSymbol: fromToken,
      fromTokenAddress: '0x0000000000000000000000000000000000000000',
      toTokenSymbol: 'USDT',
      toTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      amount: quantity,
      triggerPrice: takeProfit,
      status: 'pending',
      notes: `Auto-trade TP: ${strategy.name}`,
    });

    // Buat SL order
    const slOrder = await base44.entities.DEXOrder.create({
      orderType: 'stop-loss',
      chainId: 1,
      chainName: strategy.chain || 'Ethereum',
      fromTokenSymbol: fromToken,
      fromTokenAddress: '0x0000000000000000000000000000000000000000',
      toTokenSymbol: 'USDT',
      toTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      amount: quantity,
      triggerPrice: stopLoss,
      status: 'pending',
      notes: `Auto-trade SL: ${strategy.name}`,
    });

    // Catat trade performance
    await base44.entities.TradePerformance.create({
      dexOrderId: tpOrder.id,
      orderType: 'take-profit',
      chainName: strategy.chain || 'Ethereum',
      fromTokenSymbol: fromToken,
      toTokenSymbol: 'USDT',
      entryPrice,
      exitPrice: takeProfit,
      quantity,
      status: 'pending',
      executedDate: new Date().toISOString(),
      notes: `Auto-traded via strategy: ${strategy.name}`,
    });

    // Update stats strategi
    const currentStats = strategy.stats || { totalTrades: 0, winningTrades: 0, totalPL: 0, winRate: 0 };
    await base44.entities.AutoTradingStrategy.update(strategyId, {
      stats: { ...currentStats, totalTrades: (currentStats.totalTrades || 0) + 1 },
      lastAnalyzedAt: new Date().toISOString(),
    });

    // Email notifikasi ke user
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `🤖 Auto-Trade Dieksekusi: ${strategy.name}`,
        body: `
          <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:12px;">
            <h2 style="color:#818cf8;">🤖 Auto-Trade Berhasil Dieksekusi</h2>
            <p>Strategi <strong>${strategy.name}</strong> telah mengeksekusi trade.</p>
            <table style="width:100%;margin:16px 0;">
              <tr><td style="color:#94a3b8;">Pair:</td><td style="color:#fff;font-weight:bold;">${strategy.pair}</td></tr>
              <tr><td style="color:#94a3b8;">Entry Price:</td><td style="color:#4ade80;">$${entryPrice?.toFixed(4)}</td></tr>
              <tr><td style="color:#94a3b8;">Stop Loss:</td><td style="color:#f87171;">$${stopLoss?.toFixed(4)}</td></tr>
              <tr><td style="color:#94a3b8;">Take Profit:</td><td style="color:#4ade80;">$${takeProfit?.toFixed(4)}</td></tr>
              <tr><td style="color:#94a3b8;">Qty:</td><td style="color:#fff;">${quantity} ${fromToken}</td></tr>
              <tr><td style="color:#94a3b8;">Confidence:</td><td style="color:#fbbf24;">${opportunity?.confidence || 'N/A'}%</td></tr>
            </table>
            <p style="color:#64748b;font-size:11px;">© KriptoAman Auto-Trading System</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn('[executeAutoTrade] Email gagal:', emailErr.message);
    }

    return Response.json({
      executed: true,
      tpOrderId: tpOrder.id,
      slOrderId: slOrder.id,
      quantity,
      entryPrice,
      stopLoss,
      takeProfit,
    });

  } catch (error) {
    console.error('[executeAutoTrade] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});