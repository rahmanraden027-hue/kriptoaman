import assert from 'node:assert/strict';
import test from 'node:test';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '../src/lib/solana/skamSplInstructions.js';

const owner = new PublicKey('5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK');
const mint = new PublicKey('So11111111111111111111111111111111111111112');
const supply = 1_000_000_000_000_000_000n;

const bytes = (value) => Array.from(value);

test('sKAM legacy SPL constants are canonical', () => {
  assert.equal(TOKEN_PROGRAM_ID.toBase58(), 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  assert.equal(ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(), 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  assert.equal(MINT_SIZE, 82);
});

test('sKAM ATA derivation uses owner + token program + mint seeds', () => {
  const expected = PublicKey.findProgramAddressSync(
    [owner.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
  assert.equal(getAssociatedTokenAddressSync(mint, owner).toBase58(), expected.toBase58());
});

test('InitializeMint2 bytes match canonical SPL Token encoding', () => {
  const instruction = createInitializeMint2Instruction(mint, 9, owner, owner);
  assert.equal(instruction.programId.toBase58(), TOKEN_PROGRAM_ID.toBase58());
  assert.equal(instruction.keys.length, 1);
  assert.equal(instruction.keys[0].pubkey.toBase58(), mint.toBase58());
  assert.equal(instruction.keys[0].isSigner, false);
  assert.equal(instruction.keys[0].isWritable, true);
  assert.equal(instruction.data.length, 67);
  assert.equal(instruction.data[0], 20);
  assert.equal(instruction.data[1], 9);
  assert.deepEqual(bytes(instruction.data.slice(2, 34)), bytes(owner.toBytes()));
  assert.equal(instruction.data[34], 1);
  assert.deepEqual(bytes(instruction.data.slice(35, 67)), bytes(owner.toBytes()));
});

test('MintToChecked bytes encode exact 1e18 base-unit supply as little-endian u64', () => {
  const destination = getAssociatedTokenAddressSync(mint, owner);
  const instruction = createMintToCheckedInstruction(mint, destination, owner, supply, 9);
  assert.equal(instruction.programId.toBase58(), TOKEN_PROGRAM_ID.toBase58());
  assert.equal(instruction.data.length, 10);
  assert.equal(instruction.data[0], 14);
  assert.equal(instruction.data[9], 9);
  let decoded = 0n;
  for (let index = 7; index >= 0; index -= 1) decoded = (decoded << 8n) | BigInt(instruction.data[1 + index]);
  assert.equal(decoded, supply);
  assert.deepEqual(instruction.keys.map((key) => [key.pubkey.toBase58(), key.isSigner, key.isWritable]), [
    [mint.toBase58(), false, true],
    [destination.toBase58(), false, true],
    [owner.toBase58(), true, false],
  ]);
});

test('Associated Token create instruction has canonical six-account order and empty data', () => {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const instruction = createAssociatedTokenAccountInstruction(owner, ata, owner, mint);
  assert.equal(instruction.programId.toBase58(), ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
  assert.equal(instruction.data.length, 0);
  assert.deepEqual(instruction.keys.map((key) => key.pubkey.toBase58()), [
    owner.toBase58(),
    ata.toBase58(),
    owner.toBase58(),
    mint.toBase58(),
    SystemProgram.programId.toBase58(),
    TOKEN_PROGRAM_ID.toBase58(),
  ]);
});
