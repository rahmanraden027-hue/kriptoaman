const DEFAULT_RPC_URLS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];
const OWNER = (process.env.OPERATOR_PUBLIC_ADDRESS || '').trim();
const LIQUIDITY_SOL = Number(process.env.LIQUIDITY_SOL || '0.20');
const POOL_CREATION_FEE_SOL = Number(process.env.POOL_CREATION_FEE_SOL || '0.15');
const EST_POOL_RENT_SOL = Number(process.env.EST_POOL_RENT_SOL || '0.04');
const OPS_BUFFER_SOL = Number(process.env.OPS_BUFFER_SOL || '0.05');
const RPC_TIMEOUT_MS = Number(process.env.RPC_TIMEOUT_MS || '4000');

const configuredRpcUrls = (process.env.RPC_URLS || process.env.RPC_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const rpcUrls = [...new Set(configuredRpcUrls.length > 0 ? configuredRpcUrls : DEFAULT_RPC_URLS)];

if (!OWNER) throw new Error('OPERATOR_PUBLIC_ADDRESS is required.');
for (const [name, value] of Object.entries({ LIQUIDITY_SOL, POOL_CREATION_FEE_SOL, EST_POOL_RENT_SOL, OPS_BUFFER_SOL })) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be non-negative.`);
}
if (!Number.isFinite(RPC_TIMEOUT_MS) || RPC_TIMEOUT_MS < 500 || RPC_TIMEOUT_MS > 15000) {
  throw new Error('RPC_TIMEOUT_MS must be between 500 and 15000 milliseconds.');
}
if (rpcUrls.length === 0) throw new Error('At least one Solana RPC URL is required.');
for (const rpcUrl of rpcUrls) {
  const parsed = new URL(rpcUrl);
  if (parsed.protocol !== 'https:') throw new Error('Solana RPC URLs must use HTTPS.');
}

let id = 0;
async function readBalance(rpcUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'KriptoAman-sKAM-Wallet-Readiness/1.0',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++id,
        method: 'getBalance',
        params: [OWNER, { commitment: 'confirmed' }],
      }),
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const body = await response.json();
    if (body.error) throw new Error(`RPC getBalance: ${body.error.message || JSON.stringify(body.error)}`);
    const lamports = Number(body?.result?.value);
    if (!Number.isFinite(lamports) || lamports < 0) throw new Error('Invalid getBalance response.');
    return {
      sol: lamports / 1e9,
      rpcHost: new URL(rpcUrl).host,
    };
  } finally {
    clearTimeout(timer);
  }
}

let balance;
try {
  balance = await Promise.any(rpcUrls.map((rpcUrl) => readBalance(rpcUrl)));
} catch (aggregate) {
  const reasons = Array.isArray(aggregate?.errors)
    ? aggregate.errors.map((error) => error?.name === 'AbortError' ? 'timeout' : 'unavailable')
    : ['unavailable'];
  throw new Error(`All configured Solana RPC providers failed (${reasons.join(', ')}).`);
}

const plannedSol = LIQUIDITY_SOL + POOL_CREATION_FEE_SOL + EST_POOL_RENT_SOL + OPS_BUFFER_SOL;
const result = {
  mode: 'READ_ONLY_SOLANA_WALLET_READINESS',
  owner: OWNER,
  rpcProviderCount: rpcUrls.length,
  rpcHostUsed: balance.rpcHost,
  balanceSol: balance.sol,
  planned: {
    liquiditySol: LIQUIDITY_SOL,
    raydiumPoolCreationFeeSol: POOL_CREATION_FEE_SOL,
    estimatedPoolRentSol: EST_POOL_RENT_SOL,
    operationalBufferSol: OPS_BUFFER_SOL,
    minimumPlannedSol: plannedSol,
  },
  ready: {
    sol: balance.sol >= plannedSol,
  },
  note: 'Estimated rent is a planning value, not a guarantee. Real transactions must still be simulated/preflighted before signing.',
};
result.ready.all = result.ready.sol;

console.log(JSON.stringify(result, null, 2));
if (!result.ready.all) process.exitCode = 2;
