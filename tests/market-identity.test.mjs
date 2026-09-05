import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assessProviderIdentity,
  deriveProviderAssetIdentity,
} from '../functions/api/market-identity.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('CoinLore identity uses provider ID rather than symbol as its source key', () => {
  const identity = deriveProviderAssetIdentity({
    source: 'coinlore',
    id: 'coinlore-90',
    symbol: 'BTC',
    name: 'Bitcoin',
  });

  assert.equal(identity.provider, 'coinlore');
  assert.equal(identity.providerAssetId, '90');
  assert.equal(identity.sourceAssetKey, 'provider:coinlore:90');
  assert.equal(identity.symbol, 'BTC');
  assert.equal(identity.identityScope, 'provider-scoped');
  assert.equal(identity.canonicalAcrossProviders, false);
});

test('CoinGecko identity remains source-qualified and does not claim cross-provider canonicalization', () => {
  const identity = deriveProviderAssetIdentity({
    source: 'coingecko',
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
  });

  assert.equal(identity.providerAssetId, 'bitcoin');
  assert.equal(identity.sourceAssetKey, 'provider:coingecko:bitcoin');
  assert.equal(identity.symbol, 'BTC');
  assert.equal(identity.canonicalAcrossProviders, false);
});

test('same ticker can have distinct provider-scoped identities', () => {
  const first = deriveProviderAssetIdentity({
    source: 'coingecko',
    id: 'asset-one',
    symbol: 'ABC',
    name: 'Asset One',
  });
  const second = deriveProviderAssetIdentity({
    source: 'coingecko',
    id: 'asset-two',
    symbol: 'ABC',
    name: 'Asset Two',
  });

  assert.notEqual(first.sourceAssetKey, second.sourceAssetKey);
  assert.equal(first.symbol, second.symbol);
});

test('identity assessment detects duplicate source keys without using ticker collisions as identity', () => {
  const assessment = assessProviderIdentity([
    { id: 'asset-one', symbol: 'ABC', name: 'Asset One' },
    { id: 'asset-two', symbol: 'ABC', name: 'Asset Two' },
    { id: 'asset-two', symbol: 'XYZ', name: 'Duplicate Provider ID' },
  ], 'coingecko');

  assert.equal(assessment.resolved, 3);
  assert.equal(assessment.providerIdentityCoveragePct, 100);
  assert.equal(assessment.duplicateSourceAssetKeys, 1);
});

test('identity API declares legacy symbol deduplication and a guarded canonical migration', async () => {
  const source = await read('functions/api/market-identity.js');
  assert.match(source, /currentSnapshotDeduplication: 'legacy-symbol'/);
  assert.match(source, /sourceAssetKeyPrimaryBasis: 'provider\+providerAssetId'/);
  assert.match(source, /canonicalAcrossProviders: false/);
  assert.match(source, /symbolCollisionVisibility: 'not-assessable-after-legacy-symbol-deduplication'/);
  assert.match(source, /nextMigrationGate: 'canonical-registry-plus-consumer-regression'/);
  assert.match(source, /market_snapshot_chunks/);
});
