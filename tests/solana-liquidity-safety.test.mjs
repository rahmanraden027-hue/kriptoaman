import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../chain/solana-liquidity/', import.meta.url);
const paths = {
  createToken: new URL('create-token-2022.sh', root),
  createPool: new URL('create-raydium-pool.mjs', root),
  smokeSwap: new URL('smoke-swap.mjs', root),
  verifyDex: new URL('verify-dexscreener.mjs', root),
  config: new URL('config.example.env', root),
};

const text = Object.fromEntries(
  await Promise.all(Object.entries(paths).map(async ([key, url]) => [key, await readFile(url, 'utf8')])),
);

test('Solana launch pack is fail-closed before real writes', () => {
  assert.match(text.createToken, /CREATE_REAL_SOLANA_TOKEN/);
  assert.match(text.createPool, /CREATE_REAL_RAYDIUM_POOL/);
  assert.match(text.smokeSwap, /EXECUTE_ONE_REAL_SMOKE_SWAP/);
  assert.match(text.config, /CONFIRM_CREATE_TOKEN=/);
  assert.match(text.config, /CONFIRM_CREATE_POOL=/);
  assert.match(text.config, /CONFIRM_SMOKE_SWAP=/);
});

test('quote asset defaults to canonical Solana USDC and pool tooling refuses substitutes', () => {
  const usdc = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  assert.match(text.config, new RegExp(usdc));
  assert.match(text.createPool, new RegExp(usdc));
  assert.match(text.createPool, /QUOTE_MINT must be canonical Solana USDC/);
});

test('smoke tool is one explicit swap rather than a volume loop', () => {
  assert.match(text.smokeSwap, /exactly one real smoke swap/i);
  assert.doesNotMatch(text.smokeSwap, /setInterval|while\s*\(|for\s*\(\s*;;/);
  assert.doesNotMatch(text.smokeSwap, /wash|fake volume|manufactur(e|ing).*volume/i);
});

test('DEX Screener verifier is read-only and enforces a fixed API origin', () => {
  assert.match(text.verifyDex, /endpoint = new URL/);
  assert.match(text.verifyDex, /endpoint\.origin/);
  assert.match(text.verifyDex, /Unexpected DEX Screener API origin/);
  assert.doesNotMatch(text.verifyDex, /KEYPAIR|sendTransaction|signTransaction|secretKey|writeFile/);
});

test('no recovery phrase/private key material is embedded in the launch pack', () => {
  const combined = Object.values(text).join('\n');
  for (const forbidden of [
    /solana-keygen\s+recover/i,
    /seed phrase/i,
    /mnemonic\s*=/i,
    /PRIVATE_KEY\s*=/,
    /SECRET_KEY\s*=/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test('operator scripts parse successfully', () => {
  const bashCheck = spawnSync('bash', ['-n', paths.createToken.pathname], { encoding: 'utf8' });
  assert.equal(bashCheck.status, 0, bashCheck.stderr);
  for (const path of [paths.createPool, paths.smokeSwap, paths.verifyDex]) {
    const check = spawnSync(process.execPath, ['--check', path.pathname], { encoding: 'utf8' });
    assert.equal(check.status, 0, check.stderr);
  }
});
