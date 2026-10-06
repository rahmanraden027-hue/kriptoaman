import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const root = 'chain/zevaryq-mainnet/asset-layer';
const read = (name) => fs.readFileSync(`${root}/${name}`);

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
}

test('audit freeze matches exact Asset Layer source blobs', () => {
  const freeze = JSON.parse(read('AUDIT_FREEZE_V1.json').toString('utf8'));

  assert.equal(freeze.network.chainId, 22028);
  assert.equal(freeze.source.solc, '0.8.24');
  assert.equal(freeze.source.evmVersion, 'paris');
  assert.equal(freeze.source.contractSourceCommit, '17728f550f6dff32ca6ba44a7b886bffca01a95f');

  for (const [path, expectedSha] of Object.entries(freeze.files)) {
    const actualSha = gitBlobSha(read(path));
    assert.equal(actualSha, expectedSha, `audit freeze drift: ${path}`);
  }

  for (const value of Object.values(freeze.authorization)) {
    assert.equal(value, false);
  }
});

test('governance registry stays unset until explicit production configuration', () => {
  const registry = JSON.parse(read('governance-role-registry-v1.json').toString('utf8'));

  assert.equal(registry.chainId, 22028);
  assert.equal(registry.status, 'unset');
  assert.equal(registry.verified, false);
  assert.equal(registry.deploymentAuthorized, false);

  for (const [role, config] of Object.entries(registry.roles)) {
    assert.equal(config.address, null, `${role} unexpectedly configured`);
  }

  assert.equal(registry.roles.treasurySafe.mintAuthority, false);
});

test('backing evidence remains unproven and deployment remains HOLD', () => {
  const readiness = JSON.parse(read('deployment-readiness-v1.json').toString('utf8'));
  const schema = read('BACKING_EVIDENCE_SCHEMA_V1.md').toString('utf8');

  assert.equal(readiness.authorization.assetLayerAuditComplete, false);
  assert.equal(readiness.authorization.assetLayerDeploymentAuthorized, false);
  assert.equal(readiness.authorization.reserveCustodyProven, false);
  assert.equal(readiness.authorization.btcBridgeBackingProven, false);
  assert.equal(readiness.authorization.ethBridgeBackingProven, false);
  assert.equal(readiness.authorization.liquidityAuthorized, false);
  assert.equal(readiness.authorization.publicTradingAuthorized, false);

  assert.match(schema, /RESERVE_CUSTODY_PROVEN = false/);
  assert.match(schema, /BTC_BRIDGE_BACKING_PROVEN = false/);
  assert.match(schema, /ETH_BRIDGE_BACKING_PROVEN = false/);
});
