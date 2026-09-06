import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const launcherUrl = new URL('../chain/solana-liquidity/launch-skam-mainnet.sh', import.meta.url);
const nodeMintUrl = new URL('../chain/solana-liquidity/create-token-2022.mjs', import.meta.url);
const packageUrl = new URL('../chain/solana-liquidity/package.json', import.meta.url);
const launcher = await readFile(launcherUrl, 'utf8');
const nodeMint = await readFile(nodeMintUrl, 'utf8');
const pkg = JSON.parse(await readFile(packageUrl, 'utf8'));

test('sKAM mainnet orchestrator is fail-closed behind all irreversible gates', () => {
  assert.match(launcher, /CONFIRM_FULL_SKAM_LAUNCH/);
  assert.match(launcher, /LAUNCH_REAL_SKAM_MAINNET/);
  assert.match(launcher, /CREATE_REAL_SOLANA_TOKEN/);
  assert.match(launcher, /CREATE_REAL_RAYDIUM_POOL/);
  assert.match(launcher, /EXECUTE_ONE_REAL_SMOKE_SWAP/);
});

test('sKAM mainnet orchestrator pins approved public identity and canonical WSOL', () => {
  assert.ok(launcher.includes('5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK'));
  assert.ok(launcher.includes('Solana KAM'));
  assert.ok(launcher.includes('EXPECTED_SYMBOL="sKAM"'));
  assert.ok(launcher.includes('EXPECTED_SUPPLY="1000000000"'));
  assert.ok(launcher.includes('So11111111111111111111111111111111111111112'));
  assert.ok(launcher.includes('https://kriptoaman.com/token/skam.json'));
});

test('Termux launch path is Node-only and does not execute Solana native CLI binaries', () => {
  assert.match(launcher, /node create-token-2022\.mjs/);
  assert.match(launcher, /Execution mode: Node\.js only/);
  assert.doesNotMatch(launcher, /^\s*solana(?:\s|$)/m);
  assert.doesNotMatch(launcher, /^\s*spl-token(?:\s|$)/m);
  assert.doesNotMatch(launcher, /command\s+-v\s+solana/);
  assert.doesNotMatch(launcher, /command\s+-v\s+spl-token/);
  assert.equal(pkg.dependencies['@solana/spl-token'], '0.4.15');
  assert.equal(pkg.dependencies['@solana/spl-token-metadata'], '0.1.6');
});

test('Node Token-2022 creator uses metadata pointer, checked minting and approved signer gate', () => {
  assert.match(nodeMint, /createInitializeMetadataPointerInstruction/);
  assert.match(nodeMint, /createInitializeMintInstruction/);
  assert.match(nodeMint, /createInitializeInstruction/);
  assert.match(nodeMint, /createMintToCheckedInstruction/);
  assert.match(nodeMint, /TLV_TYPE_SIZE = 2/);
  assert.match(nodeMint, /TLV_LENGTH_SIZE = 2/);
  assert.match(nodeMint, /Signer mismatch/);
  assert.match(nodeMint, /rawSupply > 18_446_744_073_709_551_615n/);
  assert.match(nodeMint, /skipPreflight:\s*false/);
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

test('orchestrator and Node mint path never embed or recover secret key material', () => {
  const combined = `${launcher}\n${nodeMint}`;
  for (const forbidden of [
    /solana-keygen\s+recover/i,
    /seed phrase\s*=/i,
    /mnemonic\s*=/i,
    /PRIVATE_KEY\s*=/,
    /SECRET_KEY\s*=/,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
  assert.match(launcher, /KEYPAIR must be an existing local JSON keypair file/);
});

test('operator scripts parse successfully', () => {
  const shellCheck = spawnSync('bash', ['-n', launcherUrl.pathname], { encoding: 'utf8' });
  assert.equal(shellCheck.status, 0, shellCheck.stderr);
  const nodeCheck = spawnSync(process.execPath, ['--check', nodeMintUrl.pathname], { encoding: 'utf8' });
  assert.equal(nodeCheck.status, 0, nodeCheck.stderr);
});
