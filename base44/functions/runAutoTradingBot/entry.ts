import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ── Utility: fetch OHLCV data from Binance public API ──
async function fetchOHLCV(symbol, interval = '15m', limit = 100) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const data = await res.json();
  return data.map(k => ({
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

async function fetchCurrentPrice(symbol) {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  const data = await res.json();
  return parseFloat(data.price);
}

// ── Technical Indicators ──
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

function calcEMA(closes, period) {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcSMA(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (!ema12 || !ema26) return null;
  const macdLine = ema12 - ema26;
  return { macdLine, signal: calcEMA(closes.slice(-9).map((_, i) => ema12 - ema26), 9) || macdLine };
}

function calcBollinger(closes, period = 20, mult = 2) {
  const sma = calcSMA(closes, period);
  if (!sma) return null;
  const slice = closes.slice(-period);
  const variance = slice.reduce((acc, v) => acc + Math.pow(v - sma, 2), 0) / period;
  const stddev = Math.sqrt(variance);
  return { upper: sma + mult * stddev, middle: sma, lower: sma - mult * stddev };
}

function getIndicatorValue(indicator, candles) {
  const closes = candles.map(c => c.close);
  const currentClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];

  switch (indicator) {
    case 'RSI': return calcRSI(closes);
    case 'EMA9': return calcEMA(closes, 9);
    case 'EMA21': return calcEMA(closes, 21);
    case 'EMA50': return calcEMA(closes, 50);
    case 'EMA200': return calcEMA(closes, 200);
    case 'SMA20': return calcSMA(closes, 20);
    case 'SMA50': return calcSMA(closes, 50);
    case 'PRICE': return currentClose;
    case 'MACD': {
      const m = calcMACD(closes);
      return m ? m.macdLine : null;
    }
    case 'MACD_SIGNAL': {
      const m = calcMACD(closes);
      return m ? m.signal : null;
    }
    case 'BB_UPPER': {
      const bb = calcBollinger(closes);
      return bb ? bb.upper : null;
    }
    case 'BB_LOWER': {
      const bb = calcBollinger(closes);
      return bb ? bb.lower : null;
    }
    case 'VOLUME': return candles[candles.length - 1].volume;
    default: return null;
  }
}

function evaluateCondition(indicatorValue, condition, threshold, candles) {
  if (indicatorValue === null) return false;

  switch (condition) {
    case 'less_than': return indicatorValue < threshold;
    case 'greater_than': return indicatorValue > threshold;
    case 'less_than_equal': return indicatorValue <= threshold;
    case 'greater_than_equal': return indicatorValue >= threshold;
    case 'crosses_above': {
      // EMA golden cross check (EMA9 crosses above EMA21)
      return indicatorValue > threshold;
    }
    case 'crosses_below': {
      return indicatorValue < threshold;
    }
    case 'equals': return Math.abs(indicatorValue - threshold) < 0.01;
    default: return false;
  }
}

function evaluateRules(rules, candles) {
  if (!rules || rules.length === 0) return false;
  
  // Compute all indicator values once
  const indicatorCache = {};
  const getVal = (ind) => {
    if (!(ind in indicatorCache)) {
      indicatorCache[ind] = getIndicatorValue(ind, candles);
    }
    return indicatorCache[ind];
  };

  let result = true;
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const val = getVal(rule.indicator);
    const conditionMet = evaluateCondition(val, rule.condition, rule.value, candles);

    if (i === 0) {
      result = conditionMet;
    } else {
      if (rule.logic === 'OR') {
        result = result || conditionMet;
      } else {
        result = result && conditionMet;
      }
    }
  }
  return result;
}

// ── Main handler ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This can be called by automation (no user) or directly by admin
    let isScheduled = false;
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      isScheduled = true;
    }

    // Get all active trading rules
    const allRules = await base44.asServiceRole.entities.TradingRule.filter({ isActive: true });

    if (!allRules || allRules.length === 0) {
      return Response.json({ message: 'No active rules', processed: 0 });
    }

    const results = [];

    for (const rule of allRules) {
      try {
        const symbol = rule.pair.replace('/', '').toUpperCase();

        // Fetch market data
        const candles = await fetchOHLCV(symbol, '15m', 200);
        const currentPrice = parseFloat(candles[candles.length - 1].close);

        // Compute indicator snapshot
        const closes = candles.map(c => c.close);
        const indicatorSnapshot = {
          rsi: calcRSI(closes),
          ema9: calcEMA(closes, 9),
          ema21: calcEMA(closes, 21),
          ema50: calcEMA(closes, 50),
          sma20: calcSMA(closes, 20),
          price: currentPrice,
          macd: (() => { const m = calcMACD(closes); return m ? m.macdLine : null; })(),
          bb: calcBollinger(closes),
        };

        // Check for open position first
        const openPositions = await base44.asServiceRole.entities.OpenPosition.filter({
          ruleId: rule.id,
          status: 'open'
        });
        const hasOpenPosition = openPositions && openPositions.length > 0;
        const openPosition = hasOpenPosition ? openPositions[0] : null;

        let signal = 'hold';
        let triggeredRules = [];

        if (!hasOpenPosition) {
          // Check entry rules
          const entryTriggered = evaluateRules(rule.entryRules || [], candles);
          if (entryTriggered) {
            signal = 'buy';
            triggeredRules = (rule.entryRules || []).map(r => `${r.indicator} ${r.condition} ${r.value}`);
          }
        } else {
          // Check exit rules + SL/TP
          const exitTriggered = evaluateRules(rule.exitRules || [], candles);

          const priceDiff = currentPrice - openPosition.entryPrice;
          const pricePct = (priceDiff / openPosition.entryPrice) * 100;

          const hitTP = rule.takeProfitPercent && pricePct >= rule.takeProfitPercent;
          const hitSL = rule.stopLossPercent && pricePct <= -rule.stopLossPercent;

          if (hitTP) {
            signal = 'sell';
            triggeredRules = ['Take Profit triggered'];
          } else if (hitSL) {
            signal = 'sell';
            triggeredRules = ['Stop Loss triggered'];
          } else if (exitTriggered) {
            signal = 'sell';
            triggeredRules = (rule.exitRules || []).map(r => `${r.indicator} ${r.condition} ${r.value}`);
          }

          // Update unrealized PnL on open position
          const unrealizedPnL = priceDiff * openPosition.quantity;
          await base44.asServiceRole.entities.OpenPosition.update(openPosition.id, {
            currentPrice,
            unrealizedPnL: parseFloat(unrealizedPnL.toFixed(4)),
            unrealizedPnLPercent: parseFloat(pricePct.toFixed(2)),
          });
        }

        // Record signal
        const tradingSignal = await base44.asServiceRole.entities.TradingSignal.create({
          ruleId: rule.id,
          ruleName: rule.name,
          userEmail: rule.userEmail,
          pair: rule.pair,
          signal,
          price: currentPrice,
          indicatorValues: indicatorSnapshot,
          triggeredRules,
          executed: false,
          mode: rule.mode || 'paper',
        });

        // Execute if actionable
        if (signal === 'buy' && !hasOpenPosition) {
          const tradeAmount = rule.tradeAmount || 100;
          const quantity = parseFloat((tradeAmount / currentPrice).toFixed(8));
          const stopLossPrice = currentPrice * (1 - (rule.stopLossPercent || 5) / 100);
          const takeProfitPrice = currentPrice * (1 + (rule.takeProfitPercent || 10) / 100);

          // Open position
          await base44.asServiceRole.entities.OpenPosition.create({
            ruleId: rule.id,
            ruleName: rule.name,
            userEmail: rule.userEmail,
            pair: rule.pair,
            entryPrice: currentPrice,
            quantity,
            tradeAmount,
            stopLossPrice: parseFloat(stopLossPrice.toFixed(4)),
            takeProfitPrice: parseFloat(takeProfitPrice.toFixed(4)),
            currentPrice,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            status: 'open',
            mode: rule.mode || 'paper',
            entrySignalId: tradingSignal.id,
          });

          // Deduct from UserBalance if live mode
          if (rule.mode === 'live') {
            const balances = await base44.asServiceRole.entities.UserBalance.filter({
              userEmail: rule.userEmail,
              coin: 'USDT'
            });
            if (balances && balances.length > 0 && balances[0].amount >= tradeAmount) {
              await base44.asServiceRole.entities.UserBalance.update(balances[0].id, {
                amount: parseFloat((balances[0].amount - tradeAmount).toFixed(4))
              });
            }
          }

          await base44.asServiceRole.entities.TradingSignal.update(tradingSignal.id, {
            executed: true,
            executionResult: `BUY ${quantity} ${rule.pair} @ ${currentPrice}`
          });

        } else if (signal === 'sell' && hasOpenPosition) {
          const priceDiff = currentPrice - openPosition.entryPrice;
          const realizedPnL = parseFloat((priceDiff * openPosition.quantity).toFixed(4));
          const exitReason = triggeredRules[0]?.includes('Take Profit') ? 'take_profit'
            : triggeredRules[0]?.includes('Stop Loss') ? 'stop_loss' : 'signal';

          // Close position
          await base44.asServiceRole.entities.OpenPosition.update(openPosition.id, {
            status: 'closed',
            exitPrice: currentPrice,
            exitReason,
            realizedPnL,
            exitSignalId: tradingSignal.id,
            closedAt: new Date().toISOString(),
          });

          // Credit back to UserBalance if live mode
          if (rule.mode === 'live') {
            const balances = await base44.asServiceRole.entities.UserBalance.filter({
              userEmail: rule.userEmail,
              coin: 'USDT'
            });
            const returnAmount = openPosition.tradeAmount + realizedPnL;
            if (balances && balances.length > 0) {
              await base44.asServiceRole.entities.UserBalance.update(balances[0].id, {
                amount: parseFloat((balances[0].amount + returnAmount).toFixed(4))
              });
            }
          }

          // Update rule stats
          const stats = rule.stats || { totalTrades: 0, winTrades: 0, lossTrades: 0, totalPnL: 0, winRate: 0 };
          const newTotal = (stats.totalTrades || 0) + 1;
          const newWin = (stats.winTrades || 0) + (realizedPnL > 0 ? 1 : 0);
          const newLoss = (stats.lossTrades || 0) + (realizedPnL <= 0 ? 1 : 0);
          const newPnL = (stats.totalPnL || 0) + realizedPnL;
          await base44.asServiceRole.entities.TradingRule.update(rule.id, {
            stats: {
              totalTrades: newTotal,
              winTrades: newWin,
              lossTrades: newLoss,
              totalPnL: parseFloat(newPnL.toFixed(4)),
              winRate: parseFloat(((newWin / newTotal) * 100).toFixed(1)),
            },
            lastSignal: 'sell',
            lastCheckedAt: new Date().toISOString(),
            lastIndicatorSnapshot: indicatorSnapshot,
          });

          await base44.asServiceRole.entities.TradingSignal.update(tradingSignal.id, {
            executed: true,
            pnl: realizedPnL,
            executionResult: `SELL @ ${currentPrice}, PnL: ${realizedPnL > 0 ? '+' : ''}${realizedPnL} USDT`
          });

        } else {
          // Just update last checked
          await base44.asServiceRole.entities.TradingRule.update(rule.id, {
            lastSignal: signal,
            lastCheckedAt: new Date().toISOString(),
            lastIndicatorSnapshot: indicatorSnapshot,
          });
        }

        results.push({ rule: rule.name, signal, price: currentPrice });
      } catch (ruleErr) {
        results.push({ rule: rule.name, error: ruleErr.message });
      }
    }

    return Response.json({ message: 'Bot run complete', processed: allRules.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});