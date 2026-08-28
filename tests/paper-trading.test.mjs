import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PAPER_STARTING_CASH,
  calculatePaperMetrics,
  calculatePaperPerformance,
  createPaperAccount,
  evaluatePaperRiskOrders,
  executePaperTrade,
  recordPaperEquitySnapshot,
  setPaperRiskOrder,
} from '../src/lib/paperTrading.js';

test('paper account starts with virtual cash only', () => {
  const account = createPaperAccount();
  assert.equal(account.cash, PAPER_STARTING_CASH);
  assert.deepEqual(account.positions, {});
});

test('buy creates an isolated virtual position', () => {
  const { account } = executePaperTrade(createPaperAccount(), {
    side: 'buy', symbol: 'BTC', name: 'Bitcoin', price: 100000, usdAmount: 10000,
  });
  assert.equal(account.cash, 90000);
  assert.equal(account.positions.BTC.quantity, 0.1);
  assert.equal(account.positions.BTC.avgPrice, 100000);
});

test('sell realizes paper pnl and never allows shorting', () => {
  const bought = executePaperTrade(createPaperAccount(), {
    side: 'buy', symbol: 'ETH', name: 'Ethereum', price: 4000, usdAmount: 8000,
  }).account;
  const sold = executePaperTrade(bought, {
    side: 'sell', symbol: 'ETH', name: 'Ethereum', price: 4400, usdAmount: 4400,
  }).account;
  assert.equal(Math.round(sold.realizedPnl), 400);
  assert.throws(() => executePaperTrade(sold, {
    side: 'sell', symbol: 'ETH', name: 'Ethereum', price: 4400, usdAmount: 10000,
  }), /Insufficient virtual position/);
});

test('metrics mark positions to supplied market prices', () => {
  const account = executePaperTrade(createPaperAccount(), {
    side: 'buy', symbol: 'BTC', name: 'Bitcoin', price: 100000, usdAmount: 10000,
  }).account;
  const metrics = calculatePaperMetrics(account, { BTC: 105000 });
  assert.equal(metrics.equity, 100500);
  assert.equal(metrics.unrealizedPnl, 500);
  assert.equal(metrics.totalPnl, 500);
});

test('virtual stop-loss closes the position without shorting', () => {
  let account = executePaperTrade(createPaperAccount(), {
    side: 'buy', symbol: 'BTC', name: 'Bitcoin', price: 100000, usdAmount: 10000,
  }).account;
  account = setPaperRiskOrder(account, { symbol: 'BTC', stopLossPrice: 95000, takeProfitPrice: 110000 });
  const evaluated = evaluatePaperRiskOrders(account, { BTC: 94000 });
  assert.equal(evaluated.triggered.length, 1);
  assert.equal(evaluated.triggered[0].triggerReason, 'stop-loss');
  assert.equal(evaluated.account.positions.BTC, undefined);
  assert.equal(Math.round(evaluated.account.realizedPnl), -600);
});

test('virtual take-profit closes the position when market reaches target', () => {
  let account = executePaperTrade(createPaperAccount(), {
    side: 'buy', symbol: 'ETH', name: 'Ethereum', price: 4000, usdAmount: 8000,
  }).account;
  account = setPaperRiskOrder(account, { symbol: 'ETH', stopLossPrice: 3600, takeProfitPrice: 4400 });
  const evaluated = evaluatePaperRiskOrders(account, { ETH: 4500 });
  assert.equal(evaluated.triggered.length, 1);
  assert.equal(evaluated.triggered[0].triggerReason, 'take-profit');
  assert.equal(Math.round(evaluated.account.realizedPnl), 1000);
});

test('risk targets must be on the safe side of average entry', () => {
  const account = executePaperTrade(createPaperAccount(), {
    side: 'buy', symbol: 'BTC', name: 'Bitcoin', price: 100000, usdAmount: 10000,
  }).account;
  assert.throws(() => setPaperRiskOrder(account, { symbol: 'BTC', stopLossPrice: 101000 }), /below average entry/);
  assert.throws(() => setPaperRiskOrder(account, { symbol: 'BTC', takeProfitPrice: 99000 }), /above average entry/);
});

test('performance analytics calculate win rate and max drawdown', () => {
  let account = createPaperAccount();
  account = executePaperTrade(account, { side: 'buy', symbol: 'BTC', name: 'Bitcoin', price: 100000, usdAmount: 10000 }).account;
  account = executePaperTrade(account, { side: 'sell', symbol: 'BTC', name: 'Bitcoin', price: 110000, usdAmount: 11000 }).account;
  account = recordPaperEquitySnapshot(account, 101000, 'trade');
  account = recordPaperEquitySnapshot(account, 97000, 'market');
  const performance = calculatePaperPerformance(account);
  assert.equal(performance.closedTrades, 1);
  assert.equal(performance.wins, 1);
  assert.equal(performance.winRate, 100);
  assert.ok(performance.maxDrawdownPct > 3.9 && performance.maxDrawdownPct < 4.1);
});
