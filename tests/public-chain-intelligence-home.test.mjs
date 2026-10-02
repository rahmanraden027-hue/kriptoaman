import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing exposes Chain Intelligence before account actions', async () => {
  const [page, surface] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/PublicChainIntelligence.jsx'),
  ]);
  assert.match(page, /<GLandingHero stats=\{stats\} \/>\s*<PublicChainIntelligence \/>/);
  assert.match(surface, /CHAIN INTELLIGENCE OS/);
  assert.match(surface, /Universal Intelligence Search/);
  assert.match(surface, /GENESIS RADAR/);
  assert.match(surface, /INTELLIGENCE GRAPH/);
  assert.match(surface, /PROOF ENGINE/);
});

test('public intelligence uses only first-party evidence-gated endpoints and fails closed', async () => {
  const surface = await read('src/components/landing/PublicChainIntelligence.jsx');
  assert.match(surface, /\/api\/intelligence-graph/);
  assert.match(surface, /\/api\/zvq-first-party-discovery/);
  assert.match(surface, /Number\(p\?\.chainId\) === 22028/);
  assert.match(surface, /UNAVAILABLE/);
  assert.match(surface, /INTELLIGENCE GRAPH/);
  assert.match(surface, /TRUTH POLICY/);
  assert.match(surface, /Unavailable is never converted to zero/);
  assert.match(surface, /graph\?\.graph\?\.nodes/);
  assert.match(surface, /graph\?\.graph\?\.edges/);
  assert.match(surface, /discovery\?\.observation\?\.contractCreations/);
  assert.match(surface, /\/asset-passport\/\$\{value\}/);
  assert.doesNotMatch(surface, /coingecko|coinmarketcap|dexscreener|birdeye/i);
  assert.doesNotMatch(surface, /eth_sendTransaction|eth_sendRawTransaction|privateKey|mnemonic|seed phrase/i);
});


test('final public hero presents the evidence-first intelligence identity', () => {
  const hero = readFileSync(join(root, 'src/components/landing/GLandingHero.jsx'), 'utf8');
  assert.match(hero, /GLOBAL CHAIN INTELLIGENCE/);
  assert.match(hero, /Lihat\. Pahami\. Verifikasi\./);
  assert.match(hero, /Global Intelligence Core/);
  assert.match(hero, /PROOF OF FRESHNESS/);
  assert.match(hero, /assetCount/);
  assert.match(hero, /zvqBlockNumber/);
});
