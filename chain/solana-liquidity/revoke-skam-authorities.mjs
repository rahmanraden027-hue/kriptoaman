import fs from 'node:fs';
import path from 'node:path';
import {
  AuthorityType,
  TOKEN_2022_PROGRAM_ID,
  createSetAuthorityInstruction,
  getMint,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

const MINT = new PublicKey('Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi');
const SIGNER_1 = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const EXPECTED_DECIMALS = 9;
const EXPECTED_SUPPLY = 1_000_000_000n * 10n ** 9n;
const EXECUTE_GATE = 'I_UNDERSTAND_SKAM_MINT_AND_FREEZE_AUTHORITY_REVOCATION_IS_PERMANENT';
const mode = process.argv.includes('--execute') ? 'execute' : 'preview';

function loadKeypair(filePath) {
  if (!filePath) throw new Error('KEYPAIR must point to the local Signer 1 JSON keypair.');
  const resolved = path.resolve(filePath);
  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error('KEYPAIR must be a standard 64-byte Solana JSON keypair.');
  }
  const keypair = Keypair.fromSecretKey(Uint8Array.from(parsed));
  if (keypair.publicKey.toBase58() !== SIGNER_1) {
    throw new Error(`KEYPAIR must equal pinned Signer 1 ${SIGNER_1}; got ${keypair.publicKey.toBase58()}.`);
  }
  return keypair;
}

function authorityString(value) {
  return value ? value.toBase58() : null;
}

const rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');
const signer = loadKeypair(process.env.KEYPAIR);
const before = await getMint(connection, MINT, 'confirmed', TOKEN_2022_PROGRAM_ID);

if (before.decimals !== EXPECTED_DECIMALS) {
  throw new Error(`Decimals mismatch: expected ${EXPECTED_DECIMALS}; got ${before.decimals}.`);
}
if (before.supply !== EXPECTED_SUPPLY) {
  throw new Error(`Supply mismatch: expected ${EXPECTED_SUPPLY}; got ${before.supply}.`);
}

const mintAuthority = authorityString(before.mintAuthority);
const freezeAuthority = authorityString(before.freezeAuthority);
for (const [name, authority] of [['mint', mintAuthority], ['freeze', freezeAuthority]]) {
  if (authority !== null && authority !== SIGNER_1) {
    throw new Error(`${name} authority is unexpected: ${authority}. Refusing to continue.`);
  }
}

const instructions = [];
if (mintAuthority === SIGNER_1) {
  instructions.push(createSetAuthorityInstruction(
    MINT,
    signer.publicKey,
    AuthorityType.MintTokens,
    null,
    [],
    TOKEN_2022_PROGRAM_ID,
  ));
}
if (freezeAuthority === SIGNER_1) {
  instructions.push(createSetAuthorityInstruction(
    MINT,
    signer.publicKey,
    AuthorityType.FreezeAccount,
    null,
    [],
    TOKEN_2022_PROGRAM_ID,
  ));
}

const preview = {
  action: 'PERMANENTLY_REVOKE_SKAM_MINT_AND_FREEZE_AUTHORITIES',
  mode,
  network: 'solana-mainnet-beta',
  rpcUrl,
  mint: MINT.toBase58(),
  signer: signer.publicKey.toBase58(),
  decimals: before.decimals,
  rawSupply: before.supply.toString(),
  supplyUi: '1000000000',
  currentMintAuthority: mintAuthority,
  currentFreezeAuthority: freezeAuthority,
  instructionsPlanned: instructions.length,
  irreversible: true,
};
console.log(JSON.stringify({ preview }, null, 2));

if (instructions.length === 0) {
  console.log(JSON.stringify({ success: true, alreadySecure: true, mintAuthority: null, freezeAuthority: null }, null, 2));
  process.exit(0);
}

const latest = await connection.getLatestBlockhash('confirmed');
const tx = new Transaction({ feePayer: signer.publicKey, recentBlockhash: latest.blockhash });
tx.add(...instructions);
tx.sign(signer);

const simulation = await connection.simulateTransaction(tx);
if (simulation.value.err) {
  throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
}
console.log(JSON.stringify({ simulation: { ok: true, unitsConsumed: simulation.value.unitsConsumed ?? null } }, null, 2));

if (mode !== 'execute') {
  console.log(JSON.stringify({ readyToExecute: true, note: 'Preview only. No transaction was broadcast.' }, null, 2));
  process.exit(0);
}

if (process.env.CONFIRM_PERMANENT_AUTHORITY_REVOCATION !== EXECUTE_GATE) {
  throw new Error(`Permanent-revocation gate missing. Set CONFIRM_PERMANENT_AUTHORITY_REVOCATION=${EXECUTE_GATE} only immediately before the approved execution.`);
}

const signature = await connection.sendRawTransaction(tx.serialize(), {
  skipPreflight: false,
  preflightCommitment: 'confirmed',
  maxRetries: 3,
});
await connection.confirmTransaction({ signature, ...latest }, 'confirmed');

const after = await getMint(connection, MINT, 'confirmed', TOKEN_2022_PROGRAM_ID);
const afterMintAuthority = authorityString(after.mintAuthority);
const afterFreezeAuthority = authorityString(after.freezeAuthority);
if (afterMintAuthority !== null || afterFreezeAuthority !== null) {
  throw new Error(`Post-execution authority verification failed: mint=${afterMintAuthority}, freeze=${afterFreezeAuthority}.`);
}

const evidence = {
  completedAt: new Date().toISOString(),
  network: 'solana-mainnet-beta',
  mint: MINT.toBase58(),
  transactionSignature: signature,
  mintAuthority: afterMintAuthority,
  freezeAuthority: afterFreezeAuthority,
  supply: after.supply.toString(),
  decimals: after.decimals,
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/skam-authorities-revoked.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ success: true, evidence }, null, 2));
