import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../scripts/diagnose-blockscout.mjs', import.meta.url), 'utf8');
const branding = await readFile(new URL('../scripts/apply-kam-explorer-branding.sh', import.meta.url), 'utf8');

test('diagnostic uses only read-only JSON-RPC methods', () => {
  for (const method of ['eth_chainId', 'eth_blockNumber', 'eth_getTransactionReceipt']) {
    assert.match(source, new RegExp(method));
  }
  for (const forbidden of [
    'eth_sendTransaction',
    'eth_sendRawTransaction',
    'personal_sign',
    'eth_sign',
    'wallet_',
    'admin_',
    'debug_',
    'qbft_',
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden));
  }
});

test('diagnostic validates KAM chain identity, Blockscout height and optional chart health', () => {
  assert.match(source, /0x560c/);
  assert.match(source, /\/api\/v2\/blocks/);
  assert.match(source, /\/api\/v2\/stats/);
  assert.match(source, /\/api\/v2\/stats\/charts\/transactions/);
  assert.match(source, /\/api\/v2\/stats\/charts\/market/);
  assert.match(source, /blockscout_stats_chart_api_unhealthy/);
  assert.match(source, /distance <= 5/);
  assert.doesNotMatch(source, /Math\.random/);
});

test('Explorer branding helper hides unverified homepage stats and gas without touching chain services', () => {
  assert.match(branding, /\^NEXT_PUBLIC_HOMEPAGE_CHARTS=/);
  assert.match(branding, /\^NEXT_PUBLIC_HOMEPAGE_STATS=/);
  assert.match(branding, /\^NEXT_PUBLIC_GAS_TRACKER_ENABLED=/);
  assert.match(branding, /NEXT_PUBLIC_HOMEPAGE_CHARTS=\[\]/);
  assert.match(branding, /NEXT_PUBLIC_HOMEPAGE_STATS=\[\]/);
  assert.match(branding, /NEXT_PUBLIC_GAS_TRACKER_ENABLED=false/);
  assert.match(branding, /Placeholder Counter/);
  assert.match(branding, /Gas tracker/);
  assert.match(branding, /docker compose up -d --force-recreate frontend/);
  assert.match(branding, /docker compose restart proxy/);
  assert.doesNotMatch(branding, /docker compose restart (?:db|postgres|indexer|backend)/);
  assert.doesNotMatch(branding, /genesis|validator key|truncate|DROP TABLE/i);
});
