export const PAPER_TRADING_STORAGE_KEY = 'ka_paper_trading_v1';
export const PAPER_STARTING_CASH = 100000;
export const PAPER_MAX_TRADES = 500;

const nowIso = () => new Date().toISOString();

export function createPaperAccount() {
  const now = nowIso();
  return {
    version: 1,
    startingCash: PAPER_STARTING_CASH,
    cash: PAPER_STARTING_CASH,
    realizedPnl: 0,
    positions: {},
    trades: [],
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

  return {
    version: 1,
    startingCash: PAPER_STARTING_CASH,
    cash: Math.max(0, finite(value.cash, PAPER_STARTING_CASH)),
    realizedPnl: finite(value.realizedPnl),
    positions,
    trades: Array.isArray(value.trades) ? value.trades.slice(0, PAPER_MAX_TRADES) : [],
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
    if (remaining <= 1e-10) delete state.positions[symbol];
    else state.positions[symbol] = { ...current, quantity: remaining };
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
    createdAt: nowIso(),
    simulated: true,
  };
  state.trades = [trade, ...state.trades].slice(0, PAPER_MAX_TRADES);
  state.updatedAt = nowIso();
  return { account: state, trade };
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
