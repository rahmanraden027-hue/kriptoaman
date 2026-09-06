export const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function decimalToRaw(value, decimals) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error(`Invalid decimal amount: ${value}`);
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > decimals) throw new Error(`Too many decimal places for ${decimals} decimals: ${value}`);
  return BigInt(whole + fraction.padEnd(decimals, '0'));
}

export function rawToDecimal(raw, decimals, precision = 8) {
  const n = BigInt(raw);
  const scale = 10n ** BigInt(decimals);
  const whole = n / scale;
  const fraction = (n % scale).toString().padStart(decimals, '0').slice(0, Math.min(decimals, precision)).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

export function profitBps(inputRaw, outputRaw) {
  const input = BigInt(inputRaw);
  const output = BigInt(outputRaw);
  if (input <= 0n) throw new Error('Input must be positive');
  return Number(((output - input) * 1_000_000n) / input) / 100;
}

export function routeLabels(quote) {
  return [...new Set((quote?.routePlan || []).map((step) => step?.swapInfo?.label).filter(Boolean))];
}

export function ammKeys(quote) {
  return new Set((quote?.routePlan || []).map((step) => step?.swapInfo?.ammKey).filter(Boolean));
}

export function hasSharedAmm(a, b) {
  const left = ammKeys(a);
  for (const key of ammKeys(b)) if (left.has(key)) return true;
  return false;
}

export function priceImpactPct(quote) {
  const raw = Number(quote?.priceImpactPct || 0);
  return Number.isFinite(raw) ? raw * 100 : Infinity;
}

export function orderedVenuePairs(venues) {
  const out = [];
  for (const buy of venues) {
    for (const sell of venues) {
      if (buy !== sell) out.push([buy, sell]);
    }
  }
  return out;
}

export function evaluateRoundTrip({ inputRaw, outputRaw, executionCostBps = 0, minNetProfitBps = 0 }) {
  const grossProfitBps = profitBps(inputRaw, outputRaw);
  const netProfitBps = grossProfitBps - Number(executionCostBps || 0);
  return {
    grossProfitBps,
    netProfitBps,
    profitable: netProfitBps >= Number(minNetProfitBps || 0),
  };
}
