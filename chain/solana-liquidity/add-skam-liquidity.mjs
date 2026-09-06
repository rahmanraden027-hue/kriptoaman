import 'dotenv/config';
import fs from 'node:fs';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Raydium, TxVersion, Percent, CREATE_CPMM_POOL_PROGRAM } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';

const SKAM_MINT = new PublicKey('Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi');
const POOL_ID = '7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD';
const OPERATOR = new PublicKey('5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK');
const WSOL = 'So11111111111111111111111111111111111111112';
const REQUESTED_UI = (process.env.SKAM_LIQUIDITY_UI || '1000000000').trim();
const RPC_URL = (process.env.RPC_URL || 'https://api.mainnet-beta.solana.com').trim();
const EXECUTE_GATE = 'ADD_SKAM_BALANCED_LIQUIDITY_MAINNET';
const FEE_BUFFER_LAMPORTS = 50_000_000n; // 0.05 SOL safety buffer for rent/fees

function uiToRaw(ui, decimals) {
  const d = new Decimal(ui);
  if (!d.isFinite() || d.lte(0)) throw new Error(`SKAM_LIQUIDITY_UI must be positive: ${ui}`);
  const raw = d.mul(new Decimal(10).pow(decimals));
  if (!raw.isInteger()) throw new Error(`Amount has more precision than decimals=${decimals}: ${ui}`);
  return new BN(raw.toFixed(0));
}

function rawToUi(raw, decimals) {
  return new Decimal(raw.toString()).div(new Decimal(10).pow(decimals)).toString();
}

async function getOwnerTokenRaw(connection, owner, mint) {
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint }, 'confirmed');
  return accounts.value.reduce((sum, item) => {
    const amount = item.account.data?.parsed?.info?.tokenAmount?.amount;
    return sum + BigInt(amount || '0');
  }, 0n);
}

async function buildPreview(ownerForSdk) {
  const connection = new Connection(RPC_URL, 'confirmed');
  const raydium = await Raydium.load({
    owner: ownerForSdk,
    connection,
    cluster: 'mainnet',
    disableFeatureCheck: true,
    blockhashCommitment: 'finalized',
  });

  const { poolInfo, poolKeys, rpcData } = await raydium.cpmm.getPoolInfoFromRpc(POOL_ID);
  if (poolInfo.programId !== CREATE_CPMM_POOL_PROGRAM.toBase58()) {
    throw new Error(`Unexpected CPMM program: ${poolInfo.programId}`);
  }

  const mints = new Set([poolInfo.mintA.address, poolInfo.mintB.address]);
  if (!mints.has(SKAM_MINT.toBase58()) || !mints.has(WSOL)) {
    throw new Error(`Pool ${POOL_ID} is not the pinned sKAM/WSOL pool.`);
  }

  const skamIsA = poolInfo.mintA.address === SKAM_MINT.toBase58();
  const baseIn = skamIsA;
  const skamDecimals = skamIsA ? poolInfo.mintA.decimals : poolInfo.mintB.decimals;
  const quoteDecimals = skamIsA ? poolInfo.mintB.decimals : poolInfo.mintA.decimals;
  if (skamDecimals !== 9) throw new Error(`Unexpected sKAM decimals: ${skamDecimals}`);

  const supply = await connection.getTokenSupply(SKAM_MINT, 'confirmed');
  if (supply.value.decimals !== 9 || supply.value.uiAmountString !== '1000000000') {
    throw new Error(`Unexpected sKAM supply: ${JSON.stringify(supply.value)}`);
  }

  const requestedRaw = uiToRaw(REQUESTED_UI, skamDecimals);
  const operatorTokenRawBig = await getOwnerTokenRaw(connection, OPERATOR, SKAM_MINT);
  const operatorTokenRaw = new BN(operatorTokenRawBig.toString());
  const solLamports = BigInt(await connection.getBalance(OPERATOR, 'confirmed'));

  const computePoolInfo = {
    ...poolInfo,
    lpAmount: new Decimal(rpcData.lpAmount.toString())
      .div(new Decimal(10).pow(poolInfo.lpMint.decimals))
      .toNumber(),
  };
  const pair = raydium.cpmm.computePairAmount({
    poolInfo: computePoolInfo,
    baseReserve: rpcData.baseReserve,
    quoteReserve: rpcData.quoteReserve,
    amount: REQUESTED_UI,
    slippage: new Percent(0),
    epochInfo: await raydium.fetchEpochInfo(),
    baseIn,
  });
  const requiredQuoteRaw = pair.anotherAmount.amount;
  const requiredQuoteBig = BigInt(requiredQuoteRaw.toString());

  const skamEnough = operatorTokenRaw.gte(requestedRaw);
  const solEnough = solLamports >= requiredQuoteBig + FEE_BUFFER_LAMPORTS;
  const preview = {
    action: 'ADD_BALANCED_SKAM_LIQUIDITY',
    network: 'solana-mainnet-beta',
    poolId: POOL_ID,
    operator: OPERATOR.toBase58(),
    skamMint: SKAM_MINT.toBase58(),
    quoteMint: WSOL,
    requestedSkamUi: REQUESTED_UI,
    operatorSkamUi: rawToUi(operatorTokenRaw, skamDecimals),
    operatorSol: new Decimal(solLamports.toString()).div(1e9).toString(),
    requiredSolAtCurrentPoolRatio: rawToUi(requiredQuoteRaw, quoteDecimals),
    feeBufferSol: new Decimal(FEE_BUFFER_LAMPORTS.toString()).div(1e9).toString(),
    poolSkamReserveUi: rawToUi(skamIsA ? rpcData.baseReserve : rpcData.quoteReserve, skamDecimals),
    poolSolReserveUi: rawToUi(skamIsA ? rpcData.quoteReserve : rpcData.baseReserve, quoteDecimals),
    poolPriceSolPerSkam: skamIsA ? rpcData.poolPrice.toString() : new Decimal(1).div(rpcData.poolPrice).toString(),
    checks: {
      supplyFixedAt1B: true,
      pinnedCpmmPool: true,
      operatorHasRequestedSkam: skamEnough,
      operatorHasRequiredSolPlusBuffer: solEnough,
    },
    safeToExecute: skamEnough && solEnough,
  };
  return { connection, raydium, poolInfo, poolKeys, requestedRaw, baseIn, preview };
}

const previewOnly = await buildPreview(OPERATOR);
console.log(JSON.stringify({ preview: previewOnly.preview }, null, 2));

if (process.env.CONFIRM_ADD_SKAM_LIQUIDITY !== EXECUTE_GATE) {
  console.log(`PREVIEW_ONLY: set CONFIRM_ADD_SKAM_LIQUIDITY=${EXECUTE_GATE} only after reviewing the exact paired SOL requirement.`);
  process.exit(0);
}

if (!previewOnly.preview.safeToExecute) {
  throw new Error('Execution blocked: operator does not currently hold the requested sKAM amount and/or required SOL + fee buffer.');
}

const keypairPath = process.env.KEYPAIR?.trim();
if (!keypairPath || !fs.existsSync(keypairPath)) {
  throw new Error('KEYPAIR must point to the local Signer 1 JSON keypair for execution. Never commit or paste it into chat.');
}
const signer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf8'))));
if (!signer.publicKey.equals(OPERATOR)) {
  throw new Error(`Signer mismatch. Expected ${OPERATOR.toBase58()}, got ${signer.publicKey.toBase58()}`);
}

// Re-read everything with the actual signer immediately before building the transaction.
const exec = await buildPreview(signer);
if (!exec.preview.safeToExecute) throw new Error('Execution blocked after final preflight re-check.');

const { execute } = await exec.raydium.cpmm.addLiquidity({
  poolInfo: exec.poolInfo,
  poolKeys: exec.poolKeys,
  inputAmount: exec.requestedRaw,
  slippage: new Percent(1, 100), // 1% LP-minimum protection
  baseIn: exec.baseIn,
  txVersion: TxVersion.V0,
});

const { txId } = await execute({ sendAndConfirm: true });
const after = await exec.raydium.cpmm.getPoolInfoFromRpc(POOL_ID);
const skamIsAAfter = after.poolInfo.mintA.address === SKAM_MINT.toBase58();
const evidence = {
  executedAt: new Date().toISOString(),
  transaction: txId,
  poolId: POOL_ID,
  requestedSkamUi: REQUESTED_UI,
  postPoolSkamReserveUi: rawToUi(skamIsAAfter ? after.rpcData.baseReserve : after.rpcData.quoteReserve, 9),
  postPoolSolReserveUi: rawToUi(skamIsAAfter ? after.rpcData.quoteReserve : after.rpcData.baseReserve, 9),
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/skam-liquidity-add.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ success: true, evidence }, null, 2));
