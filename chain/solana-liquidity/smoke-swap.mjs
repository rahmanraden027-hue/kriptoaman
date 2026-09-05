import 'dotenv/config';
import fs from 'node:fs';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Raydium, TxVersion, CurveCalculator } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required value is empty: ${name}`);
  return value;
}

function uiToRaw(value, decimals) {
  const amount = new Decimal(value);
  if (!amount.isFinite() || amount.lte(0)) throw new Error(`Amount must be positive: ${value}`);
  const raw = amount.mul(new Decimal(10).pow(decimals));
  if (!raw.isInteger()) throw new Error(`Amount ${value} has more precision than mint decimals=${decimals}`);
  return new BN(raw.toFixed(0));
}

const rpcUrl = required('RPC_URL');
const keypairPath = required('KEYPAIR');
const poolId = new PublicKey(required('POOL_ID'));
const tokenMint = new PublicKey(required('TOKEN_MINT'));
const quoteMint = new PublicKey(required('QUOTE_MINT'));
const inputUi = required('SMOKE_INPUT_UI');
const direction = required('SMOKE_DIRECTION');
const slippage = Number(process.env.SMOKE_SLIPPAGE ?? '0.01');

if (process.env.CONFIRM_SMOKE_SWAP !== 'EXECUTE_ONE_REAL_SMOKE_SWAP') {
  throw new Error('Refusing real swap. Set CONFIRM_SMOKE_SWAP=EXECUTE_ONE_REAL_SMOKE_SWAP for exactly one functional smoke trade.');
}
if (!['quote-to-token', 'token-to-quote'].includes(direction)) throw new Error('SMOKE_DIRECTION must be quote-to-token or token-to-quote.');
if (!Number.isFinite(slippage) || slippage <= 0 || slippage > 0.05) throw new Error('SMOKE_SLIPPAGE must be >0 and <=0.05.');
if (!fs.existsSync(keypairPath)) throw new Error('KEYPAIR must point to an existing local keypair file.');

const owner = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf8'))));
const connection = new Connection(rpcUrl, 'confirmed');
const raydium = await Raydium.load({
  owner,
  connection,
  cluster: 'mainnet',
  disableFeatureCheck: true,
  blockhashCommitment: 'finalized',
});

const { poolInfo, poolKeys, rpcData } = await raydium.cpmm.getPoolInfoFromRpc(poolId);
const expectedMints = new Set([tokenMint.toBase58(), quoteMint.toBase58()]);
if (!expectedMints.has(poolInfo.mintA.address) || !expectedMints.has(poolInfo.mintB.address)) {
  throw new Error('POOL_ID does not contain the configured TOKEN_MINT and QUOTE_MINT.');
}

const inputMint = direction === 'quote-to-token' ? quoteMint : tokenMint;
const inputInfo = await raydium.token.getTokenInfo(inputMint);
const inputAmount = uiToRaw(inputUi, inputInfo.decimals);
const baseIn = inputMint.equals(new PublicKey(poolInfo.mintA.address));

const swapResult = CurveCalculator.swap(
  inputAmount,
  baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
  baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
  rpcData.configInfo.tradeFeeRate,
);

console.log('Executing exactly one real smoke swap:', {
  poolId: poolId.toBase58(),
  direction,
  inputMint: inputMint.toBase58(),
  inputUi,
  slippage,
});

const { execute } = await raydium.cpmm.swap({
  poolInfo,
  poolKeys,
  inputAmount,
  swapResult,
  slippage,
  baseIn,
  txVersion: TxVersion.V0,
});
const { txId } = await execute({ sendAndConfirm: true });

fs.mkdirSync('artifacts', { recursive: true });
const evidence = {
  network: 'solana-mainnet-beta',
  poolId: poolId.toBase58(),
  direction,
  inputMint: inputMint.toBase58(),
  inputUi,
  slippage,
  txId,
  executedAt: new Date().toISOString(),
  purpose: 'functional-smoke-test-not-volume-generation',
};
const filename = `artifacts/smoke-${direction}-${Date.now()}.json`;
fs.writeFileSync(filename, JSON.stringify(evidence, null, 2));
console.log('Swap transaction:', txId);
console.log('Evidence:', filename);
