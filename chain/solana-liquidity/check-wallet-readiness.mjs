const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const OWNER = (process.env.OPERATOR_PUBLIC_ADDRESS || '').trim();
const LIQUIDITY_SOL = Number(process.env.LIQUIDITY_SOL || '0.20');
const POOL_CREATION_FEE_SOL = Number(process.env.POOL_CREATION_FEE_SOL || '0.15');
const EST_POOL_RENT_SOL = Number(process.env.EST_POOL_RENT_SOL || '0.04');
const OPS_BUFFER_SOL = Number(process.env.OPS_BUFFER_SOL || '0.05');

if (!OWNER) throw new Error('OPERATOR_PUBLIC_ADDRESS is required.');
for (const [name, value] of Object.entries({ LIQUIDITY_SOL, POOL_CREATION_FEE_SOL, EST_POOL_RENT_SOL, OPS_BUFFER_SOL })) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be non-negative.`);
}

let id = 0;
async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status} for ${method}`);
  const body = await response.json();
  if (body.error) throw new Error(`RPC ${method}: ${body.error.message || JSON.stringify(body.error)}`);
  return body.result;
}

const balanceResult = await rpc('getBalance', [OWNER, { commitment: 'confirmed' }]);
const sol = Number(balanceResult.value) / 1e9;
const plannedSol = LIQUIDITY_SOL + POOL_CREATION_FEE_SOL + EST_POOL_RENT_SOL + OPS_BUFFER_SOL;

const result = {
  mode: 'READ_ONLY_SOLANA_WALLET_READINESS',
  owner: OWNER,
  rpcUrl: RPC_URL,
  balanceSol: sol,
  planned: {
    liquiditySol: LIQUIDITY_SOL,
    raydiumPoolCreationFeeSol: POOL_CREATION_FEE_SOL,
    estimatedPoolRentSol: EST_POOL_RENT_SOL,
    operationalBufferSol: OPS_BUFFER_SOL,
    minimumPlannedSol: plannedSol,
  },
  ready: {
    sol: sol >= plannedSol,
  },
  note: 'Estimated rent is a planning value, not a guarantee. Real transactions must still be simulated/preflighted before signing.',
};
result.ready.all = result.ready.sol;

console.log(JSON.stringify(result, null, 2));
if (!result.ready.all) process.exitCode = 2;
