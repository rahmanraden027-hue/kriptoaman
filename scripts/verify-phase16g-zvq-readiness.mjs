import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve('.');
const registry = JSON.parse(await readFile('chain/zevaryq-mainnet/registry/zvq-production-registry.draft.json', 'utf8'));
const liquidity = JSON.parse(await readFile('chain/zevaryq-mainnet/liquidity/liquidity-readiness.draft.json', 'utf8'));
const exchange = await readFile('docs/ZVQ_EXCHANGE_MARKET_SUBMISSION_PACKAGE.md', 'utf8');
const reconciliation = JSON.parse(await readFile('chain/zevaryq-mainnet/registry/zvq-supply-reconciliation.draft.json', 'utf8'));
const supplyAttestation = JSON.parse(await readFile('chain/zevaryq-mainnet/registry/zvq-supply-attestation.template.json', 'utf8'));
const governance = JSON.parse(await readFile('chain/zevaryq-mainnet/registry/zvq-tokenomics-v2-governance.template.json', 'utf8'));
const networkProfile = JSON.parse(await readFile('chain/kam-mainnet/network-profile.json', 'utf8'));
const chainTokenomics = JSON.parse(await readFile('chain/kam-mainnet/tokenomics-v1.json', 'utf8'));
const archiveTokenomics = await readFile('docs/KAM_TOKENOMICS_V1.md', 'utf8');
const tradingReadme = await readFile('chain/zevaryq-mainnet/trading/README.md', 'utf8');

assert.equal(registry.phase, '16G');
assert.equal(registry.status, 'DRAFT_PRE_PRODUCTION_REGISTRY');
assert.equal(registry.network.name, 'ZEVARYQ Mainnet');
assert.equal(registry.network.nativeSymbol, 'ZVQ');
assert.equal(registry.network.chainId, 22028);
assert.equal(registry.network.chainIdHex, '0x560c');
assert.equal(registry.network.decimals, 18);

assert.equal(registry.supplyPolicy.maximumSupplyProjectBaseline, '1000000000');
assert.equal(registry.supplyPolicy.proposedInitialCirculatingTarget, '70000000');
assert.equal(registry.supplyPolicy.proposedInitialCirculatingPercent, '7');
assert.equal(registry.supplyPolicy.legacyKamInitialCirculatingTarget, '50000000');
assert.equal(registry.supplyPolicy.onChainMaximumSupplyVerified, false);
assert.equal(registry.supplyPolicy.onChainTotalSupplyVerified, false);
assert.equal(registry.supplyPolicy.circulatingSupplyVerified, false);
assert.equal(registry.supplyPolicy.externalSubmissionAllowed, false);
assert.equal(registry.supplyPolicy.reconciliationStatus, 'BLOCKED_PENDING_PRODUCTION_GENESIS_ATTESTATION_AND_ALLOCATION_WALLETS');
assert.equal(registry.supplyPolicy.historicalAllocationDriftDetected, true);
assert.equal(registry.supplyPolicy.circulatingTargetDistinctFromLiquidityAllocation, true);

assert.equal(networkProfile.genesisSupplyKAM, '1000000000');
assert.equal(chainTokenomics.asset.genesisSupplyKAM, '1000000000');
assert.match(archiveTokenomics, /Maximum supply baseline: \*\*1,000,000,000 KAM\*\*/);
assert.match(archiveTokenomics, /Target initial circulating supply: \*\*50,000,000 KAM \(5%\)\*\*/);

assert.equal(reconciliation.status, 'BLOCKED_PENDING_PRODUCTION_GENESIS_ATTESTATION_AND_ALLOCATION_WALLETS');
assert.equal(reconciliation.supplyReferences.networkProfileGenesisSupplyReference, '1000000000');
assert.equal(reconciliation.supplyReferences.chainTokenomicsGenesisSupplyReference, '1000000000');
assert.equal(reconciliation.supplyReferences.proposedZvqInitialCirculatingTarget, '70000000');
assert.equal(reconciliation.historicalAllocationDrift.detected, true);
assert.equal(reconciliation.historicalAllocationDrift.reconciled, false);
assert.equal(reconciliation.historicalAllocationDrift.circulatingTargetDistinctFromLiquidityAllocation, true);
assert.equal(reconciliation.evidenceAssessment.productionGenesisAggregateSupplyAttestationPresent, false);
assert.equal(reconciliation.evidenceAssessment.canonicalAllocationWalletsPublished, false);
assert.equal(reconciliation.evidenceAssessment.currentTotalSupplyVerified, false);
assert.equal(reconciliation.evidenceAssessment.currentCirculatingSupplyVerified, false);
assert.equal(reconciliation.publicationState.exchangeSupplySubmissionAuthorized, false);
assert.equal(reconciliation.publicationState.marketDataSupplySubmissionAuthorized, false);

assert.equal(supplyAttestation.status, 'TEMPLATE_NOT_EVIDENCE');
assert.equal(supplyAttestation.assertions.currentTotalSupplyVerified, false);
assert.equal(supplyAttestation.assertions.currentCirculatingSupplyVerified, false);
assert.equal(supplyAttestation.assertions.externalSubmissionAuthorized, false);

assert.equal(governance.status, 'TEMPLATE_NOT_APPROVAL');
assert.equal(governance.proposedPolicy.maximumSupplyProjectBaselineZVQ, '1000000000');
assert.equal(governance.proposedPolicy.initialCirculatingTargetZVQ, '70000000');
assert.equal(governance.decisionsRequired.approve50MTo70MTargetChange, false);
assert.equal(governance.decisionsRequired.resolveHistoricalAllocationDrift, false);
assert.equal(governance.decisionsRequired.selectedAllocationPolicyVersion, null);
assert.deepEqual(governance.decisionsRequired.approvedAllocationCategories, []);
assert.equal(governance.approval.approved, false);
assert.equal(governance.externalPublication.tokenomicsV2Canonical, false);
assert.equal(governance.externalPublication.exchangeSubmissionAuthorized, false);

const executable = registry.assets.filter(asset => asset.executable);
assert.deepEqual(executable.map(asset => asset.symbol), ['ZVQ'], 'Only native ZVQ may be executable in the draft registry');

const deprecated = registry.deprecatedAssets.find(asset => asset.symbol === 'zUSD');
assert.equal(deprecated?.status, 'DEPRECATED_DO_NOT_INDEX');

for (const asset of registry.assets) {
  if (asset.logoStatus === 'AVAILABLE') {
    assert.ok(asset.logo, asset.symbol + ' must have a canonical logo path');
    await access(resolve(ROOT, 'public' + asset.logo));
  }
  if (asset.symbol !== 'ZVQ') {
    assert.equal(asset.contractAddress, null, asset.symbol + ' must not claim a deployed contract');
  }
}

assert.equal(liquidity.phase, '16G');
assert.equal(liquidity.status, 'PRE_EXECUTION_READINESS_ONLY');
assert.equal(liquidity.liquidityAuthorized, false);
assert.equal(liquidity.publicSwapAuthorized, false);
assert.equal(liquidity.mainnetContractDeploymentAuthorized, false);
assert.equal(liquidity.requiresPhase16FLongRunStable, true);

for (const [gate, value] of Object.entries(liquidity.preconditions)) {
  assert.equal(value, false, gate + ' must remain false until separately evidenced');
}

for (const pair of liquidity.candidatePairs) {
  assert.equal(pair.status, 'PLANNED');
  assert.equal(pair.poolAddress, null);
  assert.equal(pair.liquidityAmountZVQ, null);
  assert.equal(pair.liquidityAmountQuote, null);
  assert.equal(pair.quoteAssetProvenance, 'PENDING');
}

assert.equal(liquidity.executionEvidenceRequired.sourceWallet, null);
assert.equal(liquidity.executionEvidenceRequired.custodyReference, null);
assert.equal(liquidity.executionEvidenceRequired.treasuryApprovalReference, null);
assert.deepEqual(liquidity.executionEvidenceRequired.transactionHashes, []);
assert.deepEqual(liquidity.executionEvidenceRequired.poolAddresses, []);

assert.equal(liquidity.marketIntegrityPolicy.washTradingAllowed, false);
assert.equal(liquidity.marketIntegrityPolicy.fabricatedVolumeAllowed, false);
assert.equal(liquidity.marketIntegrityPolicy.artificialPriceSupportAllowed, false);
assert.equal(liquidity.marketIntegrityPolicy.projectDeclaredPriceAllowed, false);

assert.match(exchange, /Current verified circulating supply: \*\*NOT YET VERIFIED\*\*/);
assert.match(exchange, /FINAL_SUBMISSION_AUTHORIZED = false/);
assert.match(exchange, /LONG_RUN_STABLE/);
assert.match(exchange, /zUSD: deprecated/);

for (const line of [
  'WZVQ_DEPLOYMENT_AUTHORIZED = false',
  'FACTORY_DEPLOYMENT_AUTHORIZED = false',
  'ROUTER_DEPLOYMENT_AUTHORIZED = false',
  'QUOTE_ASSET_APPROVED = false',
  'LIQUIDITY_AUTHORIZED = false',
  'PUBLIC_SWAP_AUTHORIZED = false'
]) {
  assert.ok(tradingReadme.includes(line), line + ' must remain false');
}

console.log('PHASE16G_ZVQ_REGISTRY_READINESS=PASS');
console.log(JSON.stringify({
  network: registry.network,
  proposedSupplyPolicy: registry.supplyPolicy,
  supplyReconciliation: reconciliation.status,
  availableLogos: registry.assets.filter(asset => asset.logoStatus === 'AVAILABLE').map(asset => asset.symbol),
  pendingLogoIndexing: registry.assets.filter(asset => asset.logoStatus === 'PENDING_INDEXING').map(asset => asset.symbol),
  liquidityAuthorized: liquidity.liquidityAuthorized,
  publicSwapAuthorized: liquidity.publicSwapAuthorized
}, null, 2));
