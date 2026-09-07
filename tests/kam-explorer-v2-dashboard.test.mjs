import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../explorer-dashboard/index.html', import.meta.url), 'utf8');
const stats = await readFile(new URL('../explorer-dashboard/stats.html', import.meta.url), 'utf8');
const tokens = await readFile(new URL('../explorer-dashboard/tokens.html', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-kam-explorer-v2.sh', import.meta.url), 'utf8');

test('KAM Explorer V2 uses verified live data surfaces', () => {
  assert.match(html, /data-kam-explorer-version="2\.0\.0"/);
  assert.match(html, /\/api\/v2\/blocks/);
  assert.match(html, /\/api\/v2\/transactions/);
  assert.match(html, /\/api\/v2\/stats/);
  assert.match(html, /\/api\/v2\/stats\/charts\/transactions/);
  assert.equal(html.includes('https://rpc.kriptoaman.com'), true);
  assert.match(html, /Unavailable data is shown as unavailable—not invented/);
});

test('KAM Statistics V2 uses verified public core data and no localhost Stats dependency', () => {
  assert.match(stats, /data-kam-stats-version="2\.0\.0"/);
  assert.match(stats, /\/api\/v2\/blocks/);
  assert.match(stats, /\/api\/v2\/transactions/);
  assert.match(stats, /\/api\/v2\/stats/);
  assert.match(stats, /\/api\/v2\/stats\/charts\/transactions/);
  assert.match(stats, /Verified-data policy/);
  assert.equal(stats.includes('localhost:8080'), false);
  assert.equal(stats.includes('/api/v1/'), false);
});

test('KAM Token Registry V2 identifies canonical WKAM without deleting indexed contracts', () => {
  assert.match(tokens, /data-kam-tokens-version="2\.0\.0"/);
  assert.match(tokens, /0x0d8848CE88BB09a81a4248Efdd574d50B98b544A/);
  assert.match(tokens, /Canonical WKAM/);
  assert.match(tokens, /\/api\/v2\/tokens\?type=ERC-20/);
  assert.match(tokens, /Other indexed contracts are retained for transparency and are not deleted or rewritten/);
});

test('KAM public V2 surfaces do not ship mockup-only KPI values', () => {
  for (const fake of ['879,719', '3,942 TPS', '21 / 21', '10,000,000,000 KAM', '$1,245,332']) {
    for (const surface of [html, stats, tokens]) assert.equal(surface.includes(fake), false, `mockup-only value must not be shipped: ${fake}`);
  }
});

test('deployment is exact-route, narrow, nginx-safe, and rollback-safe', () => {
  assert.match(deploy, /KAM_EXPLORER_V2_BEGIN/);
  assert.match(deploy, /location = \/ \{/);
  assert.match(deploy, /location = \/stats \{/);
  assert.match(deploy, /location = \/tokens \{/);
  assert.match(deploy, /try_files \/kam-dashboard\/index\.html =404;/);
  assert.match(deploy, /try_files \/kam-dashboard\/stats\.html =404;/);
  assert.match(deploy, /try_files \/kam-dashboard\/tokens\.html =404;/);
  assert.match(deploy, /X-KAM-Explorer-Stats-Version/);
  assert.match(deploy, /X-KAM-Explorer-Tokens-Version/);
  assert.match(deploy, /docker run --rm --network none -i/);
  assert.match(deploy, /-v "\$PROXY_DIR:\/target"/);
  assert.match(deploy, /cp -a \/target\/\$BACKUP_NAME \/target\/default\.conf\.template/);
  assert.match(deploy, /docker compose up -d --force-recreate proxy/);
  assert.doesNotMatch(deploy, /--privileged/);
  assert.doesNotMatch(deploy, /validator|genesis|treasury|private.?key/i);
  assert.match(deploy, /\/tx\/\$KNOWN_TX/);
  assert.match(deploy, /\/token\/\$CANONICAL_WKAM/);
});
