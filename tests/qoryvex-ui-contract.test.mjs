import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [page, radar, api] = await Promise.all([
  readFile(new URL('../src/pages/QoryVExDiscovery.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/market/NewTokenRadar.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../functions/api/zvq-token-intelligence.js', import.meta.url), 'utf8'),
]);

test('QoryVEx public UI preserves evidence-first discovery', () => {
  assert.match(page, /QORYVEX DISCOVERY/);
  assert.match(page, /NewTokenRadar expanded/);
  assert.match(radar, /Asset Passport/);
  assert.match(radar, /Launch DNA/);
  assert.match(radar, /not a safety score/i);
  assert.match(radar, /execution gate: closed/i);
});

test('QoryVEx UI is fed by a WebSocket-first API with explicit first-party polling fallback', () => {
  assert.match(api, /qoryvex\/v1\/discovery/);
  assert.match(api, /first-party-websocket-indexer/);
  assert.match(api, /first-party-json-rpc-fallback/);
  assert.match(api, /externalMarketProviderUsed: false/);
  assert.match(radar, /provenance\?\.transport/);
  assert.match(radar, /Stream P95/);
});

test('discovery surface contains no transaction submission or signing path', () => {
  for (const source of [page, radar, api]) {
    assert.doesNotMatch(source, /eth_sendRawTransaction|personal_|privateKey|mnemonic|seed phrase/i);
  }
});
