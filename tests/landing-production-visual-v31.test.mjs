import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing v3.1 preserves chain intelligence before verified market pulse', async () => {
  const landing = await read('src/pages/KriptoAmanGlobalLanding.jsx');
  assert.match(landing, /data-ka-production-version="3\.1"/);
  assert.match(landing, /<GLandingHero stats=\{stats\} \/>\s*<PublicChainIntelligence \/>\s*<LandingMarketPulse \/>/);
});

test('landing market pulse reads only KriptoAman-owned market API and fails closed', async () => {
  const pulse = await read('src/components/landing/LandingMarketPulse.jsx');
  assert.match(pulse, /fetch\('\/api\/market-hot'/);
  assert.match(pulse, /NO SYNTHETIC FALLBACK/);
  assert.match(pulse, /Missing values stay unavailable/);
  assert.match(pulse, /COIN_META/);
  assert.doesNotMatch(pulse, /https?:\/\/(api\.)?(coingecko|coinlore|binance)/i);
  assert.doesNotMatch(pulse, /Math\.random/);
});

test('public hero uses recognizable asset imagery and official ZEVARYQ mark', async () => {
  const hero = await read('src/components/landing/GLandingHero.jsx');
  assert.match(hero, /COIN_META\.BTC/);
  assert.match(hero, /COIN_META\.ETH/);
  assert.match(hero, /COIN_META\.SOL/);
  assert.match(hero, /\/brand\/zevaryq-wallet-premium-icon\.webp/);
  assert.match(hero, /PRODUCTION DATA PATH/);
});
