import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Intelligence Graph Phase 1 derives only from verified first-party evidence', async () => {
  const api = await read('functions/api/intelligence-graph.js');
  assert.match(api, /SOURCE_PATH = '\/api\/zvq-token-intelligence'/);
  assert.match(api, /payload\?\.status !== 'live'/);
  assert.match(api, /payload\?\.chainId !== CHAIN_ID/);
  assert.match(api, /HEAD_EVIDENCE_INCOMPLETE/);
  assert.match(api, /derived-from-first-party-evidence/);
  assert.match(api, /externalMarketProviderUsed: false/);
  assert.doesNotMatch(api, /coingecko|coinmarketcap|dexscreener|birdeye/i);
});

test('Graph nodes and relationships remain evidence-bound and fail closed', async () => {
  const api = await read('functions/api/intelligence-graph.js');
  for (const type of ["'CHAIN'", "'BLOCK'", "'TRANSACTION'", "'WALLET'", "'CONTRACT'", "'TOKEN'"]) assert.match(api, new RegExp(type));
  assert.match(api, /blockNumber, blockHash, transactionHash: txHash/);
  assert.match(api, /item\?\.type === 'ERC20_METADATA_PROVEN'/);
  assert.match(api, /evidenceState === 'FIRST_PARTY_LIVE'/);
  assert.match(api, /inferredRelationshipsAllowed: false/);
  assert.match(api, /unavailableRelationships:/);
  assert.match(api, /poolDexRelationshipsEnabled: poolDexProven/);
  assert.match(api, /tradeRelationshipsEnabled: false/);
});

test('Phase 1 graph is read-only and contains no signer or transaction submission path', async () => {
  const api = await read('functions/api/intelligence-graph.js');
  assert.match(api, /transactionSubmissionEnabled: false/);
  assert.doesNotMatch(api, /eth_sendTransaction|eth_sendRawTransaction|privateKey|mnemonic|seed phrase|signer/i);
});
