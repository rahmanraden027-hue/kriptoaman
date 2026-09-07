import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../explorer-dashboard/index.html', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-kam-explorer-v2.sh', import.meta.url), 'utf8');

test('KAM Explorer V2 uses verified live data surfaces', () => {
  assert.match(html, /data-kam-explorer-version="2\.0\.0"/);
  assert.match(html, /\/api\/v2\/blocks/);
  assert.match(html, /\/api\/v2\/transactions/);
  assert.match(html, /\/api\/v2\/stats/);
  assert.match(html, /\/api\/v2\/stats\/charts\/transactions/);
  assert.match(html, /https:\/\/rpc\.kriptoaman\.com/);
  assert.match(html, /Unavailable data is shown as unavailable—not invented/);
});

test('KAM Explorer V2 does not ship mockup-only KPI values', () => {
  for (const fake of ['879,719', '3,942 TPS', '21 / 21', '10,000,000,000 KAM', '$1,245,332']) {
    assert.equal(html.includes(fake), false, `mockup-only value must not be shipped: ${fake}`);
  }
});

test('deployment is homepage-only and rollback-safe', () => {
  assert.match(deploy, /KAM_EXPLORER_V2_BEGIN/);
  assert.match(deploy, /location = \/ /);
  assert.match(deploy, /cp -a "\$BACKUP" "\$TEMPLATE"/);
  assert.match(deploy, /docker compose up -d --force-recreate proxy/);
  assert.doesNotMatch(deploy, /validator|genesis|treasury|private.?key/i);
  assert.match(deploy, /\/api\/v2\/blocks/);
  assert.match(deploy, /\/tx\/\$KNOWN_TX/);
});
