import 'dotenv/config';
import fs from 'node:fs';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Percent, Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';

const SKAM_MINT = 'Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi';
const RAYDIUM_POOL_ID = '7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD';
const CANONICAL_WSOL = 'So11111111111111111111111111111111111111112';
const APPROVED_OPERATOR = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required value is empty: ${name}`);
  return value;
}

function positiveDecimal(name, value) {
  const n = new Decimal(value);
  if (!n.isFinite() || n.lte(0)) throw new Error(`${name} must be a positive number.`);
  return n;
}

function rawToUi(raw, decimals) {
  return new Decimal(raw.toString()).div(new Decimal(10).pow(decimals));
}

function uiToRaw(ui, decimals) {
  const raw = new Decimal(ui).mul(new Decimal(10).pow(decimals));
  if (!raw.isInteger()) throw new Error(`Amount ${ui} has more precision than decimals=${decimals}.`);
  return new BN(raw.toFixed(0));
}

async function tokenBalanceUi(connection, owner, mint) {
  const result = await connection.getTokenAccountsByOwner(
    owner,
    { mint },
    { encoding: 'jsonParsed', commitment: 'confirmed' },
  );
  return result.value.reduce((sum, entry) => {
    const amount = entry?.account?.data?.parsed?.info?.tokenAmount?.uiAmountString;
    return sum.add(new Decimal(amount || 0));
  }, new Decimal(0));
}

function stringifyDecimal(value) {
  return value instanceof Decimal ? value.toString() : value;
}

const executeMode = process.argv.includes('--execute');
const previewMode = !executeMode;
const rpcUrl = required('RPC_URL');
const quoteUi = positiveDecimal('LIQUIDITY_QUOTE_UI', process.env.LIQUIDITY_QUOTE_UI || '0.005');
const maxQuoteUi = positiveDecimal('MAX_LIQUIDITY_QUOTE_UI', process.env.MAX_LIQUIDITY_QUOTE_UI || '0.005');
const minSolReserve = positiveDecimal('MIN_OPERATOR_SOL_RESERVE', process.env.MIN_OPERATOR_SOL_RESERVE || '0.025');
const feeBufferSol = positiveDecimal('LIQUIDITY_FEE_BUFFER_SOL', process.env.LIQUIDITY_FEE_BUFFER_SOL || '0.001');
const slippageBps = Number(process.env.LIQUIDITY_SLIPPAGE_BPS || '100');

if (quoteUi.gt(maxQuoteUi)) {
  throw new Error(`Refusing liquidity stage: ${quoteUi.toString()} SOL exceeds MAX_LIQUIDITY_QUOTE_UI=${maxQuoteUi.toString()} SOL.`);
}
if (!Number.isInteger(slippageBps) || slippageBps < 1 || slippageBps > 300) {
  throw new Error('LIQUIDITY_SLIPPAGE_BPS must be an integer from 1 to 300 (0.01% to 3%).');
}

const connection = new Connection(rpcUrl, 'confirmed');
let owner;
let signer = null;

if (executeMode) {
  const keypairPath = required('KEYPAIR');
  if (!fs.existsSync(keypairPath)) throw new Error('KEYPAIR must point to an existing local keypair JSON file. Never commit or upload it.');
  signer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf8'))));
  if (signer.publicKey.toBase58() !== APPROVED_OPERATOR) {
    throw new Error(`Signer mismatch. Expected ${APPROVED_OPERATOR}, got ${signer.publicKey.toBase58()}.`);
  }
  if (process.env.CONFIRM_ADD_LIQUIDITY !== 'ADD_REAL_SKAM_LIQUIDITY') {
    throw new Error('Refusing real liquidity deposit. Set CONFIRM_ADD_LIQUIDITY=ADD_REAL_SKAM_LIQUIDITY only immediately before execution.');
  }
  owner = signer;
} else {
  owner = new PublicKey(APPROVED_OPERATOR);
}

const operatorPublicKey = new PublicKey(APPROVED_OPERATOR);
const skamMint = new PublicKey(SKAM_MINT);
const poolId = new PublicKey(RAYDIUM_POOL_ID);

const [balanceLamports, skamBalance] = await Promise.all([
  connection.getBalance(operatorPublicKey, 'confirmed'),
  tokenBalanceUi(connection, operatorPublicKey, skamMint),
]);
const solBalance = new Decimal(balanceLamports).div(1e9);
const projectedSolAfter = solBalance.sub(quoteUi).sub(feeBufferSol);
if (projectedSolAfter.lt(minSolReserve)) {
  throw new Error(
    `Refusing stage: balance ${solBalance.toString()} SOL - deposit ${quoteUi.toString()} - fee buffer ${feeBufferSol.toString()} would leave ${projectedSolAfter.toString()} SOL, below required reserve ${minSolReserve.toString()} SOL.`,
  );
}

const raydium = await Raydium.load({
  owner,
  connection,
  cluster: 'mainnet',
  disableFeatureCheck: true,
  blockhashCommitment: 'finalized',
});

const { poolInfo, poolKeys, rpcData } = await raydium.cpmm.getPoolInfoFromRpc(poolId);
const mintA = poolInfo.mintA.address;
const mintB = poolInfo.mintB.address;
const pair = new Set([mintA, mintB]);
if (!pair.has(SKAM_MINT) || !pair.has(CANONICAL_WSOL) || pair.size !== 2) {
  throw new Error(`Pool identity mismatch. Expected exact sKAM/WSOL pair, got ${mintA}/${mintB}.`);
}

const wsolIsMintA = mintA === CANONICAL_WSOL;
const quoteDecimals = wsolIsMintA ? poolInfo.mintA.decimals : poolInfo.mintB.decimals;
const tokenDecimals = wsolIsMintA ? poolInfo.mintB.decimals : poolInfo.mintA.decimals;
const quoteReserveRaw = wsolIsMintA ? rpcData.baseReserve : rpcData.quoteReserve;
const tokenReserveRaw = wsolIsMintA ? rpcData.quoteReserve : rpcData.baseReserve;
const quoteReserveUi = rawToUi(quoteReserveRaw, quoteDecimals);
const tokenReserveUi = rawToUi(tokenReserveRaw, tokenDecimals);
if (quoteReserveUi.lte(0) || tokenReserveUi.lte(0)) throw new Error('Pool reserves must be positive.');

const pairedSkamUi = quoteUi.mul(tokenReserveUi).div(quoteReserveUi);
const pairedSkamWithSlippage = pairedSkamUi.mul(new Decimal(1).add(new Decimal(slippageBps).div(10_000)));
if (skamBalance.lt(pairedSkamWithSlippage)) {
  throw new Error(
    `Insufficient sKAM for this stage. Need about ${pairedSkamWithSlippage.toFixed(9)} including slippage headroom; wallet has ${skamBalance.toFixed(9)}.`,
  );
}

const preview = {
  mode: previewMode ? 'PREVIEW_ONLY' : 'EXECUTE',
  checkedAt: new Date().toISOString(),
  network: 'solana-mainnet-beta',
  operator: APPROVED_OPERATOR,
  mint: SKAM_MINT,
  poolId: RAYDIUM_POOL_ID,
  quoteMint: CANONICAL_WSOL,
  currentWallet: {
    sol: solBalance.toString(),
    skam: skamBalance.toString(),
  },
  safety: {
    requestedSol: quoteUi.toString(),
    maxStageSol: maxQuoteUi.toString(),
    feeBufferSol: feeBufferSol.toString(),
    minimumRemainingSol: minSolReserve.toString(),
    projectedRemainingSolAfterDepositAndBuffer: projectedSolAfter.toString(),
    slippageBps,
  },
  poolBefore: {
    mintA,
    mintB,
    quoteReserveSol: quoteReserveUi.toString(),
    tokenReserveSkam: tokenReserveUi.toString(),
    reserveRatioSolPerSkam: quoteReserveUi.div(tokenReserveUi).toString(),
  },
  estimatedDeposit: {
    sol: quoteUi.toString(),
    skamAtCurrentReserveRatio: pairedSkamUi.toString(),
    skamWithSlippageHeadroom: pairedSkamWithSlippage.toString(),
  },
};

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/skam-liquidity-stage-preview.json', `${JSON.stringify(preview, null, 2)}\n`);
console.log(JSON.stringify(preview, null, 2));

if (previewMode) {
  console.log('Preview only. No transaction was signed or sent.');
  console.log('To execute after reviewing the preview, set CONFIRM_ADD_LIQUIDITY=ADD_REAL_SKAM_LIQUIDITY and run with --execute.');
  process.exit(0);
}

await raydium.account.fetchWalletTokenAccounts({ forceUpdate: true });
const inputAmount = uiToRaw(quoteUi, quoteDecimals);
const slippage = new Percent(slippageBps, 10_000);

const { execute } = await raydium.cpmm.addLiquidity({
  poolInfo,
  poolKeys,
  inputAmount,
  slippage,
  baseIn: wsolIsMintA,
  txVersion: TxVersion.V0,
});

const { txId } = await execute({ sendAndConfirm: true });
const [{ rpcData: afterRpc }, afterBalanceLamports] = await Promise.all([
  raydium.cpmm.getPoolInfoFromRpc(poolId),
  connection.getBalance(operatorPublicKey, 'confirmed'),
]);

const afterQuoteReserveRaw = wsolIsMintA ? afterRpc.baseReserve : afterRpc.quoteReserve;
const afterTokenReserveRaw = wsolIsMintA ? afterRpc.quoteReserve : afterRpc.baseReserve;
const result = {
  ...preview,
  mode: 'EXECUTED',
  executedAt: new Date().toISOString(),
  transaction: txId,
  walletSolAfter: new Decimal(afterBalanceLamports).div(1e9).toString(),
  poolAfter: {
    quoteReserveSol: rawToUi(afterQuoteReserveRaw, quoteDecimals).toString(),
    tokenReserveSkam: rawToUi(afterTokenReserveRaw, tokenDecimals).toString(),
  },
};

fs.writeFileSync('artifacts/skam-liquidity-stage-result.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
console.log(`Liquidity deposit confirmed: https://explorer.solana.com/tx/${txId}`);
