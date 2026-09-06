import dotenv from 'dotenv';
import * as multisig from '@sqds/multisig';
import { Connection, PublicKey } from '@solana/web3.js';

dotenv.config({ path: process.argv[2] || '.env' });

const EXPECTED_PROGRAM_ID = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';
const EXPECTED_MEMBERS = [
  '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK',
  '9kyjft13umxb92C11qr9v6L8HnJ3t1cZuDohc5wLrFqB',
  '9qhMmV5T9gfPQ4yCZPMVgDbHUR9F65c3xBKnEmWLYxT2',
];
const EXPECTED_THRESHOLD = 2;
const EXPECTED_TIME_LOCK = 86_400;

function normalizeAuthority(value) {
  if (value == null) return null;
  if (typeof value.toBase58 === 'function') return value.toBase58();
  return String(value);
}

const address = process.env.MULTISIG_ADDRESS;
if (!address) throw new Error('MULTISIG_ADDRESS is required for read-only verification.');
const multisigPda = new PublicKey(address);
if (multisigPda.toBase58() !== address) throw new Error('MULTISIG_ADDRESS is not canonical.');

const rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');
const info = await connection.getAccountInfo(multisigPda, 'confirmed');
if (!info) throw new Error(`Multisig account not found: ${address}`);
if (info.owner.toBase58() !== EXPECTED_PROGRAM_ID) {
  throw new Error(`Unexpected owner program: ${info.owner.toBase58()}`);
}

const account = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
const members = account.members.map((member) => member.key.toBase58());
const threshold = Number(account.threshold);
const timeLockSeconds = Number(account.timeLock);
const configAuthority = normalizeAuthority(account.configAuthority);
const [strategicVaultOwner] = multisig.getVaultPda({ multisigPda, index: 0 });
const [ecosystemVaultOwner] = multisig.getVaultPda({ multisigPda, index: 1 });

const checks = {
  programId: info.owner.toBase58() === EXPECTED_PROGRAM_ID,
  exactMembersAndOrder: members.join(',') === EXPECTED_MEMBERS.join(','),
  threshold2of3: threshold === EXPECTED_THRESHOLD,
  timelock24h: timeLockSeconds === EXPECTED_TIME_LOCK,
  noUnilateralConfigAuthority: configAuthority === null,
};
const pass = Object.values(checks).every(Boolean);

const report = {
  audit: 'sKAM Squads v4 governance read-only verifier',
  checkedAt: new Date().toISOString(),
  network: 'solana-mainnet-beta',
  multisigAddress: address,
  programId: info.owner.toBase58(),
  members,
  threshold,
  timeLockSeconds,
  configAuthority,
  derivedVaultOwners: {
    strategicIndex0: strategicVaultOwner.toBase58(),
    ecosystemIndex1: ecosystemVaultOwner.toBase58(),
  },
  checks,
  pass,
  nextGate: pass
    ? 'PIN_MULTISIG_AND_VAULTS_IN_POLICY_THEN_CANARY_TEST'
    : 'STOP_AND_REVIEW_GOVERNANCE_CONFIGURATION',
};

console.log(JSON.stringify(report, null, 2));
if (!pass) process.exitCode = 2;
