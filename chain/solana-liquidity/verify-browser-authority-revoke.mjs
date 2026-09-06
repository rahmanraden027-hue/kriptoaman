import assert from 'node:assert/strict';
import {
  AuthorityType,
  TOKEN_2022_PROGRAM_ID,
  createSetAuthorityInstruction,
} from '@solana/spl-token';
import {
  SKAM_MINT,
  SKAM_OPERATOR,
  SKAM_TOKEN_2022_PROGRAM_ID,
  createRevokeFreezeAuthorityInstruction,
  createRevokeMintAuthorityInstruction,
} from '../../src/lib/skamAuthorityRevocationBuilder.js';

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

assert.equal(SKAM_TOKEN_2022_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58());

const officialMint = createSetAuthorityInstruction(
  SKAM_MINT,
  SKAM_OPERATOR,
  AuthorityType.MintTokens,
  null,
  [],
  TOKEN_2022_PROGRAM_ID,
);
const browserMint = createRevokeMintAuthorityInstruction(SKAM_OPERATOR);
assert.deepEqual(normalize(browserMint), normalize(officialMint), 'Browser MintTokens revoke differs from official SPL encoder');

const officialFreeze = createSetAuthorityInstruction(
  SKAM_MINT,
  SKAM_OPERATOR,
  AuthorityType.FreezeAccount,
  null,
  [],
  TOKEN_2022_PROGRAM_ID,
);
const browserFreeze = createRevokeFreezeAuthorityInstruction(SKAM_OPERATOR);
assert.deepEqual(normalize(browserFreeze), normalize(officialFreeze), 'Browser FreezeAccount revoke differs from official SPL encoder');

console.log('Browser sKAM Mint/Freeze authority revocation instructions match official @solana/spl-token encoders.');
