import 'dotenv/config';
import fs from 'node:fs';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getMintLen,
} from '@solana/spl-token';
import { TYPE_SIZE, LENGTH_SIZE, createInitializeInstruction, pack } from '@solana/spl-token-metadata';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required value is empty: ${name}`);
  return value;
}

const rpcUrl = required('RPC_URL');
const keypairPath = required('KEYPAIR');
const operatorAddress = required('OPERATOR_PUBLIC_ADDRESS');
const tokenName = required('TOKEN_NAME');
const tokenSymbol = required('TOKEN_SYMBOL');
const decimals = Number(required('TOKEN_DECIMALS'));
const supplyUiText = required('TOKEN_SUPPLY');
const metadataUri = required('METADATA_URI');

if (process.env.CONFIRM_CREATE_TOKEN !== 'CREATE_REAL_SOLANA_TOKEN') {
  throw new Error('Refusing real token creation. Set CONFIRM_CREATE_TOKEN=CREATE_REAL_SOLANA_TOKEN only after reviewing identity, supply, metadata and authorities.');
}
if (!rpcUrl.startsWith('https://')) throw new Error('RPC_URL must use HTTPS.');
if (!fs.existsSync(keypairPath)) throw new Error('KEYPAIR must point to an existing local JSON keypair file. Never place it in GitHub or chat.');
if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error('TOKEN_DECIMALS must be an integer from 0 to 18.');
if (!/^\d+$/.test(supplyUiText) || supplyUiText === '0') throw new Error('TOKEN_SUPPLY must be a positive whole-token amount for the approved sKAM launch.');
if (!metadataUri.startsWith('https://')) throw new Error('METADATA_URI must use HTTPS.');

const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
if (!Array.isArray(secret) || secret.length !== 64 || secret.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
  throw new Error('KEYPAIR must contain a standard 64-byte Solana secret-key JSON array.');
}
const owner = Keypair.fromSecretKey(Uint8Array.from(secret));
if (owner.publicKey.toBase58() !== operatorAddress) {
  throw new Error(`Signer mismatch. Expected OPERATOR_PUBLIC_ADDRESS=${operatorAddress}, got ${owner.publicKey.toBase58()}.`);
}

const supplyUi = BigInt(supplyUiText);
const scale = 10n ** BigInt(decimals);
const rawSupply = supplyUi * scale;
if (rawSupply > 18_446_744_073_709_551_615n) throw new Error('Raw token supply exceeds Token-2022 u64 limit.');

const connection = new Connection(rpcUrl, 'confirmed');
const balance = await connection.getBalance(owner.publicKey, 'confirmed');
if (balance <= 0) throw new Error('Approved operator wallet has no SOL.');

const mint = Keypair.generate();
const metadata = {
  updateAuthority: owner.publicKey,
  mint: mint.publicKey,
  name: tokenName,
  symbol: tokenSymbol,
  uri: metadataUri,
  additionalMetadata: [],
};

const baseMintLen = getMintLen([ExtensionType.MetadataPointer]);
const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
const rent = await connection.getMinimumBalanceForRentExemption(baseMintLen + metadataLen, 'confirmed');

const createMintTx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: owner.publicKey,
    newAccountPubkey: mint.publicKey,
    space: baseMintLen,
    lamports: rent,
    programId: TOKEN_2022_PROGRAM_ID,
  }),
  createInitializeMetadataPointerInstruction(
    mint.publicKey,
    owner.publicKey,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID,
  ),
  createInitializeMintInstruction(
    mint.publicKey,
    decimals,
    owner.publicKey,
    owner.publicKey,
    TOKEN_2022_PROGRAM_ID,
  ),
  createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint.publicKey,
    updateAuthority: owner.publicKey,
    mint: mint.publicKey,
    mintAuthority: owner.publicKey,
    name: tokenName,
    symbol: tokenSymbol,
    uri: metadataUri,
  }),
);

console.log('Creating Token-2022 mint from approved operator:', owner.publicKey.toBase58());
console.log('Candidate mint:', mint.publicKey.toBase58());
console.log('Token:', `${tokenName} (${tokenSymbol})`);
console.log('Supply:', supplyUiText, 'decimals:', decimals);
console.log('Metadata:', metadataUri);
console.log('Authorities at creation: mint/freeze/metadata-pointer/update = approved operator. No authority is revoked automatically.');

const createSignature = await sendAndConfirmTransaction(connection, createMintTx, [owner, mint], {
  commitment: 'confirmed',
  preflightCommitment: 'confirmed',
  skipPreflight: false,
  maxRetries: 5,
});

const ata = getAssociatedTokenAddressSync(
  mint.publicKey,
  owner.publicKey,
  false,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
);

const mintSupplyTx = new Transaction().add(
  createAssociatedTokenAccountInstruction(
    owner.publicKey,
    ata,
    owner.publicKey,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  ),
  createMintToCheckedInstruction(
    mint.publicKey,
    ata,
    owner.publicKey,
    rawSupply,
    decimals,
    [],
    TOKEN_2022_PROGRAM_ID,
  ),
);

const supplySignature = await sendAndConfirmTransaction(connection, mintSupplyTx, [owner], {
  commitment: 'confirmed',
  preflightCommitment: 'confirmed',
  skipPreflight: false,
  maxRetries: 5,
});

const onchainMint = await getMint(connection, mint.publicKey, 'confirmed', TOKEN_2022_PROGRAM_ID);
if (onchainMint.decimals !== decimals) throw new Error(`On-chain decimals mismatch: ${onchainMint.decimals}`);
if (onchainMint.supply !== rawSupply) throw new Error(`On-chain raw supply mismatch: ${onchainMint.supply.toString()}`);
if (onchainMint.mintAuthority?.toBase58() !== owner.publicKey.toBase58()) throw new Error('Unexpected on-chain mint authority.');
if (onchainMint.freezeAuthority?.toBase58() !== owner.publicKey.toBase58()) throw new Error('Unexpected on-chain freeze authority.');

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/solana-token.env', [
  `TOKEN_MINT=${mint.publicKey.toBase58()}`,
  `TOKEN_NAME=${tokenName}`,
  `TOKEN_SYMBOL=${tokenSymbol}`,
  `TOKEN_DECIMALS=${decimals}`,
  `TOKEN_SUPPLY=${supplyUiText}`,
  `OWNER=${owner.publicKey.toBase58()}`,
  '',
].join('\n'));
fs.writeFileSync('artifacts/solana-token-summary.json', JSON.stringify({
  network: 'solana-mainnet-beta',
  mint: mint.publicKey.toBase58(),
  name: tokenName,
  symbol: tokenSymbol,
  decimals,
  declaredInitialSupply: supplyUiText,
  rawSupply: rawSupply.toString(),
  metadataUri,
  owner: owner.publicKey.toBase58(),
  ownerAta: ata.toBase58(),
  createMintTx: createSignature,
  mintSupplyTx: supplySignature,
  mintAuthority: owner.publicKey.toBase58(),
  freezeAuthority: owner.publicKey.toBase58(),
  metadataPointerAuthority: owner.publicKey.toBase58(),
  updateAuthority: owner.publicKey.toBase58(),
  authorityRevocationPerformed: false,
}, null, 2));

console.log('=== TOKEN-2022 CREATED ===');
console.log('Mint:', mint.publicKey.toBase58());
console.log('Operator ATA:', ata.toBase58());
console.log('Create transaction:', createSignature);
console.log('Supply transaction:', supplySignature);
console.log('Evidence: artifacts/solana-token-summary.json');
