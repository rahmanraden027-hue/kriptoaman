import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 2 uses only the first-party liquidity evidence endpoint', async () => {
  const api = await read('functions/api/intelligence-graph.js');
  assert.match(api, /LIQUIDITY_SOURCE_PATH = '\/api\/zvq-liquidity-evidence'/);
  assert.match(api, /poolEvidence === 'FIRST_PARTY_ON_CHAIN'/);
  assert.match(api, /provenance\?\.ownership === 'first-party'/);
  assert.match(api, /externalMarketProviderUsed === false/);
  assert.doesNotMatch(api, /dexscreener|coingecko|coinmarketcap|birdeye/i);
});

test('Pool and DEX relationships require proven registry, pair and token identity', async () => {
  const api = await read('functions/api/intelligence-graph.js');
  assert.match(api, /router && factory && pair && identityOk && provenanceOk/);
  assert.match(api, /'DEX'/);
  assert.match(api, /'POOL'/);
  assert.match(api, /'FACTORY_PROVES_POOL'/);
  assert.match(api, /'MEMBER_OF_VERIFIED_POOL'/);
  assert.match(api, /poolDexRelationshipsEnabled: poolDexProven/);
});

test('Liquidity and trade remain fail closed', async () => {
  const api = await read('functions/api/intelligence-graph.js');
  assert.match(api, /liquidityEvidenceState: liquidityState/);
  assert.match(api, /tradeRelationshipsEnabled: false/);
  assert.match(api, /'TRADE'/);
  assert.match(api, /transactionSubmissionEnabled: false/);
  assert.doesNotMatch(api, /eth_sendTransaction|eth_sendRawTransaction|privateKey|mnemonic|seed phrase|signer/i);
});
