import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('New Token Radar uses only first-party ZEVARYQ chain evidence', async () => {
  const api = await read('functions/api/zvq-token-intelligence.js');
  assert.match(api, /https:\/\/rpc\.kriptoaman\.com\//);
  assert.match(api, /EXPECTED_CHAIN = '0x560c'/);
  assert.match(api, /eth_getBlockByNumber/);
  assert.match(api, /eth_getTransactionReceipt/);
  assert.match(api, /eth_getCode/);
  assert.match(api, /eth_call/);
  assert.match(api, /externalMarketProviderUsed: false/);
  assert.doesNotMatch(api, /coingecko|coinmarketcap|coinlore|cryptocompare|twelve.?data|dexscreener|birdeye/i);
});

test('ERC-20-like discovery requires metadata evidence and does not turn contract creation into listing', async () => {
  const api = await read('functions/api/zvq-token-intelligence.js');
  assert.match(api, /name: '0x06fdde03'/);
  assert.match(api, /symbol: '0x95d89b41'/);
  assert.match(api, /decimals: '0x313ce567'/);
  assert.match(api, /totalSupply: '0x18160ddd'/);
  assert.match(api, /tokenMetadataProven = Boolean\(name && symbol && decimals != null && totalSupplyRaw != null\)/);
  assert.match(api, /contractCreationIsTokenListing: false/);
  assert.match(api, /tokenMetadataIsAudit: false/);
  assert.match(api, /tokenMetadataIsEndorsement: false/);
});

test('Launch DNA remains descriptive and QoryVEx execution stays gated without pool evidence', async () => {
  const [api, ui] = await Promise.all([
    read('functions/api/zvq-token-intelligence.js'),
    read('src/components/market/NewTokenRadar.jsx'),
  ]);
  assert.match(api, /Descriptive on-chain launch profile; not a safety score, audit, endorsement, or price prediction/);
  assert.match(api, /poolEvidence: 'UNAVAILABLE'/);
  assert.match(api, /liquidityEvidence: 'UNAVAILABLE'/);
  assert.match(api, /executionState: 'DISABLED'/);
  assert.match(ui, /Asset Passport/);
  assert.match(ui, /Launch DNA/);
  assert.match(ui, /QoryVEx Discovery/);
  assert.match(ui, /not a safety score/i);
});

test('QoryVEx Discovery is public and New Token Radar is surfaced on the crypto market', async () => {
  const [market, config, app, page] = await Promise.all([
    read('src/pages/MarketGlobal.jsx'),
    read('src/pages.config.js'),
    read('src/App.jsx'),
    read('src/pages/QoryVExDiscovery.jsx'),
  ]);
  assert.match(market, /NewTokenRadar/);
  assert.match(config, /QoryVExDiscovery/);
  assert.match(app, /'QoryVExDiscovery'/);
  assert.match(app, /'\/qoryvex\/discovery'/);
  assert.match(page, /NewTokenRadar expanded/);
});



test('QoryVEx prefers the first-party WebSocket indexer and labels JSON-RPC polling as fallback', async () => {
  const [api, ui] = await Promise.all([
    read('functions/api/zvq-token-intelligence.js'),
    read('src/components/market/NewTokenRadar.jsx'),
  ]);
  assert.match(api, /qoryvex\/v1\/discovery/);
  assert.match(api, /first-party-websocket-indexer/);
  assert.match(api, /first-party-json-rpc-fallback/);
  assert.match(api, /WebSocket\+JSON-RPC indexer/);
  assert.match(api, /confirmation-aware-reorg-tracked/);
  assert.match(ui, /Stream P95/);
  assert.match(ui, /Confirmation-aware · reorg-tracked/);
  assert.doesNotMatch(api, /eth_sendRawTransaction|personal_|admin_|debug_/);
});

test('production smoke proves QoryVEx route and first-party token intelligence contract', async () => {
  const smoke = await read('.github/workflows/live-site-smoke.yml');
  assert.match(smoke, /qoryvex\/discovery/);
  assert.match(smoke, /api\/zvq-token-intelligence/);
  assert.match(smoke, /payload\?\.chainId !== 22028/);
  assert.match(smoke, /payload\?\.provenance\?\.ownership !== 'first-party'/);
  assert.match(smoke, /externalMarketProviderUsed !== false/);
  assert.match(smoke, /contractCreationIsTokenListing !== false/);
  assert.match(smoke, /executionEnabled !== false/);
});

test('QoryVEx final production page preserves the five-stage evidence architecture', async () => {
  const page = await read('src/pages/QoryVExDiscovery.jsx');
  for (const label of ['ZEVARYQ Mainnet', 'New Token Radar', 'Asset Passport', 'Launch DNA', 'QoryVEx Discovery']) {
    assert.equal(page.includes(label), true, label);
  }
  assert.match(page, /No sample token, fabricated address, or synthetic liquidity/);
  assert.match(page, /Execution remains gated/);
  assert.doesNotMatch(page, /eth_sendRawTransaction|privateKey|mnemonic|seed phrase/i);
});
