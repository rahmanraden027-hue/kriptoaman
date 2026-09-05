import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = new URL('../chain/solana-liquidity/preview-pool-economics.mjs', import.meta.url);

test('pool economics preview computes the opening ratio without network writes', () => {
  const run = spawnSync(process.execPath, [script.pathname], {
    encoding: 'utf8',
    env: {
      ...process.env,
      POOL_TOKEN_AMOUNT: '100000',
      POOL_USDC_AMOUNT: '1000',
      TOKEN_TOTAL_SUPPLY: '1000000',
    },
  });

  assert.equal(run.status, 0, run.stderr);
  const output = JSON.parse(run.stdout);
  assert.equal(output.mode, 'PRE_SIGN_READ_ONLY_PREVIEW');
  assert.equal(output.impliedOpeningPriceUsdPerToken, 0.01);
  assert.equal(output.tokenSupplyAllocatedToPoolPct, 10);
  assert.equal(output.impliedFdvUsd, 10000);
  assert.equal(output.approximateInitialPoolValueUsd, 2000);
});

test('pool economics preview refuses impossible or missing inputs', () => {
  const impossible = spawnSync(process.execPath, [script.pathname], {
    encoding: 'utf8',
    env: {
      ...process.env,
      POOL_TOKEN_AMOUNT: '200',
      POOL_USDC_AMOUNT: '10',
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
      POOL_USDC_AMOUNT: '',
      TOKEN_TOTAL_SUPPLY: '',
    },
  });
  assert.notEqual(missing.status, 0);
});
