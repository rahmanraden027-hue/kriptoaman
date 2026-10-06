import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 13 locks the accepted Phase 12 production baseline', async () => {
  const manifest = JSON.parse(await read('release/phase13-production-stability-lock.json'));

  assert.equal(manifest.phase, '13');
  assert.equal(manifest.status, 'release-lock-active');
  assert.equal(manifest.phase12Final.commit, '71cdc7923098ff488c9391995857f82ea79bae41');
  assert.equal(manifest.phase12Final.pullRequest, 1019);
  assert.equal(manifest.phase12Final.result, 'FINAL_PASS');

  assert.equal(manifest.releaseLock.enabled, true);
  assert.equal(manifest.releaseLock.automaticUnlock, false);
  assert.match(manifest.releaseLock.unlockPolicy, /separately reviewed release-unlock phase/i);

  assert.equal(manifest.protectedInvariants.chainId, 22028);
  assert.equal(manifest.protectedInvariants.chainIdHex, '0x560c');
  assert.equal(manifest.protectedInvariants.networkName, 'ZEVARYQ Network');
  assert.equal(manifest.protectedInvariants.mainnetName, 'ZEVARYQ Mainnet');
  assert.equal(manifest.protectedInvariants.nativeSymbol, 'ZVQ');
  assert.equal(manifest.protectedInvariants.commercialLaunchEnabled, false);
  assert.equal(manifest.protectedInvariants.genesisUnchanged, true);
  assert.equal(manifest.protectedInvariants.validatorKeysUnchanged, true);
  assert.equal(manifest.protectedInvariants.balancesUnchanged, true);
});

test('Phase 13 protects release-critical production surfaces', async () => {
  const manifest = JSON.parse(await read('release/phase13-production-stability-lock.json'));
  const protectedPaths = new Set(manifest.protectedPaths);

  for (const path of [
    'chain/kam-mainnet/network-profile.json',
    'chain/kam-mainnet/zevaryq-rebrand.json',
    'chain/kam-mainnet/public-rpc-gateway/worker.js',
    'public/kam-mainnet.json',
    'functions/api/kam/network-status.js',
    'functions/api/network-health.js',
    'explorer-dashboard/developer-network.json',
    'src/components/web3/Web3Provider.jsx',
    'src/services/zevaryqNetwork.js',
    'src/pages/Wallet.jsx',
    '.github/workflows/kam-chain-freeze-guard.yml',
    '.github/workflows/kam-mainnet-24x7-monitor.yml',
    '.github/workflows/zvq-explorer-browser-proof.yml',
    '.github/workflows/zvq-wallet-production-gate.yml',
    '.github/workflows/phase12-final-release-observation.yml',
    '.github/workflows/kam-landing-live-smoke.yml',
    '.github/workflows/security-audit.yml',
    'release/phase12-production-freeze.json',
  ]) {
    assert.equal(protectedPaths.has(path), true, path);
    const source = await read(path);
    assert.ok(source.length > 20, path + ' must remain present');
  }
});

test('Phase 13 stability policy requires repeated read-only evidence', async () => {
  const manifest = JSON.parse(await read('release/phase13-production-stability-lock.json'));
  const policy = manifest.stabilityPolicy;

  assert.equal(policy.readOnly, true);
  assert.equal(policy.sampleIntervalSeconds, 25);
  assert.equal(policy.requiredRpcProgress, true);
  assert.equal(policy.requiredNetworkStatusVerified, true);
  assert.equal(policy.requiredExplorerIdentity, true);
  assert.equal(policy.requiredMarketAssetFloor, 4500);
  assert.equal(policy.requiredPublicNetworksOnlineFloor, 12);
  assert.equal(policy.expectedPublicNetworkProbeCount, 21);

  const forbidden = new Set(manifest.forbiddenPhase13Mutations);
  for (const item of [
    'genesis', 'validator-keys', 'private-keys', 'balances', 'transactions',
    'dns', 'rpc-write-methods', 'wallet-signing', 'wallet-broadcasting', 'token-state'
  ]) assert.equal(forbidden.has(item), true, item);
});

test('Phase 13 workflow is scheduled, multi-sample, and read-only', async () => {
  const workflow = await read('.github/workflows/phase13-production-stability-release-lock.yml');

  assert.match(workflow, /cron: '13 \*\/3 \* \* \*'/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /git diff --quiet/);
  assert.match(workflow, /sleep 25/);
  assert.match(workflow, /eth_chainId/);
  assert.match(workflow, /eth_blockNumber/);
  assert.match(workflow, /api\/kam\/network-status/);
  assert.match(workflow, /api\/network-health/);
  assert.match(workflow, /market-snapshot\?health=1/);
  assert.match(workflow, /developer\/network\.json/);
  assert.match(workflow, /api\/v2\/blocks/);
  assert.doesNotMatch(workflow, /api\/v2\/blocks\?phase13/);
  assert.match(workflow, /actions\/upload-artifact/);

  assert.doesNotMatch(workflow, /eth_sendRawTransaction|eth_sendTransaction|wallet_sendCalls/);
  assert.doesNotMatch(workflow, /admin_|debug_|personal_/);
  assert.doesNotMatch(workflow, /private.?key|mnemonic|seed phrase/i);
});
