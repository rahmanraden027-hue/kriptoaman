import fs from 'node:fs';

const PAIR_ID = '7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD';
const OPERATOR = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const RPC_URL = process.env.RPC_URL || 'https://solana-rpc.publicnode.com';
const TARGETS_USD = (process.env.LIQUIDITY_TARGETS_USD || '100,250,500')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter((v) => Number.isFinite(v) && v > 0)
  .sort((a, b) => a - b);
const MIN_OPERATOR_SOL_RESERVE = Number(process.env.MIN_OPERATOR_SOL_RESERVE || '0.025');
const FEE_BUFFER_SOL = Number(process.env.LIQUIDITY_FEE_BUFFER_SOL || '0.001');

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

async function rpc(method, params = []) {
  const body = await jsonFetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (body.error) throw new Error(`RPC ${method} failed: ${JSON.stringify(body.error)}`);
  return body.result;
}

const dex = await jsonFetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${PAIR_ID}`);
const pair = Array.isArray(dex?.pairs) ? dex.pairs.find((p) => p?.pairAddress === PAIR_ID) : null;
if (!pair) throw new Error(`DEX Screener pair not found: ${PAIR_ID}`);
if (pair?.dexId !== 'raydium') throw new Error(`Unexpected DEX: ${pair?.dexId || 'unknown'}`);

const liquidityUsd = Number(pair?.liquidity?.usd);
const quoteLiquiditySol = Number(pair?.liquidity?.quote);
if (!Number.isFinite(liquidityUsd) || liquidityUsd <= 0) throw new Error('DEX Screener liquidity.usd is unavailable.');
if (!Number.isFinite(quoteLiquiditySol) || quoteLiquiditySol <= 0) throw new Error('DEX Screener liquidity.quote is unavailable.');

// For a balanced constant-product pair, total pool USD liquidity is approximately
// two times the quote-side USD value. This is planning evidence only, not an execution quote.
const impliedSolUsd = liquidityUsd / (2 * quoteLiquiditySol);
if (!Number.isFinite(impliedSolUsd) || impliedSolUsd <= 0) throw new Error('Unable to derive implied SOL/USD from live pair liquidity.');

const balance = await rpc('getBalance', [OPERATOR, { commitment: 'confirmed' }]);
const operatorSol = Number(balance?.value || 0) / 1e9;
const safelyAvailableSol = Math.max(0, operatorSol - MIN_OPERATOR_SOL_RESERVE - FEE_BUFFER_SOL);

const targets = TARGETS_USD.map((targetUsd) => {
  const additionalTotalUsd = Math.max(0, targetUsd - liquidityUsd);
  const quoteSideUsd = additionalTotalUsd / 2;
  const requiredAdditionalSol = quoteSideUsd / impliedSolUsd;
  const recommendedPlanningSol = requiredAdditionalSol * 1.1; // planning headroom only
  return {
    targetUsd,
    currentLiquidityUsd: liquidityUsd,
    additionalTotalUsdNeededApprox: additionalTotalUsd,
    requiredAdditionalSolApprox: requiredAdditionalSol,
    planningSolWith10PctHeadroom: recommendedPlanningSol,
    currentWalletCanSafelyCoverApprox: safelyAvailableSol >= recommendedPlanningSol,
    operatorSolShortfallApprox: Math.max(0, recommendedPlanningSol - safelyAvailableSol),
  };
});

const report = {
  audit: 'sKAM read-only liquidity capacity planner',
  checkedAt: new Date().toISOString(),
  mode: 'READ_ONLY_NO_TRANSACTION',
  pairId: PAIR_ID,
  operator: OPERATOR,
  live: {
    liquidityUsd,
    quoteLiquiditySol,
    impliedSolUsd,
    priceUsd: pair?.priceUsd ? Number(pair.priceUsd) : null,
    volume24hUsd: Number(pair?.volume?.h24 || 0),
    txns24h: pair?.txns?.h24 || null,
  },
  wallet: {
    operatorSol,
    minimumReserveSol: MIN_OPERATOR_SOL_RESERVE,
    feeBufferSol: FEE_BUFFER_SOL,
    safelyAvailableSol,
  },
  targets,
  policy: {
    noExecutionPerformed: true,
    note: 'This planner does not sign or submit transactions. A wallet-approved liquidity transaction must be reviewed separately and should remain staged.',
  },
};

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/skam-liquidity-readonly-plan.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
