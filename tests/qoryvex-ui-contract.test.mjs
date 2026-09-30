import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../src/pages/QoryVExDiscovery.jsx', import.meta.url), 'utf8');

test('QoryVEx UI consumes only the first-party discovery endpoint', () => {
  assert.match(page, /https:\/\/rpc\.kriptoaman\.com\/qoryvex\/v1\/discovery/);
  assert.match(page, /chainId\) === 22028/);
  assert.match(page, /chainIdHex === '0x560c'/);
  assert.match(page, /No synthetic fallback data is shown|does not fabricate token listings/);
});

test('QoryVEx UI exposes Asset Passport and Launch DNA without trade execution', () => {
  assert.match(page, /Asset Passport/);
  assert.match(page, /Launch DNA/);
  assert.match(page, /not an audit or investment recommendation|do not establish audit status/);
  assert.doesNotMatch(page, /eth_sendRawTransaction|privateKey|mnemonic|seed phrase/i);
});
