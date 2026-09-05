const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const OWNER = (process.env.OPERATOR_PUBLIC_ADDRESS || '').trim();
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const REQUIRED_USDC = Number(process.env.REQUIRED_USDC || '50');
const MIN_SOL = Number(process.env.MIN_SOL || '0.20');

if (!OWNER) throw new Error('OPERATOR_PUBLIC_ADDRESS is required.');
if (!Number.isFinite(REQUIRED_USDC) || REQUIRED_USDC < 0) throw new Error('REQUIRED_USDC must be non-negative.');
if (!Number.isFinite(MIN_SOL) || MIN_SOL < 0) throw new Error('MIN_SOL must be non-negative.');

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

const [balanceResult, tokenAccountsResult] = await Promise.all([
  rpc('getBalance', [OWNER, { commitment: 'confirmed' }]),
  rpc('getTokenAccountsByOwner', [OWNER, { mint: USDC_MINT }, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
]);

const sol = Number(balanceResult.value) / 1e9;
let usdc = 0;
for (const account of tokenAccountsResult.value || []) {
  const tokenAmount = account?.account?.data?.parsed?.info?.tokenAmount;
  const ui = tokenAmount?.uiAmountString;
  if (ui != null) usdc += Number(ui);
}

const result = {
  mode: 'READ_ONLY_SOLANA_WALLET_READINESS',
  owner: OWNER,
  rpcUrl: RPC_URL,
  balances: { sol, usdc },
  requirements: { minSol: MIN_SOL, requiredUsdc: REQUIRED_USDC },
  ready: { sol: sol >= MIN_SOL, usdc: usdc >= REQUIRED_USDC },
};
result.ready.all = result.ready.sol && result.ready.usdc;

console.log(JSON.stringify(result, null, 2));
if (!result.ready.all) process.exitCode = 2;
