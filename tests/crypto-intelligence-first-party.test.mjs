import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('primary market surface is crypto-only and removes forex/gold hub', async () => {
  const page = await read('src/pages/MarketGlobal.jsx');
  assert.match(page, /FirstPartyCryptoIntelligenceStrip/);
  assert.doesNotMatch(page, /GlobalMarketsHubV2/);
});

test('first-party ZEVARYQ discovery reads only KriptoAman RPC', async () => {
  const api = await read('functions/api/zvq-first-party-discovery.js');
  assert.match(api, /https:\/\/rpc\.kriptoaman\.com\//);
  assert.match(api, /eth_chainId/);
  assert.match(api, /eth_blockNumber/);
  assert.match(api, /eth_getBlockByNumber/);
  assert.match(api, /externalMarketProviderUsed: false/);
  assert.doesNotMatch(api, /coingecko|coinlore|cryptocompare|frankfurter|twelve data/i);
});

test('first-party UI does not overclaim contract creation as listing', async () => {
  const ui = await read('src/components/market/FirstPartyCryptoIntelligenceStrip.jsx');
  assert.match(ui, /FIRST-PARTY LIVE/);
  assert.match(ui, /Contract creation ≠ token listing or endorsement/);
  assert.match(ui, /State: observed, not finalized/);
});

test('architecture requires provenance, reorg handling and explicit unavailable state', async () => {
  const doc = await read('docs/KRIPTOAMAN_FIRST_PARTY_INTELLIGENCE_ARCHITECTURE.md');
  assert.match(doc, /FIRST_PARTY_LIVE/);
  assert.match(doc, /reorg handling/);
  assert.match(doc, /UNAVAILABLE/);
  assert.match(doc, /block-to-index latency/);
  assert.match(doc, /No UI may claim first-party coverage/);
});


test('first-party WebSocket live state requires a confirmed subscription and rollback covers partial apply failures', async () => {
  const [listener, deploy, workflow] = await Promise.all([
    read('services/kriptoaman-indexer/zvq-listener.mjs'),
    read('scripts/deploy-kriptoaman-zvq-indexer.sh'),
    read('.github/workflows/kriptoaman-first-party-indexer.yml'),
  ]);
  assert.match(listener, /const fresh = wsSubscribed && headFresh/);
  assert.match(listener, /websocketSubscribed: wsSubscribed/);
  assert.match(deploy, /WebSocket subscription not confirmed/);
  assert.match(workflow, /failure\(\) && steps\.apply\.outcome != 'skipped'/);
});


test('phase 2 exposes evidence-safe contract radar with truthful websocket index latency', async () => {
  const [listener, workflow] = await Promise.all([
    read('services/kriptoaman-indexer/zvq-listener.mjs'),
    read('.github/workflows/kriptoaman-first-party-indexer.yml'),
  ]);
  assert.match(listener, /websocket-received-to-indexed/);
  assert.match(listener, /block-timestamp-to-websocket-received/);
  assert.match(listener, /\/v1\/radar/);
  assert.match(listener, /UNVERIFIED_CONTRACT_CREATION/);
  assert.match(listener, /externalMarketProviderUsed: false/);
  assert.match(listener, /Contract creation is not proof of token standard, liquidity, listing, safety, or endorsement/);
  assert.match(workflow, /Prove first-party WebSocket block-to-index latency/);
  assert.match(workflow, /latest_head > first_head/);
  assert.match(workflow, /indexP95Ms/);
});
