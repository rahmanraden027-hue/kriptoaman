import 'dotenv/config';
import fs from 'node:fs';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required value is empty: ${name}`);
  return value;
}

const tokenMint = required('TOKEN_MINT');
const expectedPool = process.env.POOL_ID?.trim() || null;
const endpoint = `https://api.dexscreener.com/token-pairs/v1/solana/${encodeURIComponent(tokenMint)}`;

const response = await fetch(endpoint, {
  headers: { accept: 'application/json' },
  signal: AbortSignal.timeout(15_000),
});
if (!response.ok) throw new Error(`DEX Screener HTTP ${response.status}`);

const pairs = await response.json();
if (!Array.isArray(pairs)) throw new Error('Unexpected DEX Screener response shape.');

const raydiumPairs = pairs.filter((pair) => pair?.chainId === 'solana' && String(pair?.dexId ?? '').toLowerCase().includes('raydium'));
if (raydiumPairs.length === 0) {
  console.error('DEX Screener has not indexed a Raydium pair for this token yet. This is not a listing failure; retry after the pool has a real transaction.');
  process.exit(3);
}

let selected = raydiumPairs[0];
if (expectedPool) {
  selected = raydiumPairs.find((pair) => pair.pairAddress === expectedPool);
  if (!selected) {
    console.error(`Raydium pair(s) exist, but configured POOL_ID ${expectedPool} is not indexed yet.`);
    process.exit(4);
  }
}

const buys = Object.values(selected.txns ?? {}).reduce((sum, bucket) => sum + Number(bucket?.buys ?? 0), 0);
const sells = Object.values(selected.txns ?? {}).reduce((sum, bucket) => sum + Number(bucket?.sells ?? 0), 0);
const liquidityUsd = Number(selected.liquidity?.usd ?? 0);

if (!Number.isFinite(liquidityUsd) || liquidityUsd <= 0) {
  throw new Error('Pair is indexed but DEX Screener does not report positive USD liquidity yet.');
}
if (buys + sells < 1) {
  throw new Error('Pair is indexed but no transaction is observable in the returned DEX Screener windows yet.');
}

// Public network observations are printed for operator inspection but are not persisted verbatim.
const publicObservation = {
  chainId: selected.chainId,
  dexId: selected.dexId,
  pairAddress: selected.pairAddress,
  pairUrl: selected.url,
  baseToken: selected.baseToken,
  quoteToken: selected.quoteToken,
  priceUsd: selected.priceUsd ?? null,
  liquidityUsd,
  observedBuysAcrossWindows: buys,
  observedSellsAcrossWindows: sells,
  volume: selected.volume ?? null,
  fdv: selected.fdv ?? null,
  marketCap: selected.marketCap ?? null,
};
console.log(JSON.stringify(publicObservation, null, 2));

// Persist only validation results plus operator-supplied identifiers. This avoids treating
// remote API content as trusted durable evidence while still recording the completed gate.
const evidence = {
  checkedAt: new Date().toISOString(),
  indexed: true,
  tokenMint,
  expectedPool,
  raydiumPairObserved: true,
  positiveUsdLiquidityObserved: true,
  transactionObserved: true,
};

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/dexscreener-verification.json', JSON.stringify(evidence, null, 2));
console.log('DEX Screener indexing verified from public API.');
console.log('Durable validation gate:', JSON.stringify(evidence, null, 2));
