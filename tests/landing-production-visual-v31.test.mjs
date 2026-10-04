import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing v3.1 follows the compact production structure with market pulse between block flow and node master', async () => {
  const [landing, deferred] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingDeferredContent.jsx'),
  ]);
  assert.match(landing, /data-ka-production-version="3\.1"/);
  assert.match(landing, /<LandingLiveSystemStrip stats=\{stats\} \/>/);
  assert.match(landing, /<GLandingHero stats=\{stats\} visualReady=\{heroVisualReady\} \/>/);
  assert.match(landing, /<GLandingDeferredContent stats=\{stats\} \/>/);
  assert.match(deferred, /<LiveBlockFlow3D/);
  assert.match(deferred, /compactLanding/);
  assert.match(deferred, /betweenBlockAndNode=\{<LandingMarketPulse \/>\}/);
  assert.doesNotMatch(landing, /<PublicChainIntelligence \/>/);
  assert.doesNotMatch(deferred, /<PublicChainIntelligence \/>/);
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

test('public hero console uses recognizable asset imagery and official ZEVARYQ mark', async () => {
  const console = await read('src/components/landing/GLandingHeroConsole.jsx');
  assert.match(console, /COIN_META\.BTC/);
  assert.match(console, /COIN_META\.ETH/);
  assert.match(console, /COIN_META\.SOL/);
  assert.match(console, /\/brand\/zevaryq-wallet-premium-icon\.webp/);
  assert.match(console, /PRODUCTION DATA PATH/);
});
