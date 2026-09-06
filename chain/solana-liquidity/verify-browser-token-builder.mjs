import assert from 'node:assert/strict';
import {
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction as officialCreateAta,
  createInitializeMetadataPointerInstruction as officialInitPointer,
  createInitializeMint2Instruction as officialInitMint2,
  createMintToCheckedInstruction as officialMintChecked,
  getAssociatedTokenAddressSync,
  getMintLen,
} from '@solana/spl-token';
import {
  createInitializeInstruction as officialInitMetadata,
  pack as packMetadata,
} from '@solana/spl-token-metadata';
import {
  SKAM_DECIMALS,
  SKAM_METADATA_URI,
  SKAM_MINT_SEED,
  SKAM_NAME,
  SKAM_RAW_SUPPLY,
  SKAM_SYMBOL,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMint2Instruction,
  createInitializeTokenMetadataInstruction,
  createMintToCheckedInstruction,
  deriveSkamMintAddress,
  getAssociatedTokenAddress,
  metadataPackedLength,
  mintBaseSpaceWithMetadataPointer,
  mintRentSpace,
} from '../../src/lib/skamToken2022Builder.js';

function normalize(ix) {
  return {
    programId: ix.programId.toBase58(),
    keys: ix.keys.map((key) => ({
      pubkey: key.pubkey.toBase58(),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(ix.data).toString('hex'),
  };
}

const owner = Keypair.generate().publicKey;
const mint = Keypair.generate().publicKey;

const officialPointer = officialInitPointer(mint, owner, mint, TOKEN_2022_PROGRAM_ID);
const browserPointer = createInitializeMetadataPointerInstruction(mint, owner);
assert.deepEqual(normalize(browserPointer), normalize(officialPointer), 'MetadataPointer instruction differs from official SPL builder');

const officialMint = officialInitMint2(mint, SKAM_DECIMALS, owner, owner, TOKEN_2022_PROGRAM_ID);
const browserMint = createInitializeMint2Instruction(mint, owner);
assert.deepEqual(normalize(browserMint), normalize(officialMint), 'InitializeMint2 instruction differs from official SPL builder');
assert.equal(browserMint.data.length, 67, 'InitializeMint2 must be exactly 67 bytes');

const officialMetadata = officialInitMetadata({
  programId: TOKEN_2022_PROGRAM_ID,
  metadata: mint,
  updateAuthority: owner,
  mint,
  mintAuthority: owner,
  name: SKAM_NAME,
  symbol: SKAM_SYMBOL,
  uri: SKAM_METADATA_URI,
});
const browserMetadata = await createInitializeTokenMetadataInstruction(mint, owner);
assert.deepEqual(normalize(browserMetadata), normalize(officialMetadata), 'TokenMetadata initialize instruction differs from official SPL builder');

const expectedMintLen = getMintLen([ExtensionType.MetadataPointer]);
assert.equal(mintBaseSpaceWithMetadataPointer(), expectedMintLen, 'MetadataPointer mint base space differs from official getMintLen');
const metadataState = {
  updateAuthority: owner,
  mint,
  name: SKAM_NAME,
  symbol: SKAM_SYMBOL,
  uri: SKAM_METADATA_URI,
  additionalMetadata: [],
};
const packedMetadataLen = packMetadata(metadataState).length;
assert.equal(metadataPackedLength(), packedMetadataLen, 'TokenMetadata packed state length differs from official pack()');
assert.equal(mintRentSpace(), expectedMintLen + 4 + packedMetadataLen, 'Final rent space must include the TokenMetadata TLV header and packed state');

const officialAtaAddress = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
const browserAtaAddress = getAssociatedTokenAddress(mint, owner);
assert.equal(browserAtaAddress.toBase58(), officialAtaAddress.toBase58(), 'ATA derivation differs from official SPL builder');

const officialAta = officialCreateAta(owner, officialAtaAddress, owner, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
const browserAta = createAssociatedTokenAccountInstruction({ payer: owner, ata: browserAtaAddress, owner, mint });
assert.deepEqual(normalize(browserAta), normalize(officialAta), 'ATA create instruction differs from official SPL builder');

const officialMintSupply = officialMintChecked(mint, officialAtaAddress, owner, SKAM_RAW_SUPPLY, SKAM_DECIMALS, [], TOKEN_2022_PROGRAM_ID);
const browserMintSupply = createMintToCheckedInstruction({ mint, ata: browserAtaAddress, authority: owner });
assert.deepEqual(normalize(browserMintSupply), normalize(officialMintSupply), 'MintToChecked instruction differs from official SPL builder');

const derivedA = await deriveSkamMintAddress(owner);
const derivedB = await PublicKey.createWithSeed(owner, SKAM_MINT_SEED, TOKEN_2022_PROGRAM_ID);
assert.equal(derivedA.toBase58(), derivedB.toBase58(), 'Deterministic mint derivation differs from web3.js createWithSeed');

assert.equal(new PublicKey(TOKEN_2022_PROGRAM_ID).toBase58(), TOKEN_2022_PROGRAM_ID.toBase58());
console.log('Browser sKAM Token-2022 builder matches official SPL instruction encoders.');
