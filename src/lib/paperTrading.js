export const PAPER_TRADING_STORAGE_KEY = 'ka_paper_trading_v1';
export const PAPER_STARTING_CASH = 100000;
export const PAPER_MAX_TRADES = 500;
export const PAPER_MAX_EQUITY_POINTS = 200;

const nowIso = () => new Date().toISOString();

export function createPaperAccount() {
  const now = nowIso();
  return {
    version: 2,
    startingCash: PAPER_STARTING_CASH,
    cash: PAPER_STARTING_CASH,
    realizedPnl: 0,
    positions: {},
    trades: [],
    riskOrders: {},
    equityHistory: [{ equity: PAPER_STARTING_CASH, createdAt: now, source: 'start' }],
    createdAt: now,
    updatedAt: now,
  };
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function sanitizePaperAccount(value) {
  if (!value || typeof value !== 'object') return createPaperAccount();
  const positions = {};
  for (const [symbol, position] of Object.entries(value.positions || {})) {
    const quantity = finite(position?.quantity);
    const avgPrice = finite(position?.avgPrice);
    if (quantity > 0 && avgPrice > 0) {
      positions[String(symbol).toUpperCase()] = {
        symbol: String(symbol).toUpperCase(),
        name: String(position?.name || symbol).slice(0, 80),
        quantity,
        avgPrice,
      };
    }
  }

  const riskOrders = {};
  for (const [symbol, risk] of Object.entries(value.riskOrders || {})) {
    const key = String(symbol).toUpperCase();
    if (!positions[key]) continue;
    const stopLossPrice = finite(risk?.stopLossPrice);
    const takeProfitPrice = finite(risk?.takeProfitPrice);
    if (stopLossPrice > 0 || takeProfitPrice > 0) {
      riskOrders[key] = {
        symbol: key,
        stopLossPrice: stopLossPrice > 0 ? stopLossPrice : null,
        takeProfitPrice: takeProfitPrice > 0 ? takeProfitPrice : null,
        updatedAt: risk?.updatedAt || nowIso(),
      };
    }
  }

  const equityHistory = Array.isArray(value.equityHistory)
    ? value.equityHistory
      .map((point) => ({
        equity: finite(point?.equity),
        createdAt: point?.createdAt || nowIso(),
        source: String(point?.source || 'snapshot').slice(0, 32),
      }))
      .filter((point) => point.equity >= 0)
      .slice(-PAPER_MAX_EQUITY_POINTS)
    : [];

  return {
    version: 2,
    startingCash: PAPER_STARTING_CASH,
    cash: Math.max(0, finite(value.cash, PAPER_STARTING_CASH)),
    realizedPnl: finite(value.realizedPnl),
    positions,
    trades: Array.isArray(value.trades) ? value.trades.slice(0, PAPER_MAX_TRADES) : [],
    riskOrders,
    equityHistory: equityHistory.length ? equityHistory : [{ equity: PAPER_STARTING_CASH, createdAt: value.createdAt || nowIso(), source: 'start' }],
    createdAt: value.createdAt || nowIso(),
    updatedAt: value.updatedAt || nowIso(),
  };
}

export function loadPaperAccount(storage = globalThis?.localStorage) {
  if (!storage) return createPaperAccount();
  try {
    const raw = storage.getItem(PAPER_TRADING_STORAGE_KEY);
    return raw ? sanitizePaperAccount(JSON.parse(raw)) : createPaperAccount();
  } catch {
    return createPaperAccount();
  }
}

export function savePaperAccount(account, storage = globalThis?.localStorage) {
  const next = sanitizePaperAccount(account);
  if (storage) storage.setItem(PAPER_TRADING_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function executePaperTrade(account, order) {
  const state = sanitizePaperAccount(account);
  const side = String(order?.side || '').toLowerCase();
  const symbol = String(order?.symbol || '').trim().toUpperCase();
  const name = String(order?.name || symbol).trim().slice(0, 80);
  const price = finite(order?.price);
  const usdAmount = finite(order?.usdAmount);

  if (!['buy', 'sell'].includes(side)) throw new Error('Unsupported paper order side');
  if (!symbol) throw new Error('Asset is required');
  if (!(price > 0)) throw new Error('Live market price is unavailable');
  if (!(usdAmount > 0)) throw new Error('Order amount must be greater than zero');

  const quantity = usdAmount / price;
  const current = state.positions[symbol] || { symbol, name, quantity: 0, avgPrice: 0 };
  let realizedDelta = 0;

  if (side === 'buy') {
    if (usdAmount > state.cash + 1e-8) throw new Error('Insufficient virtual cash');
    const newQuantity = current.quantity + quantity;
    const newCost = current.quantity * current.avgPrice + usdAmount;
    state.positions[symbol] = {
      symbol,
      name,
      quantity: newQuantity,
      avgPrice: newCost / newQuantity,
    };
    state.cash -= usdAmount;
  } else {
    if (quantity > current.quantity + 1e-10) throw new Error('Insufficient virtual position');
    realizedDelta = (price - current.avgPrice) * quantity;
    const remaining = Math.max(0, current.quantity - quantity);
    state.cash += usdAmount;
    state.realizedPnl += realizedDelta;
    if (remaining <= 1e-10) {
      delete state.positions[symbol];
      delete state.riskOrders[symbol];
    } else {
      state.positions[symbol] = { ...current, quantity: remaining };
    }
  }

  const trade = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    side,
    symbol,
    name,
    price,
    usdAmount,
    quantity,
    realizedPnl: realizedDelta,
    triggerReason: order?.triggerReason ? String(order.triggerReason).slice(0, 32) : null,
    createdAt: nowIso(),
    simulated: true,
  };
  state.trades = [trade, ...state.trades].slice(0, PAPER_MAX_TRADES);
  state.updatedAt = nowIso();
  return { account: state, trade };
}

export function setPaperRiskOrder(account, { symbol, stopLossPrice, takeProfitPrice }) {
  const state = sanitizePaperAccount(account);
  const key = String(symbol || '').trim().toUpperCase();
  if (!state.positions[key]) throw new Error('Virtual position is required');
  const position = state.positions[key];
  const stop = finite(stopLossPrice);
  const take = finite(takeProfitPrice);
  if (stop > 0 && stop >= position.avgPrice) throw new Error('Stop-loss must be below average entry');
  if (take > 0 && take <= position.avgPrice) throw new Error('Take-profit must be above average entry');
  if (!(stop > 0) && !(take > 0)) {
    delete state.riskOrders[key];
  } else {
    state.riskOrders[key] = {
      symbol: key,
      stopLossPrice: stop > 0 ? stop : null,
      takeProfitPrice: take > 0 ? take : null,
      updatedAt: nowIso(),
    };
  }
  state.updatedAt = nowIso();
  return state;
}

export function evaluatePaperRiskOrders(account, priceBySymbol = {}) {
  let state = sanitizePaperAccount(account);
  const triggered = [];
  for (const [symbol, risk] of Object.entries(state.riskOrders || {})) {
    const position = state.positions[symbol];
    const price = finite(priceBySymbol[symbol]);
    if (!position || !(price > 0)) continue;
    const reason = risk.stopLossPrice && price <= risk.stopLossPrice
      ? 'stop-loss'
      : risk.takeProfitPrice && price >= risk.takeProfitPrice
        ? 'take-profit'
        : null;
    if (!reason) continue;
    const result = executePaperTrade(state, {
      side: 'sell',
      symbol,
      name: position.name,
      price,
      usdAmount: position.quantity * price,
      triggerReason: reason,
    });
    state = result.account;
    triggered.push(result.trade);
  }
  return { account: state, triggered };
}

export function recordPaperEquitySnapshot(account, equity, source = 'market') {
  const state = sanitizePaperAccount(account);
  const value = finite(equity);
  if (!(value >= 0)) return state;
  const previous = state.equityHistory[state.equityHistory.length - 1];
  if (previous && Math.abs(previous.equity - value) < 0.005 && source === 'market') return state;
  state.equityHistory = [
    ...state.equityHistory,
    { equity: value, createdAt: nowIso(), source: String(source).slice(0, 32) },
  ].slice(-PAPER_MAX_EQUITY_POINTS);
  state.updatedAt = nowIso();
  return state;
}

export function calculatePaperMetrics(account, priceBySymbol = {}) {
  const state = sanitizePaperAccount(account);
  let positionsValue = 0;
  let costBasis = 0;
  let unrealizedPnl = 0;

  const positions = Object.values(state.positions).map((position) => {
    const currentPrice = finite(priceBySymbol[position.symbol], position.avgPrice);
    const marketValue = position.quantity * currentPrice;
    const positionCost = position.quantity * position.avgPrice;
    const pnl = marketValue - positionCost;
    positionsValue += marketValue;
    costBasis += positionCost;
    unrealizedPnl += pnl;
    return { ...position, currentPrice, marketValue, costBasis: positionCost, unrealizedPnl: pnl };
  });

  const equity = state.cash + positionsValue;
  return {
    cash: state.cash,
    positionsValue,
    costBasis,
    equity,
    realizedPnl: state.realizedPnl,
    unrealizedPnl,
    totalPnl: equity - PAPER_STARTING_CASH,
    totalReturnPct: ((equity - PAPER_STARTING_CASH) / PAPER_STARTING_CASH) * 100,
    positions,
  };
}

export function calculatePaperPerformance(account) {
  const state = sanitizePaperAccount(account);
  const closedTrades = state.trades.filter((trade) => trade.side === 'sell');
  const winners = closedTrades.filter((trade) => finite(trade.realizedPnl) > 0);
  const losers = closedTrades.filter((trade) => finite(trade.realizedPnl) < 0);
  const grossProfit = winners.reduce((sum, trade) => sum + finite(trade.realizedPnl), 0);
  const grossLoss = Math.abs(losers.reduce((sum, trade) => sum + finite(trade.realizedPnl), 0));
  const realizedValues = closedTrades.map((trade) => finite(trade.realizedPnl));

  let peak = -Infinity;
  let maxDrawdownPct = 0;
  for (const point of state.equityHistory) {
    const equity = finite(point.equity);
    peak = Math.max(peak, equity);
    if (peak > 0) maxDrawdownPct = Math.max(maxDrawdownPct, ((peak - equity) / peak) * 100);
  }

  return {
    trades: state.trades.length,
    closedTrades: closedTrades.length,
    wins: winners.length,
    losses: losers.length,
    winRate: closedTrades.length ? (winners.length / closedTrades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    bestTrade: realizedValues.length ? Math.max(...realizedValues) : 0,
    worstTrade: realizedValues.length ? Math.min(...realizedValues) : 0,
    maxDrawdownPct,
    equityHistory: state.equityHistory,
  };
}
