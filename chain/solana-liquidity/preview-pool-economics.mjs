import 'dotenv/config';

function requiredPositiveNumber(name) {
  const raw = process.env[name]?.trim();
  if (!raw) throw new Error(`Required value is empty: ${name}`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number.`);
  }
  return value;
}

const tokenAmount = requiredPositiveNumber('POOL_TOKEN_AMOUNT');
const usdcAmount = requiredPositiveNumber('POOL_USDC_AMOUNT');
const totalSupplyRaw = process.env.TOKEN_TOTAL_SUPPLY?.trim() || null;
const totalSupply = totalSupplyRaw ? Number(totalSupplyRaw) : null;

if (totalSupply !== null && (!Number.isFinite(totalSupply) || totalSupply <= 0)) {
  throw new Error('TOKEN_TOTAL_SUPPLY must be a finite positive number when provided.');
}
if (totalSupply !== null && tokenAmount > totalSupply) {
  throw new Error('POOL_TOKEN_AMOUNT cannot exceed TOKEN_TOTAL_SUPPLY.');
}

const impliedPriceUsd = usdcAmount / tokenAmount;
const poolTokenSharePct = totalSupply === null ? null : (tokenAmount / totalSupply) * 100;
const impliedFdvUsd = totalSupply === null ? null : impliedPriceUsd * totalSupply;
const initialPoolValueUsdApprox = usdcAmount * 2;

const preview = {
  mode: 'PRE_SIGN_READ_ONLY_PREVIEW',
  tokenAmount,
  usdcAmount,
  impliedOpeningPriceUsdPerToken: impliedPriceUsd,
  approximateInitialPoolValueUsd: initialPoolValueUsdApprox,
  totalSupply,
  tokenSupplyAllocatedToPoolPct: poolTokenSharePct,
  impliedFdvUsd,
  warnings: [
    'This is a ratio preview, not a market-price guarantee.',
    'Actual execution price can move immediately after swaps and fees.',
    'DEX Screener price/FDV must be treated as observed market data only after the real pool is indexed.',
    'Do not use circular trades or treasury self-trading to manufacture volume.',
  ],
};

console.log(JSON.stringify(preview, null, 2));
