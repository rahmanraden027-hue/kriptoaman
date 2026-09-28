import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = 'chain/zevaryq-mainnet/asset-layer';
const read = (name) => fs.readFileSync(`${root}/${name}`, 'utf8');

test('asset-layer tokenomics remain source-only and correctly parameterized', () => {
  const data = JSON.parse(read('tokenomics-v1.json'));

  assert.equal(data.chain.chainId, 22028);
  assert.equal(data.chain.nativeAsset, 'ZVQ');

  assert.equal(data.assets.ZUSD.symbol, 'ZUSD');
  assert.equal(data.assets.ZUSD.decimals, 6);
  assert.equal(data.assets.ZUSD.premine, '0');
  assert.equal(data.assets.ZUSD.deploymentAuthorized, false);

  assert.equal(data.assets.zBTC.symbol, 'zBTC');
  assert.equal(data.assets.zBTC.decimals, 8);
  assert.equal(data.assets.zBTC.premine, '0');
  assert.equal(data.assets.zBTC.deploymentAuthorized, false);

  assert.equal(data.assets.zETH.symbol, 'zETH');
  assert.equal(data.assets.zETH.decimals, 18);
  assert.equal(data.assets.zETH.premine, '0');
  assert.equal(data.assets.zETH.deploymentAuthorized, false);

  for (const value of Object.values(data.authorization)) {
    assert.equal(value, false);
  }

  assert.equal(data.thirdPartyIssuerAssets.USDC, 'not-created-by-this-specification');
  assert.equal(data.thirdPartyIssuerAssets.USDT, 'not-created-by-this-specification');
});

test('asset-layer implementation remains source-only and non-deploying', () => {
  const interfaces = fs.readdirSync(`${root}/interfaces`);
  assert.deepEqual(interfaces.sort(), ['IZAssetBridge.sol', 'IZUSD.sol']);

  for (const file of interfaces) {
    const source = read(`interfaces/${file}`);
    assert.match(source, /interface\s+I/);
    assert.doesNotMatch(source, /delegatecall/i);
  }

  const entries = fs.readdirSync(root, { recursive: true }).map(String);
  assert.equal(entries.some((entry) => /\.s\.sol$/i.test(entry)), false);
  assert.equal(entries.some((entry) => /deploy.*\.(js|mjs|ts)$/i.test(entry)), false);

  for (const entry of entries.filter((entry) => entry.endsWith('.sol'))) {
    const source = read(entry);
    assert.doesNotMatch(source, /delegatecall/i);
    assert.doesNotMatch(source, /selfdestruct/i);
  }
});


test('v0.2 hardening prevents backing reuse and unsafe controller migration', () => {
  const zusd = read('contracts/ZUSDReserveController.sol');
  const bridge = read('contracts/ZAssetBridgeController.sol');
  const token = read('contracts/common/ZControlledERC20.sol');

  assert.match(zusd, /reserveOutflowSinceAttestation/);
  assert.match(zusd, /usedSettlementReference/);
  assert.match(zusd, /effectiveReserveUnits\(\)/);

  assert.match(bridge, /releasedUnitsSinceAttestation/);
  assert.match(bridge, /pendingReleaseUnits/);
  assert.match(bridge, /usedReleaseProof/);
  assert.match(bridge, /effectiveLockedUnits\(\)/);
  assert.match(bridge, /refreshDepositAttestation/);

  assert.match(token, /nextController\.code\.length/);
  assert.match(token, /canRelinquishControl\(\)/);
  assert.match(token, /candidate\.token\(\) != address\(this\)/);
});


test('pre-deployment readiness package remains fail-closed', () => {
  const readiness = JSON.parse(read('deployment-readiness-v1.json'));

  assert.equal(readiness.network.chainId, 22028);
  assert.equal(readiness.source.sourceOnly, true);
  assert.equal(readiness.authorization.assetLayerAuditComplete, false);
  assert.equal(readiness.authorization.assetLayerDeploymentAuthorized, false);
  assert.equal(readiness.authorization.reserveCustodyProven, false);
  assert.equal(readiness.authorization.btcBridgeBackingProven, false);
  assert.equal(readiness.authorization.ethBridgeBackingProven, false);
  assert.equal(readiness.authorization.liquidityAuthorized, false);
  assert.equal(readiness.authorization.publicTradingAuthorized, false);

  assert.equal(readiness.gates.governance, 'hold');
  assert.equal(readiness.gates.zusdBacking, 'hold');
  assert.equal(readiness.gates.zbtcBacking, 'hold');
  assert.equal(readiness.gates.zethBacking, 'hold');
  assert.equal(readiness.gates.deploymentRehearsal, 'hold');
});

test('production authorization flags remain closed', () => {
  const readme = read('README.md');
  const spec = read('SMART_CONTRACT_SPEC_V1.md');

  for (const flag of [
    'ZUSD_DEPLOYMENT_AUTHORIZED = false',
    'ZBTC_DEPLOYMENT_AUTHORIZED = false',
    'ZETH_DEPLOYMENT_AUTHORIZED = false',
    'RESERVE_BACKING_VERIFIED = false',
    'BRIDGE_BACKING_VERIFIED = false',
    'LIQUIDITY_AUTHORIZED = false'
  ]) {
    assert.ok(readme.includes(flag), flag);
  }

  for (const flag of [
    'ASSET_LAYER_DEPLOYMENT_AUTHORIZED = false',
    'LIQUIDITY_AUTHORIZED = false',
    'PUBLIC_TRADING_AUTHORIZED = false'
  ]) {
    assert.ok(spec.includes(flag), flag);
  }
});

test('spec explicitly prevents issuer impersonation and unbacked mint', () => {
  const spec = read('SMART_CONTRACT_SPEC_V1.md');

  assert.match(spec, /must not:\n\n- create a token called USDT or USDC and imply issuer authorization/i);
  assert.match(spec, /postMintTotalSupply <= verifiedReserveUnits/);
  assert.match(spec, /postMintTotalSupply\(zBTC\) <= verifiedLockedBTC/);
  assert.match(spec, /postMintTotalSupply\(zETH\) <= verifiedLockedETH/);
  assert.match(spec, /deficit is recorded truthfully/i);
  assert.match(spec, /deposit identifier can mint at most once/);
  assert.match(spec, /no unrestricted `ownerMint`/i);
});
