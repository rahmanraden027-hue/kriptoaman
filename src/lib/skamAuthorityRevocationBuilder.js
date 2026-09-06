import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export const SKAM_TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export const SKAM_MINT = new PublicKey('Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi');
export const SKAM_OPERATOR = new PublicKey('5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK');
export const SKAM_DECIMALS = 9;
export const SKAM_RAW_SUPPLY = 1_000_000_000n * 10n ** 9n;

const TOKEN_INSTRUCTION_SET_AUTHORITY = 6;
const AUTHORITY_MINT_TOKENS = 0;
const AUTHORITY_FREEZE_ACCOUNT = 1;

function setAuthorityNoneInstruction(authorityType, currentAuthority = SKAM_OPERATOR) {
  return new TransactionInstruction({
    programId: SKAM_TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: SKAM_MINT, isSigner: false, isWritable: true },
      { pubkey: currentAuthority, isSigner: true, isWritable: false },
    ],
    // TokenInstruction::SetAuthority = 6, AuthorityType, COption::None = 0.
    data: Uint8Array.of(TOKEN_INSTRUCTION_SET_AUTHORITY, authorityType, 0),
  });
}

export function createRevokeMintAuthorityInstruction(currentAuthority = SKAM_OPERATOR) {
  return setAuthorityNoneInstruction(AUTHORITY_MINT_TOKENS, currentAuthority);
}

export function createRevokeFreezeAuthorityInstruction(currentAuthority = SKAM_OPERATOR) {
  return setAuthorityNoneInstruction(AUTHORITY_FREEZE_ACCOUNT, currentAuthority);
}

export function buildSkamAuthorityRevocationTransaction({
  owner,
  blockhash,
  revokeMint = true,
  revokeFreeze = true,
}) {
  const authority = owner instanceof PublicKey ? owner : new PublicKey(owner);
  if (!authority.equals(SKAM_OPERATOR)) {
    throw new Error(`Wallet harus Signer 1 sKAM ${SKAM_OPERATOR.toBase58()}.`);
  }
  if (!blockhash) throw new Error('Recent blockhash diperlukan.');
  if (!revokeMint && !revokeFreeze) throw new Error('Tidak ada authority yang perlu dicabut.');

  const transaction = new Transaction({ feePayer: authority, recentBlockhash: blockhash });
  if (revokeMint) transaction.add(createRevokeMintAuthorityInstruction(authority));
  if (revokeFreeze) transaction.add(createRevokeFreezeAuthorityInstruction(authority));
  return transaction;
}

function readCOptionPubkey(data, optionOffset, keyOffset) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const option = view.getUint32(optionOffset, true);
  if (option === 0) return null;
  if (option !== 1) throw new Error(`COption authority tidak valid: ${option}.`);
  return new PublicKey(data.slice(keyOffset, keyOffset + 32)).toBase58();
}

function readU64LE(data, offset) {
  let value = 0n;
  for (let i = 7; i >= 0; i -= 1) value = (value << 8n) | BigInt(data[offset + i]);
  return value;
}

export function inspectSkamMintAccount(accountInfo) {
  if (!accountInfo) throw new Error('Mint sKAM tidak ditemukan on-chain.');
  if (!new PublicKey(accountInfo.owner).equals(SKAM_TOKEN_2022_PROGRAM_ID)) {
    throw new Error(`Owner program mint bukan Token-2022: ${accountInfo.owner.toBase58?.() || accountInfo.owner}.`);
  }
  const data = accountInfo.data instanceof Uint8Array ? accountInfo.data : new Uint8Array(accountInfo.data);
  if (data.length < 82) throw new Error('Data mint sKAM terlalu pendek.');

  const state = {
    mint: SKAM_MINT.toBase58(),
    mintAuthority: readCOptionPubkey(data, 0, 4),
    supply: readU64LE(data, 36),
    decimals: data[44],
    initialized: data[45] === 1,
    freezeAuthority: readCOptionPubkey(data, 46, 50),
  };

  if (!state.initialized) throw new Error('Mint sKAM belum initialized.');
  if (state.decimals !== SKAM_DECIMALS) throw new Error(`Decimals sKAM berubah: ${state.decimals}.`);
  if (state.supply !== SKAM_RAW_SUPPLY) throw new Error(`Supply sKAM berubah: ${state.supply}.`);

  for (const [label, authority] of [['mint', state.mintAuthority], ['freeze', state.freezeAuthority]]) {
    if (authority !== null && authority !== SKAM_OPERATOR.toBase58()) {
      throw new Error(`${label} authority tidak sesuai pinned Signer 1: ${authority}.`);
    }
  }

  return state;
}
