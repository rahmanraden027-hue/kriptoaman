import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PAPER_STARTING_CASH,
  calculatePaperMetrics,
  createPaperAccount,
  executePaperTrade,
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
