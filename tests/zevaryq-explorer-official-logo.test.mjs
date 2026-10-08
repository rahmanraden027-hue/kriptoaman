import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../explorer-dashboard/', import.meta.url);
const html = await readFile(new URL('zevaryq-production.html', root), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-zevaryq-explorer.sh', import.meta.url), 'utf8');
const approved = [
  ['assets/zevaryq-master-v2.svg', 'a74790a590757e6f4425d384fdc0cdf40cb8030807eb7c0892ba8aaa4e6fc6cc'],
];

test('official ZEVARYQ Identity V2 master asset matches the approved canonical file', async () => {
  for (const [file, expected] of approved) {
    const bytes = await readFile(new URL(file, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, file);
  }
});

test('one official logo is consistently used in header, hero and satellite view', () => {
  assert.match(html, /data-zvq-official-logo="20261008-zevaryq-identity-v2"/);
  assert.match(html, /data-zvq-logo-integrity="sha256-a74790a590757e6f4425d384fdc0cdf40cb8030807eb7c0892ba8aaa4e6fc6cc"/);
  assert.equal((html.match(/class="official-emblem"/g) || []).length, 2);
  assert.equal((html.match(/class="earth-brandmark"/g) || []).length, 1);
  assert.match(html, /class="logo logo-zvq" role="img" aria-label="ZEVARYQ master Z network emblem/);
  assert.equal((html.match(/src="\/zevaryq-assets\/zevaryq-master-v2\.svg\?v=20261008-zevaryq-identity-v2"/g) || []).length, 3);
  assert.match(html, /zevaryq-master-v2\.svg\?v=20261008-zevaryq-identity-v2/);
  assert.equal((html.match(/class="official-logo-fallback"/g) || []).length, 3);
});

test('visual-only logo change preserves mainnet and verified-data safeguards', () => {
  assert.match(html, /const EXPECTED_CHAIN='0x560c'/);
  assert.match(html, /data-zvq-token-discovery="indexed-v2"/);
  assert.match(html, /unavailable values are never simulated/);
  assert.match(html, /setInterval\(probe,12000\)/);
  assert.match(html, /@media\(max-width:560px\)/);
});


test('exact origin image routes prevent HTML catch-all and verify the actual served asset bytes', () => {
  assert.match(deploy, /ZVQ_OFFICIAL_ASSETS_V1/);
  const asset = 'zevaryq-master-v2.svg';
  assert.ok(deploy.includes('location = /zevaryq-assets/' + asset + ' {'), 'missing exact image route: ' + asset);
  assert.ok(deploy.includes('try_files /kam-dashboard/zevaryq-assets/' + asset + ' =404;'), 'asset route must never serve homepage');
  assert.match(deploy, /ZVQ_OFFICIAL_ASSETS_V2/);
  assert.match(deploy, /default_type image\/svg\+xml/);
  assert.match(deploy, /TEMPLATE_BACKUP/);
  assert.match(deploy, /verified_local_asset=\$asset sha256=\$observed/);
  assert.match(deploy, /docker exec "\$\(docker compose ps -q proxy\)" nginx -t/);
  assert.match(deploy, /--force-recreate --no-deps proxy/);
});
