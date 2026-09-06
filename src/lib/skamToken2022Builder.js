import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const SKAM_NAME = 'Solana KAM';
export const SKAM_SYMBOL = 'sKAM';
export const SKAM_METADATA_URI = 'https://kriptoaman.com/token/skam.json';
export const SKAM_DECIMALS = 9;
export const SKAM_SUPPLY_UI = 1_000_000_000n;
export const SKAM_RAW_SUPPLY = SKAM_SUPPLY_UI * 10n ** BigInt(SKAM_DECIMALS);

const ACCOUNT_SIZE = 165;
const ACCOUNT_TYPE_SIZE = 1;
const TLV_TYPE_SIZE = 2;
const TLV_LENGTH_SIZE = 2;
const METADATA_POINTER_EXTENSION_TYPE = 18;
const TOKEN_METADATA_EXTENSION_TYPE = 19;
const METADATA_POINTER_STATE_SIZE = 64;
const TOKEN_INSTRUCTION_METADATA_POINTER_EXTENSION = 39;
const METADATA_POINTER_INITIALIZE = 0;
const TOKEN_INSTRUCTION_INITIALIZE_MINT_2 = 20;
const TOKEN_INSTRUCTION_MINT_TO_CHECKED = 14;

function concatBytes(...parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u32LE(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}

function u64LE(value) {
  let n = BigInt(value);
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  if (n !== 0n) throw new Error('u64 overflow');
  return out;
}

function borshString(value) {
  const data = new TextEncoder().encode(value);
  return concatBytes(u32LE(data.length), data);
}

async function discriminator(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest).slice(0, 8);
}

export function metadataPackedLength({ name = SKAM_NAME, symbol = SKAM_SYMBOL, uri = SKAM_METADATA_URI } = {}) {
  // TokenMetadata state: updateAuthority(32) + mint(32) + three Borsh strings + Vec<(String,String)> length(4).
  return 32 + 32
    + 4 + new TextEncoder().encode(name).length
    + 4 + new TextEncoder().encode(symbol).length
    + 4 + new TextEncoder().encode(uri).length
    + 4;
}

export function mintBaseSpaceWithMetadataPointer() {
  // Mirrors getMintLen([ExtensionType.MetadataPointer]): extended mint accounts use
  // ACCOUNT_SIZE (165), an account-type byte, and TLV(type + length + 64-byte pointer state).
  return ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE + TLV_TYPE_SIZE + TLV_LENGTH_SIZE + METADATA_POINTER_STATE_SIZE;
}

export function mintRentSpace() {
  // The account is created at mintBaseSpaceWithMetadataPointer(), while rent is funded for
  // the final TokenMetadata TLV size because Token-2022 reallocates the mint during metadata init.
  return mintBaseSpaceWithMetadataPointer() + TLV_TYPE_SIZE + TLV_LENGTH_SIZE + metadataPackedLength();
}

export function createInitializeMetadataPointerInstruction(mint, authority) {
  // MetadataPointer::Initialize data is outer TokenInstruction(39), inner instruction(0),
  // authority OptionalNonZeroPubkey(32), metadataAddress OptionalNonZeroPubkey(32).
  const data = concatBytes(
    Uint8Array.of(TOKEN_INSTRUCTION_METADATA_POINTER_EXTENSION, METADATA_POINTER_INITIALIZE),
    authority.toBytes(),
    mint.toBytes(),
  );
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data,
  });
}

export function createInitializeMint2Instruction(mint, authority) {
  // TokenInstruction::InitializeMint2 packing is:
  // 20, decimals, mintAuthority(32), COption<Pubkey> where Some = 1 byte tag + 32-byte key.
  const data = concatBytes(
    Uint8Array.of(TOKEN_INSTRUCTION_INITIALIZE_MINT_2, SKAM_DECIMALS),
    authority.toBytes(),
    Uint8Array.of(1),
    authority.toBytes(),
  );
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data,
  });
}

export async function createInitializeTokenMetadataInstruction(mint, authority) {
  const disc = await discriminator('spl_token_metadata_interface:initialize_account');
  const data = concatBytes(
    disc,
    borshString(SKAM_NAME),
    borshString(SKAM_SYMBOL),
    borshString(SKAM_METADATA_URI),
  );
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

export async function buildCreateMintTransaction({ owner, mint, lamports, blockhash }) {
  return new Transaction({ feePayer: owner, recentBlockhash: blockhash }).add(
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: mint,
      lamports,
      space: mintBaseSpaceWithMetadataPointer(),
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(mint, owner),
    createInitializeMint2Instruction(mint, owner),
    await createInitializeTokenMetadataInstruction(mint, owner),
  );
}

export function getAssociatedTokenAddress(mint, owner) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export function createAssociatedTokenAccountInstruction({ payer, ata, owner, mint }) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    // The legacy Associated Token Program Create instruction is encoded as empty data.
    data: new Uint8Array(),
  });
}

export function createMintToCheckedInstruction({ mint, ata, authority }) {
  const data = concatBytes(
    Uint8Array.of(TOKEN_INSTRUCTION_MINT_TO_CHECKED),
    u64LE(SKAM_RAW_SUPPLY),
    Uint8Array.of(SKAM_DECIMALS),
  );
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

export function buildMintSupplyTransaction({ owner, mint, blockhash }) {
  const ata = getAssociatedTokenAddress(mint, owner);
  const transaction = new Transaction({ feePayer: owner, recentBlockhash: blockhash }).add(
    createAssociatedTokenAccountInstruction({ payer: owner, ata, owner, mint }),
    createMintToCheckedInstruction({ mint, ata, authority: owner }),
  );
  return { transaction, ata };
}

export function parseMintBase(data) {
  if (!(data instanceof Uint8Array) || data.length < 82) throw new Error('Mint account data terlalu pendek.');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const mintAuthorityOption = view.getUint32(0, true);
  const mintAuthority = mintAuthorityOption === 1 ? new PublicKey(data.slice(4, 36)).toBase58() : null;
  let supply = 0n;
  for (let i = 7; i >= 0; i -= 1) supply = (supply << 8n) | BigInt(data[36 + i]);
  const decimals = data[44];
  const initialized = data[45] === 1;
  const freezeAuthorityOption = view.getUint32(46, true);
  const freezeAuthority = freezeAuthorityOption === 1 ? new PublicKey(data.slice(50, 82)).toBase58() : null;
  return { mintAuthority, supply, decimals, initialized, freezeAuthority };
}

export function findTlvExtension(data, type) {
  if (!(data instanceof Uint8Array) || data.length <= 166) return null;
  let offset = 166;
  while (offset + 4 <= data.length) {
    const view = new DataView(data.buffer, data.byteOffset + offset, data.byteLength - offset);
    const entryType = view.getUint16(0, true);
    const entryLength = view.getUint16(2, true);
    const start = offset + 4;
    const end = start + entryLength;
    if (end > data.length) return null;
    if (entryType === type) return data.slice(start, end);
    offset = end;
  }
  return null;
}

export function verifySkamMintAccount(accountInfo, approvedWallet) {
  if (!accountInfo) throw new Error('Mint account belum ditemukan on-chain.');
  if (!accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) throw new Error('Mint bukan milik Token-2022 program.');
  const base = parseMintBase(accountInfo.data);
  if (!base.initialized) throw new Error('Mint belum initialized.');
  if (base.decimals !== SKAM_DECIMALS) throw new Error(`Decimals on-chain ${base.decimals}, expected ${SKAM_DECIMALS}.`);
  if (base.supply !== SKAM_RAW_SUPPLY) throw new Error(`Supply on-chain ${base.supply.toString()}, expected ${SKAM_RAW_SUPPLY.toString()}.`);
  if (base.mintAuthority !== approvedWallet) throw new Error('Mint authority bukan operator yang disetujui.');
  if (base.freezeAuthority !== approvedWallet) throw new Error('Freeze authority bukan operator yang disetujui.');
  const pointer = findTlvExtension(accountInfo.data, METADATA_POINTER_EXTENSION_TYPE);
  if (!pointer || pointer.length !== 64) throw new Error('MetadataPointer extension tidak ditemukan.');
  const metadata = findTlvExtension(accountInfo.data, TOKEN_METADATA_EXTENSION_TYPE);
  if (!metadata) throw new Error('TokenMetadata extension tidak ditemukan.');
  return { ...base, metadataPointerPresent: true, tokenMetadataPresent: true };
}
