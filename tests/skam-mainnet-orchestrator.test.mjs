import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const launcherUrl = new URL('../chain/solana-liquidity/launch-skam-mainnet.sh', import.meta.url);
const launcher = await readFile(launcherUrl, 'utf8');

test('sKAM mainnet orchestrator is fail-closed behind all irreversible gates', () => {
  assert.match(launcher, /CONFIRM_FULL_SKAM_LAUNCH/);
  assert.match(launcher, /LAUNCH_REAL_SKAM_MAINNET/);
  assert.match(launcher, /CREATE_REAL_SOLANA_TOKEN/);
  assert.match(launcher, /CREATE_REAL_RAYDIUM_POOL/);
  assert.match(launcher, /EXECUTE_ONE_REAL_SMOKE_SWAP/);
});

test('sKAM mainnet orchestrator pins approved public identity and canonical WSOL', () => {
  assert.match(launcher, /5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK/);
  assert.match(launcher, /Solana KAM/);
  assert.match(launcher, /EXPECTED_SYMBOL="sKAM"/);
  assert.match(launcher, /EXPECTED_SUPPLY="1000000000"/);
  assert.match(launcher, /So11111111111111111111111111111111111111112/);
  assert.match(launcher, /https:\/\/kriptoaman\.com\/token\/skam\.json/);
});

test('orchestrator keeps smoke trade deliberately small and singular', () => {
  assert.match(launcher, /DEFAULT_SMOKE_INPUT_UI="0\.001"/);
  assert.match(launcher, /MAX_SMOKE_INPUT_UI="0\.005"/);
  assert.match(launcher, /SMOKE_DIRECTION="quote-to-token" node smoke-swap\.mjs/);
  const smokeCalls = launcher.match(/node smoke-swap\.mjs/g) ?? [];
  assert.equal(smokeCalls.length, 1);
  assert.doesNotMatch(launcher, /while\s+true|for\s*\(\s*;\s*;\s*\)/);
});

test('DEX Screener polling is read-only, bounded, and cannot claim readiness on timeout', () => {
  assert.match(launcher, /DEXSCREENER_MAX_ATTEMPTS/);
  assert.match(launcher, /attempt<=DEXSCREENER_MAX_ATTEMPTS/);
  assert.match(launcher, /node verify-dexscreener\.mjs/);
  assert.match(launcher, /Do not claim DEX Screener readiness yet/);
  assert.match(launcher, /"dexScreenerVerified": true/);
});

test('orchestrator never embeds or recovers secret key material', () => {
  for (const forbidden of [
    /solana-keygen\s+recover/i,
    /seed phrase\s*=/i,
    /mnemonic\s*=/i,
    /PRIVATE_KEY\s*=/,
    /SECRET_KEY\s*=/,
  ]) {
    assert.doesNotMatch(launcher, forbidden);
  }
  assert.match(launcher, /KEYPAIR must be an existing local file/);
});

test('orchestrator shell parses successfully', () => {
  const check = spawnSync('bash', ['-n', launcherUrl.pathname], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
});
