import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

// Canonical legacy SPL Token program constants.
// Instruction encodings mirror the official Solana SPL Token JS client while
// avoiding its archived bigint-buffer dependency chain.
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const MINT_SIZE = 82;

const INITIALIZE_MINT_2 = 20;
const MINT_TO_CHECKED = 14;

function instructionData(bytes) {
  return Uint8Array.from(bytes);
}

function u64LittleEndian(value) {
  const amount = BigInt(value);
  if (amount < 0n || amount > 0xffff_ffff_ffff_ffffn) throw new RangeError('u64 amount out of range');
  const bytes = new Uint8Array(8);
  let remaining = amount;
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

export function getAssociatedTokenAddressSync(mint, owner) {
  if (!PublicKey.isOnCurve(owner.toBytes())) throw new Error('Associated token owner must be on curve');
  return PublicKey.findProgramAddressSync(
    [owner.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export function createAssociatedTokenAccountInstruction(payer, associatedToken, owner, mint) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: instructionData([]),
  });
}

export function createInitializeMint2Instruction(mint, decimals, mintAuthority, freezeAuthority) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new RangeError('Invalid mint decimals');
  const authorityBytes = mintAuthority.toBytes();
  const freezeBytes = freezeAuthority?.toBytes() || null;
  const data = new Uint8Array(freezeBytes ? 67 : 35);
  data[0] = INITIALIZE_MINT_2;
  data[1] = decimals;
  data.set(authorityBytes, 2);
  data[34] = freezeBytes ? 1 : 0;
  if (freezeBytes) data.set(freezeBytes, 35);

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data,
  });
}

export function createMintToCheckedInstruction(mint, destination, authority, amount, decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new RangeError('Invalid mint decimals');
  const amountBytes = u64LittleEndian(amount);
  const data = new Uint8Array(10);
  data[0] = MINT_TO_CHECKED;
  data.set(amountBytes, 1);
  data[9] = decimals;

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}
