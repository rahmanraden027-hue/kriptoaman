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
const quoteAmount = requiredPositiveNumber('POOL_QUOTE_AMOUNT');
const quoteSymbol = process.env.QUOTE_SYMBOL?.trim() || 'QUOTE';
const totalSupplyRaw = process.env.TOKEN_TOTAL_SUPPLY?.trim() || null;
const totalSupply = totalSupplyRaw ? Number(totalSupplyRaw) : null;
const quoteUsdPriceRaw = process.env.QUOTE_USD_PRICE?.trim() || null;
const quoteUsdPrice = quoteUsdPriceRaw ? Number(quoteUsdPriceRaw) : null;

if (totalSupply !== null && (!Number.isFinite(totalSupply) || totalSupply <= 0)) {
  throw new Error('TOKEN_TOTAL_SUPPLY must be a finite positive number when provided.');
}
if (totalSupply !== null && tokenAmount > totalSupply) {
  throw new Error('POOL_TOKEN_AMOUNT cannot exceed TOKEN_TOTAL_SUPPLY.');
}
if (quoteUsdPrice !== null && (!Number.isFinite(quoteUsdPrice) || quoteUsdPrice <= 0)) {
  throw new Error('QUOTE_USD_PRICE must be a finite positive number when provided.');
}

const impliedQuotePerToken = quoteAmount / tokenAmount;
const poolTokenSharePct = totalSupply === null ? null : (tokenAmount / totalSupply) * 100;
const impliedFdvInQuoteAsset = totalSupply === null ? null : impliedQuotePerToken * totalSupply;
const initialPoolValueInQuoteAssetApprox = quoteAmount * 2;
const impliedOpeningPriceUsdPerToken = quoteUsdPrice === null ? null : impliedQuotePerToken * quoteUsdPrice;
const impliedFdvUsd = quoteUsdPrice === null || impliedFdvInQuoteAsset === null ? null : impliedFdvInQuoteAsset * quoteUsdPrice;

const preview = {
  mode: 'PRE_SIGN_READ_ONLY_PREVIEW',
  tokenAmount,
  quoteAmount,
  quoteSymbol,
  impliedOpeningQuotePerToken: impliedQuotePerToken,
  approximateInitialPoolValueInQuoteAsset: initialPoolValueInQuoteAssetApprox,
  totalSupply,
  tokenSupplyAllocatedToPoolPct: poolTokenSharePct,
  impliedFdvInQuoteAsset,
  quoteUsdPrice,
  impliedOpeningPriceUsdPerToken,
  impliedFdvUsd,
  warnings: [
    'This is a mathematical reserve-ratio preview, not a market-price guarantee.',
    'When the quote asset is SOL/WSOL, USD fields must remain null unless a current external SOL/USD reference is explicitly supplied.',
    'Actual execution price can move immediately after swaps and fees.',
    'DEX Screener price/FDV must be treated as observed market data only after the real pool is indexed.',
    'Do not use circular trades or treasury self-trading to manufacture volume.',
  ],
};

console.log(JSON.stringify(preview, null, 2));
