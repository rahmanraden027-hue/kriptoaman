import 'dotenv/config';
import fs from 'node:fs';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  Raydium,
  TxVersion,
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
} from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';

const CANONICAL_WSOL = 'So11111111111111111111111111111111111111112';

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
const operatorPublicAddress = required('OPERATOR_PUBLIC_ADDRESS');
const tokenMint = new PublicKey(required('TOKEN_MINT'));
const quoteMintText = required('QUOTE_MINT');
const quoteMint = new PublicKey(quoteMintText);
const quoteSymbol = (process.env.QUOTE_SYMBOL || 'SOL').trim();
const baseUi = required('POOL_BASE_UI');
const quoteUi = required('POOL_QUOTE_UI');
const feeConfigIndex = Number(process.env.RAYDIUM_FEE_CONFIG_INDEX ?? '0');

if (process.env.CONFIRM_CREATE_POOL !== 'CREATE_REAL_RAYDIUM_POOL') {
  throw new Error('Refusing real pool creation. Set CONFIRM_CREATE_POOL=CREATE_REAL_RAYDIUM_POOL only after reviewing token identity, SOL amount and seed ratio.');
}
if (quoteMintText !== CANONICAL_WSOL) {
  throw new Error(`QUOTE_MINT must be canonical Wrapped SOL (${CANONICAL_WSOL}) for this launch pack.`);
}
if (!fs.existsSync(keypairPath)) throw new Error('KEYPAIR must point to an existing local keypair file; never commit it.');
if (!Number.isInteger(feeConfigIndex) || feeConfigIndex < 0) throw new Error('RAYDIUM_FEE_CONFIG_INDEX must be a non-negative integer.');

const owner = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf8'))));
if (owner.publicKey.toBase58() !== operatorPublicAddress) {
  throw new Error(`Signer mismatch. Expected OPERATOR_PUBLIC_ADDRESS=${operatorPublicAddress}, got ${owner.publicKey.toBase58()}.`);
}

const connection = new Connection(rpcUrl, 'confirmed');
const balanceLamports = await connection.getBalance(owner.publicKey, 'confirmed');
if (balanceLamports <= 0) throw new Error('Signer has no SOL for liquidity, transaction fees, rent, and pool creation.');

console.log('Signer:', owner.publicKey.toBase58());
console.log('SOL balance:', balanceLamports / 1e9);
console.log('Token mint:', tokenMint.toBase58());
console.log('Quote mint (canonical WSOL):', quoteMint.toBase58());
console.log('Requested initial reserves:', { token: baseUi, [quoteSymbol]: quoteUi });
console.log(`Seed ratio ${quoteSymbol} per token:`, new Decimal(quoteUi).div(baseUi).toString());

const raydium = await Raydium.load({
  owner,
  connection,
  cluster: 'mainnet',
  disableFeatureCheck: true,
  blockhashCommitment: 'finalized',
});

const [mintAInfo, mintBInfo] = await Promise.all([
  raydium.token.getTokenInfo(tokenMint),
  raydium.token.getTokenInfo(quoteMint),
]);

const feeConfigs = await raydium.api.getCpmmConfigs();
const feeConfig = feeConfigs.find((c) => Number(c.index) === feeConfigIndex);
if (!feeConfig) throw new Error(`Raydium CPMM fee config index ${feeConfigIndex} not found.`);

const mintAAmount = uiToRaw(baseUi, mintAInfo.decimals);
const mintBAmount = uiToRaw(quoteUi, mintBInfo.decimals);

const { execute, extInfo } = await raydium.cpmm.createPool({
  programId: CREATE_CPMM_POOL_PROGRAM,
  poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
  mintA: mintAInfo,
  mintB: mintBInfo,
  mintAAmount,
  mintBAmount,
  startTime: new BN(0),
  feeConfig,
  associatedOnly: false,
  ownerInfo: { useSOLBalance: true },
  txVersion: TxVersion.V0,
});

const { txId } = await execute({ sendAndConfirm: true });
const poolId = extInfo.address.poolId.toBase58();
const { poolInfo, rpcData } = await raydium.cpmm.getPoolInfoFromRpc(new PublicKey(poolId));

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync(
  'artifacts/raydium-pool.json',
  JSON.stringify(
    {
      network: 'solana-mainnet-beta',
      dex: 'raydium',
      poolType: 'CPMM',
      poolId,
      creationTx: txId,
      tokenMint: tokenMint.toBase58(),
      quoteMint: quoteMint.toBase58(),
      quoteSymbol,
      quoteUsesNativeSolBalance: true,
      initialTokenUi: baseUi,
      initialQuoteUi: quoteUi,
      initialPoolRatioQuotePerToken: new Decimal(quoteUi).div(baseUi).toString(),
      feeConfigIndex,
      rpcBaseReserve: rpcData.baseReserve.toString(),
      rpcQuoteReserve: rpcData.quoteReserve.toString(),
      mintA: poolInfo.mintA.address,
      mintB: poolInfo.mintB.address,
      createdAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log('Pool created:', poolId);
console.log('Transaction:', txId);
console.log('Evidence: artifacts/raydium-pool.json');
