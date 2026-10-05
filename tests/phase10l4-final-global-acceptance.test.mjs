import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 10L.4 keeps route-level share metadata consistent with the root contract', async () => {
  const [html, routeSeo] = await Promise.all([
    read('index.html'),
    read('src/lib/RouteSeo.jsx'),
  ]);
  for (const source of [html, routeSeo]) {
    assert.match(source, /image\/webp/);
    assert.match(source, /1024/);
    assert.match(source, /summary/);
    assert.match(source, /@KriptoAman/);
  }
  assert.doesNotMatch(routeSeo, /summary_large_image/);
  assert.match(routeSeo, /og:image:secure_url/);
  assert.match(routeSeo, /og:image:width/);
  assert.match(routeSeo, /og:image:height/);
});

test('Phase 10L.4 global acceptance is read-only and covers five production viewport classes', async () => {
  const script = await read('scripts/verify-phase10l4-global-acceptance.mjs');
  for (const marker of [
    'compact-mobile-360',
    'mobile-390',
    'large-mobile-430',
    'tablet-768',
    'desktop-1440',
    'robots.txt',
    'sitemap.xml',
    'kriptoaman-mark-premium.webp',
    '/api/market-snapshot-page',
    '/api/kam/network-status',
    '/api/zvq-token-intelligence',
    'PHASE10L4_GLOBAL_ACCEPTANCE=PASS',
    'CLS must stay <= 0.15',
  ]) assert.ok(script.includes(marker), marker);
  assert.match(script, /scrollWidth <= config\.width \+ 1/);
  assert.match(script, /searchWidth >= 44/);
  assert.match(script, /politeStatusCount >= 2/);
  assert.match(script, /Math\.abs\(onChainBlock - networkBlock\) <= 25/);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|wallet_requestPermissions|personal_|private[_ -]?key/i);
});

test('Phase 10L.4 workflow locks source on PR and live production after merge and on schedule', async () => {
  const workflow = await read('.github/workflows/phase10l4-global-acceptance.yml');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
  assert.match(workflow, /Allow production deployment to settle/);
  assert.match(workflow, /sleep 60/);
  assert.match(workflow, /verify-phase10l4-global-acceptance\.mjs/);
  assert.match(workflow, /retention-days: 30/);
});
