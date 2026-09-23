import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../explorer-dashboard/zevaryq-production.html', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../scripts/deploy-zevaryq-explorer.sh', import.meta.url), 'utf8');

test('Zevaryq production identity and chain are explicit', () => {
  assert.match(html, /data-zevaryq-explorer-version="1\.1\.0"/);
  assert.match(html, /ZEVARYQ EXPLORER/);
  assert.match(html, /Zevaryq Network/);
  assert.match(html, /ZVQ Mainnet/);
  assert.match(html, /Chain ID <b>22028/);
  assert.equal(html.includes("EXPECTED_CHAIN='0x560c'"), true);
});

test('premium Zevaryq emblem is wired to header, hero, satellite view and favicon', () => {
  assert.equal((html.match(/\ssrc="\/zevaryq-assets\/zevaryq-emblem\.webp/g) || []).length, 3);
  assert.doesNotMatch(html, /data:image\/(webp|png);base64/);
  assert.ok(Buffer.byteLength(html) < 100_000, 'Explorer HTML must not embed its 3 emblem images or favicon');
  assert.match(html, /rel="icon"[^>]+zevaryq-favicon\.png/);
  assert.match(html, /class="brand-gold">ZEVARYQ/);
  assert.doesNotMatch(html, /<span class="logo">ZV<\/span>/);
  assert.match(html, /\.earth:after\{content:none\}/);
});

test('required production panels and search routes exist', () => {
  for (const marker of [
    'Satellite Network View', 'Consensus & Finality', 'Global Node Topology',
    'Network Performance', 'Infrastructure Status', 'Security Intelligence',
    'Network Activity Flow', 'Mempool & Fee Intelligence',
    'Validator Intelligence', 'Realtime Block Stream', 'Latest Blocks',
  ]) assert.equal(html.includes(marker), true, 'missing panel: ' + marker);
  for (const route of ['/block/', '/tx/', '/address/']) {
    assert.equal(html.includes(route), true, 'missing route: ' + route);
  }
  assert.equal(html.includes('setInterval(probe,12000)'), true);
  assert.match(html, /Live Blockchain Mesh/);
  assert.match(html, /id="refreshData"/);
  assert.match(html, /parent_hash\.toLowerCase\(\)===parent\.hash\.toLowerCase\(\)/);
  assert.ok(html.includes("for(const url of [RPC,'https://rpc.kriptoaman.com'])"));
  assert.match(html, /if\(state\.probing\)return/);
});

test('unverified values fail closed', () => {
  for (const fake of ['21 / 21', '128+ nodes', '3.4 TPS', '1,236 pending transactions', '100% Secure']) {
    assert.equal(html.includes(fake), false, 'mockup-only value shipped: ' + fake);
  }
  assert.match(html, /Topology data unavailable/);
  assert.match(html, /Mempool telemetry unavailable/);
  assert.match(html, /No values are estimated/);
});

test('deployment is narrow and rollback safe', () => {
  assert.equal(deploy.includes('kam-dashboard/index.html'), true);
  assert.match(deploy, /rollback/);
  assert.equal(deploy.includes('0x560c'), true);
  assert.equal(deploy.includes('kriptoaman.com/*'), false);
  assert.doesNotMatch(deploy, /genesis|validator private|postgres.*reset|redis.*reset/i);
});


test('legacy KAM deployment cannot overwrite protected ZEVARYQ homepage', async () => {
  const legacy = await readFile(new URL('../scripts/deploy-kam-explorer-v2.sh', import.meta.url), 'utf8');
  const v2Workflow = await readFile(new URL('../.github/workflows/kam-explorer-v2-deploy.yml', import.meta.url), 'utf8');
  const priorityWorkflow = await readFile(new URL('../.github/workflows/kam-explorer-priority-upgrade.yml', import.meta.url), 'utf8');
  const guard = legacy.indexOf('Protected ZEVARYQ homepage installed');
  const legacyWrite = legacy.indexOf('cat > /target/kam-dashboard/index.html');
  assert.ok(guard >= 0 && legacyWrite > guard, 'legacy deploy must reject ZVQ before writing homepage');
  assert.equal(v2Workflow.split("if: ${{ github.event_name == 'workflow_dispatch' }}").length - 1, 3);
  assert.ok(v2Workflow.includes("!explorer-dashboard/zevaryq-production.html"));
  assert.ok(v2Workflow.includes("!explorer-dashboard/assets/**"));
  assert.equal(priorityWorkflow.split("if: ${{ github.event_name == 'workflow_dispatch' }}").length - 1, 3);
  assert.doesNotMatch(priorityWorkflow, /^  workflow_run:/m);
});
