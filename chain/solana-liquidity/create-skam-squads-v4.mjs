import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import * as multisig from '@sqds/multisig';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

const envPath = process.argv[2] || '.env';
dotenv.config({ path: envPath });

const SQUADS_PROGRAM_ID = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';
const MINT = 'Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi';
const SIGNER_1 = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const SIGNER_2 = '9kyjft13umxb92C11qr9v6L8HnJ3t1cZuDohc5wLrFqB';
const SIGNER_3 = '9qhMmV5T9gfPQ4yCZPMVgDbHUR9F65c3xBKnEmWLYxT2';
const EXPECTED_MEMBERS = [SIGNER_1, SIGNER_2, SIGNER_3];
const THRESHOLD = 2;
const TIME_LOCK_SECONDS = 86_400;
const INDEPENDENCE_GATE = 'I_CONFIRM_THREE_INDEPENDENT_SKAM_SIGNERS';
const CREATE_GATE = 'CREATE_SKAM_SQUADS_2_OF_3_MAINNET';

function requireCanonicalDistinctMembers(addresses) {
  if (addresses.length !== 3 || new Set(addresses).size !== 3) {
    throw new Error('Expected exactly three distinct signer addresses.');
  }
  for (const address of addresses) {
    const canonical = new PublicKey(address).toBase58();
    if (canonical !== address) throw new Error(`Non-canonical signer address: ${address}`);
  }
}

function loadKeypair(filePath) {
  if (!filePath) throw new Error('KEYPAIR must point to the local Signer 1 JSON keypair.');
  const resolved = path.resolve(filePath);
  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error('KEYPAIR must be a standard 64-byte Solana JSON keypair.');
  }
  return Keypair.fromSecretKey(Uint8Array.from(parsed));
}

function normalizeConfigAuthority(value) {
  if (value == null) return null;
  if (typeof value.toBase58 === 'function') return value.toBase58();
  return String(value);
}

requireCanonicalDistinctMembers(EXPECTED_MEMBERS);

if (process.env.CONFIRM_INDEPENDENT_SIGNERS !== INDEPENDENCE_GATE) {
  throw new Error(
    `Independent signer attestation missing. Set CONFIRM_INDEPENDENT_SIGNERS=${INDEPENDENCE_GATE} only after confirming Signers 1, 2 and 3 use independent seed material or independent signing devices.`
  );
}

if (process.env.CONFIRM_CREATE_SQUADS_MULTISIG !== CREATE_GATE) {
  throw new Error(
    `Irreversible mainnet gate missing. Set CONFIRM_CREATE_SQUADS_MULTISIG=${CREATE_GATE} immediately before the approved creation run.`
  );
}

const rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const creator = loadKeypair(process.env.KEYPAIR);
if (creator.publicKey.toBase58() !== SIGNER_1) {
  throw new Error(`KEYPAIR public key must equal pinned Signer 1 ${SIGNER_1}; got ${creator.publicKey.toBase58()}.`);
}

const connection = new Connection(rpcUrl, 'confirmed');
const createKey = Keypair.generate();
const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });
const [programConfigPda] = multisig.getProgramConfigPda({});
const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(connection, programConfigPda);
const configTreasury = programConfig.treasury;
const { Permissions } = multisig.types;

const members = EXPECTED_MEMBERS.map((address) => ({
  key: new PublicKey(address),
  permissions: Permissions.all(),
}));

const preview = {
  action: 'CREATE_SQUADS_V4_MULTISIG',
  network: 'solana-mainnet-beta',
  programId: SQUADS_PROGRAM_ID,
  tokenMint: MINT,
  creator: creator.publicKey.toBase58(),
  createKeyPublic: createKey.publicKey.toBase58(),
  derivedMultisig: multisigPda.toBase58(),
  programConfig: programConfigPda.toBase58(),
  programTreasury: configTreasury.toBase58(),
  members: EXPECTED_MEMBERS,
  threshold: THRESHOLD,
  timeLockSeconds: TIME_LOCK_SECONDS,
  configAuthority: null,
  spendingLimitsConfigured: false,
};
console.log(JSON.stringify({ preview }, null, 2));

const existing = await connection.getAccountInfo(multisigPda, 'confirmed');
if (existing) throw new Error(`Derived multisig PDA already exists: ${multisigPda.toBase58()}`);

const signature = await multisig.rpc.multisigCreateV2({
  connection,
  createKey,
  creator,
  multisigPda,
  configAuthority: null,
  timeLock: TIME_LOCK_SECONDS,
  members,
  threshold: THRESHOLD,
  rentCollector: null,
  treasury: configTreasury,
  sendOptions: {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
    maxRetries: 3,
  },
});

await connection.confirmTransaction(signature, 'confirmed');

const created = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
const observedMembers = created.members.map((member) => member.key.toBase58());
const observedThreshold = Number(created.threshold);
const observedTimeLock = Number(created.timeLock);
const observedConfigAuthority = normalizeConfigAuthority(created.configAuthority);

if (observedMembers.join(',') !== EXPECTED_MEMBERS.join(',')) {
  throw new Error(`Post-create member mismatch: ${observedMembers.join(',')}`);
}
if (observedThreshold !== THRESHOLD) throw new Error(`Post-create threshold mismatch: ${observedThreshold}`);
if (observedTimeLock !== TIME_LOCK_SECONDS) throw new Error(`Post-create timelock mismatch: ${observedTimeLock}`);
if (observedConfigAuthority !== null) throw new Error(`Post-create config authority must be null; got ${observedConfigAuthority}`);

const [strategicVaultOwner] = multisig.getVaultPda({ multisigPda, index: 0 });
const [ecosystemVaultOwner] = multisig.getVaultPda({ multisigPda, index: 1 });

const evidence = {
  createdAt: new Date().toISOString(),
  network: 'solana-mainnet-beta',
  programId: SQUADS_PROGRAM_ID,
  tokenMint: MINT,
  transactionSignature: signature,
  createKeyPublic: createKey.publicKey.toBase58(),
  multisigAddress: multisigPda.toBase58(),
  members: observedMembers,
  threshold: observedThreshold,
  globalTimelockSeconds: observedTimeLock,
  configAuthority: observedConfigAuthority,
  spendingLimitsConfigured: false,
  candidateVaultOwners: {
    strategicIndex0: strategicVaultOwner.toBase58(),
    ecosystemIndex1: ecosystemVaultOwner.toBase58(),
  },
};

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/skam-squads-v4-created.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ success: true, evidence }, null, 2));
