import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = new URL('../chain/solana-liquidity/preview-pool-economics.mjs', import.meta.url);

function assertNear(actual, expected, epsilon, label) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `${label}: expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

test('pool economics preview computes an sKAM/SOL opening ratio without network writes', () => {
  const run = spawnSync(process.execPath, [script.pathname], {
    encoding: 'utf8',
    env: {
      ...process.env,
      POOL_TOKEN_AMOUNT: '1000000',
      POOL_QUOTE_AMOUNT: '0.20',
      QUOTE_SYMBOL: 'SOL',
      TOKEN_TOTAL_SUPPLY: '1000000000',
      QUOTE_USD_PRICE: '',
    },
  });

  assert.equal(run.status, 0, run.stderr);
  const output = JSON.parse(run.stdout);
  assert.equal(output.mode, 'PRE_SIGN_READ_ONLY_PREVIEW');
  assert.equal(output.quoteSymbol, 'SOL');
  assertNear(output.impliedOpeningQuotePerToken, 2e-7, 1e-18, 'SOL per sKAM ratio');
  assertNear(output.tokenSupplyAllocatedToPoolPct, 0.1, 1e-12, 'pool supply allocation');
  assertNear(output.impliedFdvInQuoteAsset, 200, 1e-9, 'implied FDV in SOL');
  assertNear(output.approximateInitialPoolValueInQuoteAsset, 0.4, 1e-12, 'pool value in SOL');
  assert.equal(output.impliedOpeningPriceUsdPerToken, null);
  assert.equal(output.impliedFdvUsd, null);
});

test('pool economics preview refuses impossible or missing inputs', () => {
  const impossible = spawnSync(process.execPath, [script.pathname], {
    encoding: 'utf8',
    env: {
      ...process.env,
      POOL_TOKEN_AMOUNT: '200',
      POOL_QUOTE_AMOUNT: '0.2',
      TOKEN_TOTAL_SUPPLY: '100',
    },
  });
  assert.notEqual(impossible.status, 0);
  assert.match(impossible.stderr, /cannot exceed TOKEN_TOTAL_SUPPLY/);

  const missing = spawnSync(process.execPath, [script.pathname], {
    encoding: 'utf8',
    env: {
      ...process.env,
      POOL_TOKEN_AMOUNT: '',
      POOL_QUOTE_AMOUNT: '',
      TOKEN_TOTAL_SUPPLY: '',
    },
  });
  assert.notEqual(missing.status, 0);
});
